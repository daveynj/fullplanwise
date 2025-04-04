import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertStudentSchema, 
  insertLessonSchema, 
  lessonGenerateSchema,
  creditPurchaseSchema
} from "@shared/schema";
import Stripe from "stripe";
import { qwenService } from "./services/qwen";

// Initialize Stripe if API key is available
const stripe = process.env.STRIPE_SECRET_KEY 
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
  : undefined;

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Test data endpoint (no authentication required)
  app.get("/api/test-data", async (req, res) => {
    try {
      // Test discussion data
      const testDiscussionData = {
        "title": "Test Lesson with Discussion",
        "level": "B1",
        "focus": "general",
        "sections": [
          {
            "type": "discussion",
            "title": "Discussion Questions",
            "introduction": "In this section, we'll explore some interesting aspects of the reading through discussion.",
            "questions": [
              {
                "question": "How do ancient traditions influence modern practices?",
                "level": "basic",
                "paragraphContext": "Throughout history, ancient traditions have played a significant role in shaping modern cultural practices. From religious ceremonies to family celebrations, many of today's customs can be traced back to practices established hundreds or even thousands of years ago. These enduring traditions often carry deep symbolic meaning that transcends generations.",
                "followUp": [
                  "Can you give an example of an ancient tradition that still exists today?",
                  "Why do you think some traditions survive while others fade away?",
                  "How have modern technologies changed the way we practice traditional customs?"
                ]
              },
              {
                "question": "What role do celebrations play in preserving cultural identity?",
                "level": "critical",
                "paragraphContext": "Celebrations and festivals serve as important vehicles for cultural preservation and identity formation. When communities come together to commemorate significant events or honor shared values, they reinforce their collective identity and pass down important cultural knowledge to younger generations. This process helps maintain a sense of continuity and belonging in an increasingly globalized world.",
                "followUp": [
                  "How might the loss of traditional celebrations affect a community's sense of identity?",
                  "In what ways do celebrations help transmit cultural values to younger generations?",
                  "Do you think globalization threatens traditional celebrations or enhances them? Why?"
                ]
              },
              {
                "question": "How do different cultures mark important life transitions?",
                "level": "basic",
                "paragraphContext": "Across cultures, important life transitions such as birth, coming of age, marriage, and death are marked by distinctive ceremonies and rituals. These rites of passage help individuals navigate significant life changes while also reinforcing community bonds and cultural expectations. Despite their diversity, many of these customs share common elements that reflect universal human experiences.",
                "followUp": [
                  "What coming-of-age traditions exist in your culture?",
                  "How do wedding ceremonies differ across cultures you're familiar with?",
                  "Why do you think funeral practices often involve community gatherings?"
                ]
              }
            ]
          }
        ]
      };
      
      res.json(testDiscussionData);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Authentication middleware
  const ensureAuthenticated = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized" });
  };

  // Student Routes
  app.get("/api/students", ensureAuthenticated, async (req, res) => {
    try {
      const students = await storage.getStudents(req.user!.id);
      res.json(students);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/students/:id", ensureAuthenticated, async (req, res) => {
    try {
      const student = await storage.getStudent(parseInt(req.params.id));
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      if (student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to student" });
      }
      res.json(student);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/students", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertStudentSchema.parse({
        ...req.body,
        teacherId: req.user!.id
      });
      const student = await storage.createStudent(validatedData);
      res.status(201).json(student);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid student data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.put("/api/students/:id", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const existingStudent = await storage.getStudent(studentId);
      
      if (!existingStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (existingStudent.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to student" });
      }
      
      const student = await storage.updateStudent(studentId, req.body);
      res.json(student);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/students/:id", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to student" });
      }
      
      await storage.deleteStudent(studentId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Lesson Routes
  app.get("/api/lessons", ensureAuthenticated, async (req, res) => {
    try {
      const lessons = await storage.getLessons(req.user!.id);
      res.json(lessons);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });
  
  app.get("/api/lessons/:id", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Make sure the user can only access their own lessons
      if (lesson.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }
      
      res.json(lesson);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/lessons/student/:studentId", ensureAuthenticated, async (req, res) => {
    try {
      const studentId = parseInt(req.params.studentId);
      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to student" });
      }
      
      const lessons = await storage.getLessonsByStudent(studentId);
      res.json(lessons);
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });



  app.post("/api/lessons/generate", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = lessonGenerateSchema.parse(req.body);
      
      // Check if user has enough credits (skip for admin users)
      const user = await storage.getUser(req.user!.id);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Admin users don't need credits to generate lessons
      if (!user.isAdmin && user.credits < 1) {
        return res.status(402).json({ message: "Insufficient credits" });
      }
      
      // Start a timer to track generation time
      const startTime = Date.now();
      console.log(`Starting lesson generation for user ${user.id}, topic: ${validatedData.topic}, CEFR level: ${validatedData.cefrLevel}`);
      
      try {
        // Generate lesson content using Qwen AI
        const generatedContent = await qwenService.generateLesson(validatedData);
        
        // Calculate time taken
        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000;
        console.log(`Lesson generation completed in ${timeTaken.toFixed(1)} seconds`);
        
        // Deduct credit (skip for admin users)
        if (!user.isAdmin) {
          await storage.updateUserCredits(req.user!.id, user.credits - 1);
        }
        
        // Prepare response
        const lessonResponse: any = {
          title: generatedContent.title,
          topic: validatedData.topic,
          cefrLevel: validatedData.cefrLevel,
          content: generatedContent, // Send the content directly without JSON.stringify
          generatedAt: new Date().toISOString(),
          generationTimeSeconds: timeTaken,
          studentId: validatedData.studentId || null
        };
        
        // Auto-save the lesson
        try {
          const lessonToSave = {
            teacherId: req.user!.id,
            studentId: validatedData.studentId || null,
            title: generatedContent.title,
            topic: validatedData.topic,
            cefrLevel: validatedData.cefrLevel,
            content: JSON.stringify(generatedContent), // Store as string in database
            notes: "Auto-saved lesson"
          };
          
          // Save to database
          const savedLesson = await storage.createLesson(lessonToSave);
          console.log(`Lesson auto-saved with ID: ${savedLesson.id}`);
          
          // Add the saved lesson ID to the response
          lessonResponse.id = savedLesson.id;
        } catch (saveError) {
          console.error("Error auto-saving lesson:", saveError);
          // Continue even if saving fails - we'll still return the generated content
        }
        
        res.json(lessonResponse);
      } catch (aiError: any) {
        // If AI generation fails, return error without deducting credits
        console.error("AI generation error:", aiError);
        
        // Return error to client with status 503 (Service Unavailable)
        return res.status(503).json({ 
          message: "AI service unavailable", 
          error: aiError.message
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lesson parameters", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lessons", ensureAuthenticated, async (req, res) => {
    try {
      const validatedData = insertLessonSchema.parse({
        ...req.body,
        teacherId: req.user!.id
      });
      
      const lesson = await storage.createLesson(validatedData);
      res.status(201).json(lesson);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid lesson data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  app.delete("/api/lessons/:id", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      if (lesson.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }
      
      await storage.deleteLesson(lessonId);
      res.status(204).send();
    } catch (error: any) {
      res.status(500).json({ message: error.message });
    }
  });

  // Credits and Payment Routes
  app.post("/api/create-payment-intent", ensureAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe API key not configured" });
      }

      const { amount } = creditPurchaseSchema.parse(req.body);
      
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency: "usd",
        metadata: {
          userId: req.user!.id.toString(),
          credits: req.body.quantity.toString(),
        },
      });
      
      res.json({ clientSecret: paymentIntent.client_secret });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid payment data", errors: error.errors });
      }
      res.status(500).json({ message: "Error creating payment intent: " + error.message });
    }
  });

  app.post("/api/add-credits", ensureAuthenticated, async (req, res) => {
    try {
      const userId = req.user!.id;
      const { quantity } = z.object({ quantity: z.number().int().positive() }).parse(req.body);
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const updatedUser = await storage.updateUserCredits(userId, user.credits + quantity);
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid credit data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Admin management route
  app.post("/api/admin/set-admin-status", ensureAuthenticated, async (req, res) => {
    try {
      // Only allow admins to access this endpoint
      const currentUser = await storage.getUser(req.user!.id);
      
      // Special case for "dave j" - we'll allow setting dave j as admin without admin privileges
      const { username, isAdmin } = z.object({ 
        username: z.string(),
        isAdmin: z.boolean()
      }).parse(req.body);
      
      // Find the user to update
      const userToUpdate = await storage.getUserByUsername(username);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Special case: Always allow setting "dave j" as admin
      if (username.toLowerCase() === "dave j" && isAdmin) {
        const updatedUser = await storage.updateUserAdminStatus(userToUpdate.id, true);
        console.log(`User "dave j" (${userToUpdate.id}) set as admin`);
        const { password, ...userWithoutPassword } = updatedUser;
        return res.json(userWithoutPassword);
      }
      
      // For any other operation, the current user must be an admin
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }
      
      // Update admin status
      const updatedUser = await storage.updateUserAdminStatus(userToUpdate.id, isAdmin);
      const { password, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid admin request", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}