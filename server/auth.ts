import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";

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
