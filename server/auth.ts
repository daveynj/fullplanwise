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
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 1); // Token valid for 1 hour
  
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
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
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

  app.post("/api/register", async (req, res, next) => {
    try {
      console.log("Registration attempt:", { 
        username: req.body.username,
        email: req.body.email,
        // don't log password
        hasPassword: !!req.body.password
      });
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        console.log("Registration failed: Username already exists");
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser({
        ...req.body,
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
      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      console.log(`Password reset requested for email: ${email}`);
      
      // Find user by email
      const users = await storage.getUsersByEmail(email);
      if (!users || users.length === 0) {
        // For security, don't reveal that email doesn't exist
        return res.status(200).json({ 
          message: "If an account with that email exists, a password reset link has been sent." 
        });
      }
      
      const user = users[0];
      const { token } = await createResetToken(user);
      
      // In a real app, we would send an email here with a reset link
      // For this implementation, we'll just return the token directly
      // This is NOT secure for production, but works for demonstration
      
      console.log(`Reset token generated for user ${user.id}: ${token}`);
      
      res.status(200).json({
        message: "If an account with that email exists, a password reset link has been sent.",
        // Only include the token in development - REMOVE THIS IN PRODUCTION
        // In production, this would be sent via email only
        token: process.env.NODE_ENV !== 'production' ? token : undefined
      });
    } catch (error: any) {
      console.error('Password reset request error:', error);
      res.status(500).json({ message: "Error processing password reset request" });
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
      
      if (!token || !password) {
        return res.status(400).json({ message: "Token and password are required" });
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
      
      console.log(`Password successfully reset for user ${user.id} (${user.username})`);
      
      res.status(200).json({ message: "Password successfully reset" });
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
          // If exists, update credits to ensure they have enough for testing
          testUser = await storage.updateUserCredits(testUser.id, 10);
          
          // Login the user
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
