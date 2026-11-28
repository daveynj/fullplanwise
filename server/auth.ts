import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { v4 as uuidv4 } from "uuid";
import { mailchimpService } from "./services/mailchimp.service";
import { restrictRegistrationCountry } from "./registration-country";
import { sendGaEvent, SERVER_TRACKED_HEADER } from "./ga-measurement";
import { isEmailAddress, mailConfig, sendMail } from "./mailer";
import { buildPasswordResetEmail, RecentLimit, RESET_LINK_MINUTES } from "./password-reset-email";
import { publicAppUrl } from "./public-app-url";

// Reset requests: a few an hour for one address, and a ceiling per visitor,
// so the form can't be used to flood someone's inbox.
const resetLimitByEmail = new RecentLimit(3, 60 * 60 * 1000);
const resetLimitByVisitor = new RecentLimit(10, 60 * 60 * 1000);
const RESET_SENT_MESSAGE = "If an account with that email exists, a password reset link has been sent.";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  try {
    if (!stored || !stored.includes('.')) {
      console.log('Password comparison failed: Invalid stored password format');
      return false;
    }
    
    const [hashed, salt] = stored.split(".");
    const hashedBuf = Buffer.from(hashed, "hex");
    const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
    
    const result = timingSafeEqual(hashedBuf, suppliedBuf);
    console.log(`Password comparison result: ${result ? 'success' : 'failed'}`);
    return result;
  } catch (err) {
    console.error('Error comparing passwords:', err);
    return false;
  }
}

// Create a reset token for a user
async function createResetToken(user: SelectUser) {
  const token = uuidv4();
  const expiresAt = new Date(Date.now() + RESET_LINK_MINUTES * 60 * 1000);
  
  // Update user with reset token and expiration date
  await storage.updateUser(user.id, {
    resetPasswordToken: token,
    resetPasswordExpires: expiresAt
  });
  
  return {
    token,
    expiresAt
  };
}

// Validate a reset token
async function validateResetToken(token: string) {
  try {
    // Find user with matching token
    const users = await storage.getUserByResetToken(token);
    if (!users || users.length === 0) {
      console.log('Reset token validation failed: No matching token found');
      return null;
    }
    
    const user = users[0];
    
    // Check if token is expired
    const now = new Date();
    if (!user.resetPasswordExpires || user.resetPasswordExpires < now) {
      console.log('Reset token validation failed: Token expired');
      return null;
    }
    
    return user;
  } catch (err) {
    console.error('Error validating reset token:', err);
    return null;
  }
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "esl-lesson-ai-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        // Try to find user by username first
        let user = await storage.getUserByUsername(username);
        
        // If not found by username, try by email (capital letters don't matter).
        // When two accounts share an address apart from capitals, sign in the
        // one whose password matches.
        if (!user) {
          for (const candidate of await storage.getUsersByEmail(username)) {
            if (await comparePasswords(password, candidate.password)) return done(null, candidate);
          }
          return done(null, false);
        }

        if (!(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (err) {
        return done(err);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Creating an account also starts its free trial. Check the country before
  // any database writes, password hashing, login or marketing-list enrollment.
  app.post("/api/register", restrictRegistrationCountry, async (req, res, next) => {
    try {
      const rawEmail = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
      let username = typeof req.body.username === "string" ? req.body.username.trim() : "";

      console.log("Registration attempt:", { 
        username: username || "(auto)",
        email: rawEmail,
        // don't log password
        hasPassword: !!req.body.password
      });

      // Reject registration when the email is already in use
      if (rawEmail) {
        const usersWithEmail = await storage.getUsersByEmail(rawEmail);
        if (usersWithEmail.length > 0) {
          console.log("Registration failed: Email already in use");
          return res.status(409).json({ message: "An account with that email already exists" });
        }
      }

      if (username) {
        const existingUser = await storage.getUserByUsername(username);
        if (existingUser) {
          console.log("Registration failed: Username already exists");
          return res.status(400).json({ message: "Username already exists" });
        }
      } else {
        const base = (rawEmail.split("@")[0] || req.body.fullName || "teacher")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "")
          .slice(0, 18) || "teacher";
        username = base;
        let suffix = 0;
        while (await storage.getUserByUsername(username)) {
          suffix += 1;
          username = `${base}${suffix === 1 ? Math.floor(100 + Math.random() * 900) : Math.floor(1000 + Math.random() * 9000)}`;
        }
      }

      const user = await storage.createUser({
        ...req.body,
        email: rawEmail || req.body.email,
        username,
        password: await hashPassword(req.body.password),
      });
      
      console.log(`User created successfully with ID: ${user.id}`);
      
      // Add user to email marketing list (Mailchimp)
      if (req.body.email) {
        try {
          // Extract name parts if fullName is provided
          let firstName = undefined;
          let lastName = undefined;
          
          if (req.body.fullName) {
            const nameParts = req.body.fullName.split(' ');
            if (nameParts.length > 0) {
              firstName = nameParts[0];
              if (nameParts.length > 1) {
                lastName = nameParts.slice(1).join(' ');
              }
            }
          }
          
          // Add to Mailchimp list
          const mailchimpResult = await mailchimpService.addMember(
            req.body.email,
            firstName,
            lastName
          );
          
          if (mailchimpResult.success) {
            console.log(`User ${user.id} added to email marketing list`);
          } else {
            console.log(`Failed to add user ${user.id} to email marketing list: ${mailchimpResult.error}`);
          }
        } catch (emailError) {
          // Log but don't fail registration if marketing list addition fails
          console.error('Error adding user to marketing list:', emailError);
        }
      }

      // Report the sign-up to Google Analytics from the server, so ad blockers
      // can't lose it; the browser only sends it when this didn't work.
      if (await sendGaEvent(req.headers.cookie, "sign_up", { method: "email" }, { timeoutMs: 1500 })) {
        res.setHeader(SERVER_TRACKED_HEADER, "sign_up");
      }

      req.login(user, (err) => {
        if (err) {
          console.log("Login after registration failed:", err);
          return next(err);
        }
        // Remove password from the response
        const { password, ...userWithoutPassword } = user;
        console.log("Registration complete, user logged in");
        res.status(201).json(userWithoutPassword);
      });
    } catch (err) {
      console.error("Registration error:", err);
      next(err);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login attempt:", { 
      username: req.body.username,
      // don't log password
      hasPassword: !!req.body.password
    });
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.log("Login error:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login failed: Invalid credentials");
        return res.status(401).json({ message: "Invalid credentials" });
      }
      
      console.log(`User found: ${user.id} (${user.username})`);
      
      req.login(user, (err) => {
        if (err) {
          console.log("Session creation error:", err);
          return next(err);
        }
        // Track last login time (fire-and-forget)
        storage.updateLastLogin(user.id).catch(() => {});
        // Remove password from the response
        const { password, ...userWithoutPassword } = user;
        console.log("Login successful");
        res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    // Remove password from the response
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    res.json(userWithoutPassword);
  });
  
  // Password reset request endpoint
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      // Too many requests from one visitor is the only case that answers differently.
      if (!resetLimitByVisitor.allow(req.ip || "unknown")) {
        return res.status(429).json({ message: "Too many reset requests. Please try again in an hour." });
      }
      // The same answer whether or not the address has an account, so the
      // form can't be used to find out who has one.
      const sent = () => res.status(200).json({ message: RESET_SENT_MESSAGE });
      if (!isEmailAddress(email) || !resetLimitByEmail.allow(email.toLowerCase())) {
        return sent();
      }

      const users = await storage.getUsersByEmail(email);
      if (!users || users.length === 0) {
        return sent();
      }

      const user = users[0];
      const { token } = await createResetToken(user);
      const link = `${publicAppUrl()}/reset-password/${token}`;
      // Never log the token or the link.
      console.log(`Reset link created for user ${user.id}`);

      if (mailConfig()) {
        // Not awaited: the answer must not take longer for a real account.
        void sendMail(buildPasswordResetEmail(user.email, user.fullName, link))
          .then(() => console.log(`Reset email sent for user ${user.id}`))
          .catch((error) => console.error(`Reset email FAILED for user ${user.id}:`, error?.message ?? error));
      } else {
        console.error("[Mail] SMTP_USER / SMTP_PASS are not set: the reset email was NOT sent.");
      }

      res.status(200).json({
        message: RESET_SENT_MESSAGE,
        // Only expose the token in development; never in any other environment
        token: process.env.NODE_ENV === 'development' ? token : undefined
      });
    } catch (error: any) {
      console.error('Password reset request error:', error?.message ?? error);
      res.status(500).json({ message: "Error processing password reset request" });
    }
  });

  // Admin: is email sending set up, and does it work? Sends one test message
  // to the admin's own address (never to anyone else).
  app.post("/api/admin/mail-test", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const admin = req.user as SelectUser;
    if (!admin.isAdmin) return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
    if (!mailConfig()) return res.status(200).json({ configured: false, sent: false, message: "SMTP_USER and SMTP_PASS are not set." });
    try {
      await sendMail({
        to: admin.email,
        subject: "PlanWise ESL email test",
        text: "This is a test from PlanWise ESL. If you can read it, password reset emails will be delivered.",
      });
      res.status(200).json({ configured: true, sent: true, to: admin.email });
    } catch (error: any) {
      res.status(200).json({ configured: true, sent: false, step: error?.step ?? null, code: error?.code ?? null, message: error?.message ?? "Unknown error" });
    }
  });

  // Validate reset token endpoint
  app.get("/api/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      if (!token) {
        return res.status(400).json({ message: "Token is required" });
      }
      
      const user = await validateResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }
      
      res.status(200).json({ message: "Token is valid", username: user.username });
    } catch (error: any) {
      console.error('Token validation error:', error);
      res.status(500).json({ message: "Error validating token" });
    }
  });
  
  // Reset password endpoint
  app.post("/api/reset-password/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const { password } = req.body;
      
      if (!token || typeof password !== "string" || !password) {
        return res.status(400).json({ message: "Token and password are required" });
      }
      // The same rule as the reset form.
      if (password.length < 8 || password.length > 200) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      const user = await validateResetToken(token);
      if (!user) {
        return res.status(400).json({ message: "Invalid or expired token" });
      }

      // Update the password
      const hashedPassword = await hashPassword(password);
      await storage.updateUser(user.id, { 
        password: hashedPassword,
        resetPasswordToken: null,
        resetPasswordExpires: null
      });
      
      console.log(`Password successfully reset for user ${user.id}`);

      // They have just proved the email address is theirs: sign them in, so
      // they don't have to type the new password again.
      const updated = (await storage.getUser(user.id)) ?? user;
      req.login(updated, (loginError) => {
        if (loginError) {
          console.error("Sign-in after password reset failed:", loginError?.message ?? loginError);
          return res.status(200).json({ message: "Password successfully reset", signedIn: false });
        }
        storage.updateLastLogin(user.id).catch(() => {});
        res.status(200).json({ message: "Password successfully reset", signedIn: true });
      });
    } catch (error: any) {
      console.error('Password reset error:', error);
      res.status(500).json({ message: "Error resetting password" });
    }
  });

  // Development only endpoint to create/reset a test user
  if (process.env.NODE_ENV !== 'production') {
    app.post("/api/dev/create-test-user", async (req, res, next) => {
      try {
        // Check if test user already exists
        const testUsername = "testuser";
        let testUser = await storage.getUserByUsername(testUsername);
        
        if (testUser) {
          // Login the existing user
          req.login(testUser, (err) => {
            if (err) return next(err);
            // Remove password from the response
            const { password, ...userWithoutPassword } = testUser as SelectUser;
            return res.status(200).json({ 
              message: "Test user refreshed and logged in",
              user: userWithoutPassword 
            });
          });
        } else {
          // Create a new test user
          const newTestUser = await storage.createUser({
            username: testUsername,
            password: await hashPassword("testpassword"),
            email: "test@example.com",
            fullName: "Test User"
          });
          
          // Create a sample student
          await storage.createStudent({
            teacherId: newTestUser.id,
            name: "Sample Student",
            cefrLevel: "B1",
            email: "student@example.com",
            notes: "Sample student for testing"
          });
          
          // Login the user
          req.login(newTestUser, (err) => {
            if (err) return next(err);
            // Remove password from the response
            const { password, ...userWithoutPassword } = newTestUser as SelectUser;
            return res.status(201).json({ 
              message: "Test user created and logged in",
              user: userWithoutPassword 
            });
          });
        }
      } catch (err) {
        next(err);
      }
    });
  }
}
