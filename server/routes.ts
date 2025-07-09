import express, { type Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { z } from "zod";
import { 
  insertStudentSchema, 
  insertLessonSchema, 
  lessonGenerateSchema,
  creditPurchaseSchema,
  subscriptionSchema
} from "@shared/schema";
import { mailchimpService } from "./services/mailchimp.service";
import Stripe from "stripe";
// Dynamic imports for AI services - loaded only when needed
// import { qwenService } from "./services/qwen";
// import { geminiService } from "./services/gemini";

import { db } from "./db";
// Dynamic import for PDF service - loaded only when needed
// import { pdfGeneratorService } from "./services/pdf-generator.service";
import fs from 'fs/promises';
import path from 'path';

// Dynamic Stripe initialization - load only when needed
// const stripe = process.env.STRIPE_SECRET_KEY 
//   ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any })
//   : undefined;

export async function registerRoutes(app: Express): Promise<Server> {
  // Dynamic AI service loader - using only Gemini for reliable lesson generation
  let geminiService: any = null;

  const getGeminiService = async () => {
    if (!geminiService) {
      console.log('Loading Gemini AI service...');
      const { geminiService: service } = await import("./services/gemini");
      geminiService = service;
      console.log('Gemini AI service loaded successfully');
    }
    return geminiService;
  };

  // Dynamic PDF service loader
  let pdfGeneratorService: any = null;
  const getPdfGeneratorService = async () => {
    if (!pdfGeneratorService) {
      console.log('Loading PDF generator service...');
      const { pdfGeneratorService: service } = await import("./services/pdf-generator.service");
      pdfGeneratorService = service;
      console.log('PDF generator service loaded successfully');
    }
    return pdfGeneratorService;
  };

  // Dynamic Stripe loader
  let stripe: any = null;
  const getStripe = async () => {
    if (!stripe && process.env.STRIPE_SECRET_KEY) {
      console.log('Loading Stripe service...');
      const Stripe = (await import("stripe")).default;
      stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2023-10-16" as any });
      console.log('Stripe service loaded successfully');
    }
    return stripe;
  };

  // Set up authentication routes
  setupAuth(app);

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
      // Get pagination parameters from query string with defaults
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 10;
      
      // Get filter parameters from query string
      const search = req.query.search as string || '';
      const cefrLevel = req.query.cefrLevel as string || 'all';
      const dateFilter = req.query.dateFilter as string || '';
      const category = req.query.category as string || 'all';
      
      console.log(`API Request: GET /api/lessons for teacherId=${req.user!.id}, page=${page}, search=${search || 'none'}, cefrLevel=${cefrLevel}, dateFilter=${dateFilter || 'all'}, category=${category}`);
      
      // First check if user is authenticated properly
      if (!req.user?.id) {
        console.error("Missing user ID in authenticated request");
        return res.status(400).json({ error: "User ID not found in request" });
      }
      
      try {
        // Do a direct database check to ensure connectivity
        await db.execute("SELECT 1");
        console.log("Database connection verified");
      } catch (dbError: any) {
        console.error("Database connection error:", dbError);
        // Revert: Return generic error for database connection issues
        return res.status(500).json({ error: "Database connection failed", details: String(dbError) }); 
      }
      
      // For production environment, add an extra layer of protection
      if (process.env.NODE_ENV === 'production') {
        try {
          // Allow admin to view other users' lessons via teacherId parameter
          const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string) : req.user!.id;
          
          // Only allow viewing other users' lessons if the requester is admin
          if (teacherId !== req.user!.id && !req.user!.isAdmin) {
            return res.status(403).json({ message: "Access denied" });
          }

          // Fetch paginated and filtered lessons
          const result = await storage.getLessons(
            teacherId, 
            page, 
            pageSize,
            search,
            cefrLevel,
            dateFilter,
            category
          );
          
          // --- DEBUGGING: Check result structure before sending ---
          console.log(`API Response: Retrieved ${result.lessons.length} lessons out of ${result.total} total.`);
          console.log('Result structure:', JSON.stringify({ total: result.total, lessonCount: result.lessons.length, firstLessonKeys: result.lessons.length > 0 ? Object.keys(result.lessons[0]) : [] }, null, 2));
          
          // Try sending only the total count first to see if that works
          // return res.json({ total: result.total, lessons: [] }); 
          
          // If the above works, try sending cleaned lessons
          try {
            // Explicitly select/clean data to avoid potential circular refs or unserializable types
            const cleanedLessons = result.lessons.map(lesson => ({
              id: lesson.id,
              teacherId: lesson.teacherId,
              studentId: lesson.studentId,
              title: lesson.title,
              topic: lesson.topic,
              cefrLevel: lesson.cefrLevel,
              // Omit content field permanently from list response to prevent crash
              // content: lesson.content, 
              notes: lesson.notes,
              createdAt: lesson.createdAt
            }));
            
            console.log('Attempting to send cleaned lessons...');
            return res.json({ total: result.total, lessons: cleanedLessons });
            
          } catch (serializationError: any) {
            console.error("Error during manual serialization:", serializationError);
            // --- DEBUGGING: Log potentially problematic content --- 
            if (result.lessons && result.lessons.length > 0) {
              console.error("Problematic lesson content (first lesson):", result.lessons[0].content);
            }
            // --- END DEBUGGING ---
            return res.status(500).json({ error: "Failed to serialize lesson data", message: serializationError.message });
          }
          // --- END DEBUGGING ---
        } catch (prodError: any) { 
          console.error("Production error in /api/lessons:", prodError);
          
          // Revert: Return empty result set instead of 500 error
          console.log("Returning empty result set for production environment");
          return res.json({ // Change status back to default (200 OK with empty data)
            lessons: [],
            total: 0
          });
        }
      } else {
        // Allow admin to view other users' lessons via teacherId parameter
        const teacherId = req.query.teacherId ? parseInt(req.query.teacherId as string) : req.user!.id;
        
        // Only allow viewing other users' lessons if the requester is admin
        if (teacherId !== req.user!.id && !req.user!.isAdmin) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Development environment - let errors bubble up normally
        const result = await storage.getLessons(
          teacherId, 
          page, 
          pageSize,
          search,
          cefrLevel,
          dateFilter,
          category
        );
        
        // --- DEBUGGING (Dev): Apply same logic as production for consistency ---
        console.log(`API Response (Dev): Retrieved ${result.lessons.length} lessons out of ${result.total} total.`);
        console.log('Result structure (Dev):', JSON.stringify({ total: result.total, lessonCount: result.lessons.length, firstLessonKeys: result.lessons.length > 0 ? Object.keys(result.lessons[0]) : [] }, null, 2));
        
        try {
          const cleanedLessons = result.lessons.map(lesson => ({
            id: lesson.id,
            teacherId: lesson.teacherId,
            studentId: lesson.studentId,
            title: lesson.title,
            topic: lesson.topic,
            cefrLevel: lesson.cefrLevel,
            // Omit content field permanently from list response (Dev)
            // content: lesson.content,
            notes: lesson.notes,
            createdAt: lesson.createdAt
          }));
          
          console.log('Attempting to send cleaned lessons (Dev)...');
          return res.json({ total: result.total, lessons: cleanedLessons });
          
        } catch (serializationError: any) {
          console.error("Error during manual serialization (Dev):", serializationError);
          // --- DEBUGGING (Dev): Log potentially problematic content ---
          if (result.lessons && result.lessons.length > 0) {
            console.error("Problematic lesson content (Dev, first lesson):", result.lessons[0].content);
          }
          // --- END DEBUGGING (Dev) ---
          // Let the default error handler catch this in dev
          throw serializationError; 
        }
        // --- END DEBUGGING (Dev) ---
      }
    } catch (error: any) {
      console.error("Error in /api/lessons:", error);
      res.status(500).json({ 
        error: "Failed to fetch lessons", 
        message: error.message,
        stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
      });
    }
  });
  
  app.get("/api/lessons/:id", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      console.log(`Fetching lesson ${lessonId} for public access`);
      
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        console.log(`Lesson ${lessonId} not found`);
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Parse grammarSpotlight JSON if it exists (with error handling)
      let grammarSpotlight = null;
      if (lesson.grammarSpotlight) {
        try {
          grammarSpotlight = JSON.parse(lesson.grammarSpotlight);
        } catch (parseError) {
          console.warn(`Failed to parse grammarSpotlight for lesson ${lessonId}:`, parseError);
        }
      }
      
      const responseLesson = {
        ...lesson,
        grammarSpotlight
      };
      
      console.log(`Successfully fetched lesson ${lessonId}`);
      res.json(responseLesson);
    } catch (error: any) {
      console.error(`Error fetching lesson ${req.params.id}:`, error);
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
      
      // Track if we need to try fallback provider
      let generatedContent;
      let usedFallbackProvider = false;
      let errorMessage = '';
      let primaryProviderError = null;
      
      try {
        // Generate lesson content using the selected AI provider
        const primaryProvider = validatedData.aiProvider || 'gemini'; // Default to Gemini
        
        console.log(`Using AI provider: ${primaryProvider}`);
        
        // Generate lesson using Gemini
        const gemini = await getGeminiService();
        generatedContent = await gemini.generateLesson(validatedData);
          
        // No fallback needed since we're only using Gemini
        
        // Calculate time taken
        const endTime = Date.now();
        const timeTaken = (endTime - startTime) / 1000;
        console.log(`Lesson generation completed in ${timeTaken.toFixed(1)} seconds using Gemini`);
        
        // Analyze lesson content for grammar patterns
        // Grammar spotlight is now generated by AI as part of the lesson content
        // Check if the AI included a grammar spotlight in the generated content
        let grammarVisualization = null;
        if (generatedContent.grammarSpotlight) {
          grammarVisualization = generatedContent.grammarSpotlight;
          console.log(`AI generated grammar spotlight: ${grammarVisualization.grammarType}`);
        } else {
          console.log('No grammar spotlight was generated by AI for this lesson');
        }
        
        // Deduct credit (skip for admin users)
        if (!user.isAdmin) {
          await storage.updateUserCredits(req.user!.id, user.credits - 1);
        }
        
        // Prepare response with temporary ID for immediate response
        const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const lessonResponse: any = {
          id: tempId, // Temporary ID for immediate response
          title: generatedContent.title,
          topic: validatedData.topic,
          cefrLevel: validatedData.cefrLevel,
          content: generatedContent, // Send the content directly without JSON.stringify
          grammarSpotlight: grammarVisualization, // Add grammar visualization if found
          generatedAt: new Date().toISOString(),
          generationTimeSeconds: timeTaken,
          studentId: validatedData.studentId || null,
          aiProvider: 'gemini',
          isTemporary: true // Flag to indicate this is a temporary response
        };
        
        // Send response immediately - don't wait for database save
        console.log(`Lesson generation completed in ${timeTaken.toFixed(1)}s - responding immediately with temp ID: ${tempId}`);
        res.json(lessonResponse);
        
        // Save to database asynchronously (non-blocking)
        const lessonToSave = {
          teacherId: req.user!.id,
          studentId: validatedData.studentId || null,
          title: generatedContent.title,
          topic: validatedData.topic,
          cefrLevel: validatedData.cefrLevel,
          content: JSON.stringify(generatedContent), // Store as string in database
          notes: "Auto-saved lesson",
          grammarSpotlight: grammarVisualization ? JSON.stringify(grammarVisualization) : null,
          category: validatedData.category || 'general',
          tags: validatedData.tags || []
        };
        
        // Asynchronous save - don't await, let it run in background
        console.log(`Starting async lesson save to database for temp ID: ${tempId}...`);
        storage.createLesson(lessonToSave)
          .then(savedLesson => {
            console.log(`✅ Lesson successfully saved with permanent ID: ${savedLesson.id} (was temp: ${tempId})`);
            // TODO: Optionally notify frontend of permanent ID via websocket/polling
          })
          .catch(saveError => {
            console.error(`❌ Error saving lesson with temp ID ${tempId}:`, saveError);
            // TODO: Implement retry logic or manual save recovery
          });
      } catch (aiError: any) {
        // Gemini provider failed
        console.error("Gemini AI provider failed:", aiError);
        
        // Refund the credit since generation failed (skip for admin users)
        if (!user.isAdmin) {
          console.log(`Refunding credit to user ${user.id} due to generation failure`);
          await storage.updateUserCredits(req.user!.id, user.credits);
        }
        
        // Return error to client with status 503 (Service Unavailable)
        return res.status(503).json({ 
          message: "AI service unavailable - lesson generation failed", 
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

  // Update lesson category (PATCH /api/lessons/:id)
  app.patch("/api/lessons/:id", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      if (lesson.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }
      
      // Only allow updating category for now
      const { category } = req.body;
      if (!category) {
        return res.status(400).json({ message: "Category is required" });
      }
      
      const updatedLesson = await storage.updateLesson(lessonId, { category });
      res.json(updatedLesson);
    } catch (error: any) {
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

  // Generate vocabulary review PDF for a lesson
  app.get("/api/lessons/:id/pdf", async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const lesson = await storage.getLesson(lessonId);
      
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Allow public access to PDF downloads for all lessons
      console.log(`PDF download requested for lesson ${lessonId}: "${lesson.title}"`);
      
      // Log whether user is authenticated for analytics
      if (req.isAuthenticated()) {
        console.log(`Authenticated user ${req.user!.username} downloading lesson ${lessonId}`);
      } else {
        console.log(`Public user downloading lesson ${lessonId}`);
      }
      
      // Parse the lesson content
      let lessonContent;
      try {
        lessonContent = typeof lesson.content === 'string' 
          ? JSON.parse(lesson.content) 
          : lesson.content;
      } catch (parseError) {
        return res.status(400).json({ message: "Invalid lesson content format" });
      }
      
      // Check if lesson has vocabulary section
      const vocabularySection = lessonContent.sections?.find((section: any) => section.type === 'vocabulary');
      if (!vocabularySection || !vocabularySection.words || vocabularySection.words.length === 0) {
        return res.status(400).json({ message: "No vocabulary found in this lesson" });
      }
      
      // Prepare lesson data for PDF generation
      const lessonData = {
        title: lesson.title,
        level: lesson.cefrLevel,
        sections: lessonContent.sections
      };
      
      console.log(`Generating vocabulary review PDF for lesson ${lessonId}: "${lesson.title}"`);
      
      // Check if HTML format was requested
      if (req.query.format === 'html') {
        // Generate HTML document
        const pdfService = await getPdfGeneratorService();
        const htmlContent = await pdfService.generateVocabularyReviewHTML(lessonData);
        
        // Set headers for HTML download
        const htmlFilename = `vocabulary-review-${lesson.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.html`;
        res.setHeader('Content-Type', 'text/html');
        res.setHeader('Content-Disposition', `attachment; filename="${htmlFilename}"`);
        
        // Send the HTML
        return res.send(htmlContent);
      }
      
      // Generate PDF (default)
      const pdfService = await getPdfGeneratorService();
      const pdfBuffer = await pdfService.generateVocabularyReviewPDF(lessonData);
      
      // Set headers for PDF download
      const filename = `vocabulary-review-${lesson.title.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase()}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send the PDF
      res.send(pdfBuffer);
      
      console.log(`Successfully generated PDF for lesson ${lessonId}, size: ${pdfBuffer.length} bytes`);
    } catch (error: any) {
      console.error(`Error generating PDF for lesson ${req.params.id}:`, error);
      res.status(500).json({ 
        message: "Failed to generate vocabulary review PDF", 
        error: error.message 
      });
    }
  });
  
  // Assign a lesson to a student
  app.put("/api/lessons/:id/assign", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const { studentId } = z.object({ studentId: z.number().int() }).parse(req.body);
      
      // Check if lesson exists
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }
      
      // Check authorization - allow owner or admin
      if (lesson.teacherId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }
      
      // Check if student exists and belongs to this teacher
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      if (student.teacherId !== req.user!.id) {
        return res.status(403).json({ message: "Unauthorized access to student" });
      }
      
      // Update the lesson with the studentId
      const updatedLesson = await storage.updateLesson(lessonId, { studentId });
      res.json(updatedLesson);
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid assignment data", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Unassign a lesson from a student
  app.put("/api/lessons/:id/unassign", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);

      // Check if lesson exists
      const lesson = await storage.getLesson(lessonId);
      if (!lesson) {
        return res.status(404).json({ message: "Lesson not found" });
      }

      // Check authorization (user must own the lesson or be admin)
      if (lesson.teacherId !== req.user!.id && !req.user!.isAdmin) {
        return res.status(403).json({ message: "Unauthorized access to lesson" });
      }
      
      // Check if the lesson is actually assigned to a student
      if (!lesson.studentId) {
         // Not strictly an error, but good to inform the client
         return res.status(400).json({ message: "Lesson is not assigned to any student" });
      }

      // Update the lesson, setting studentId to null
      const updatedLesson = await storage.updateLesson(lessonId, { studentId: null });
      res.json(updatedLesson); // Return the updated lesson
    } catch (error: any) {
      console.error("Error unassigning lesson:", error);
      res.status(500).json({ message: "Failed to unassign lesson", error: error.message });
    }
  });

  // Credits and Payment Routes
  app.post("/api/create-payment-intent", ensureAuthenticated, async (req, res) => {
    try {
      const stripe = await getStripe();
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
  
  // Subscription Routes
  // Endpoint to manually fetch and apply a Stripe subscription based on session ID
  app.post("/api/subscriptions/fetch-session", ensureAuthenticated, async (req, res) => {
    try {
      const stripe = await getStripe();
      if (!stripe) {
        return res.status(500).json({ message: "Stripe API key not configured" });
      }
      
      const sessionId = req.body.sessionId;
      const userId = req.user!.id;
      
      if (!sessionId) {
        return res.status(400).json({ message: "Session ID is required" });
      }
      
      console.log(`Fetching session ${sessionId} for user ${userId}`);
      
      // Retrieve the checkout session from Stripe
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }
      
      // Check if this is a subscription session
      if (session.mode !== 'subscription' || !session.subscription) {
        return res.status(400).json({ message: "Not a subscription session" });
      }
      
      const planId = session.metadata?.planId;
      const subscriptionId = session.subscription as string;
      
      // Update user with subscription info
      await storage.updateUserStripeInfo(userId, {
        stripeCustomerId: session.customer as string,
        stripeSubscriptionId: subscriptionId
      });
      
      // Set the subscription tier and add credits based on the plan
      let subscriptionTier = 'free';
      let creditsToAdd = 0;
      
      // Map the plan ID to the appropriate tier and credits
      if (planId === 'basic_monthly') {
        subscriptionTier = 'basic';
        creditsToAdd = 20; // Basic plan includes 20 credits per month
      } else if (planId === 'premium_monthly') {
        subscriptionTier = 'premium';
        creditsToAdd = 60; // Premium plan includes 60 credits per month
      } else if (planId === 'annual_plan') {
        subscriptionTier = 'annual';
        creditsToAdd = 250; // Annual plan includes 250 credits per year
      }
      
      // Get the current user
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update user's subscription tier and credits
      const updatedUser = await storage.updateUser(userId, {
        subscriptionTier,
        credits: user.credits + creditsToAdd
      });
      
      console.log(`Manual credit allocation: User ${userId} subscribed to ${subscriptionTier} plan. Added ${creditsToAdd} credits. New total: ${updatedUser.credits}`);
      
      // Return the updated user info
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({
        message: "Subscription applied successfully",
        user: userWithoutPassword,
        creditsAdded: creditsToAdd,
        plan: subscriptionTier
      });
      
    } catch (error: any) {
      console.error("Error fetching subscription session:", error);
      res.status(500).json({ 
        message: "Error processing subscription: " + error.message
      });
    }
  });

  app.post("/api/subscriptions/create", ensureAuthenticated, async (req, res) => {
    try {
      const stripe = await getStripe();
      if (!stripe) {
        console.error("Stripe API key not configured when attempting to create subscription");
        return res.status(500).json({ message: "Stripe API key not configured" });
      }

      const { planId, priceId } = subscriptionSchema.parse(req.body);
      const userId = req.user!.id;
      
      // Map generic price IDs to actual Stripe price IDs
      // Using the price IDs you created in your Stripe account
      const stripeProductMap: Record<string, string> = {
        'price_basic_monthly': 'price_1RAwzFAsWPZqDtgQDk06P5r1',   // Basic monthly plan
        'price_premium_monthly': 'price_1RAx0iAsWPZqDtgQ4wc1T8a9', // Premium monthly plan
        'price_annual_plan': 'price_1RAx2NAsWPZqDtgQl2HPLAng'      // Annual plan
      };
      
      // Get the actual price ID from our map, or use the provided one if not found
      const actualPriceId = stripeProductMap[priceId] || priceId;
      
      console.log(`Creating subscription for user ${userId}, plan: ${planId}, mapped price: ${actualPriceId} (from ${priceId})`);
      
      // Get the user from the database
      const user = await storage.getUser(userId);
      if (!user) {
        console.error(`User not found for subscription creation: ${userId}`);
        return res.status(404).json({ message: "User not found" });
      }
      
      // Create or get Stripe customer
      let customerId = user.stripeCustomerId;
      
      // If no customer ID or empty string, create a new customer
      if (!customerId || customerId === '') {
        // Create a new customer in Stripe
        const customer = await stripe.customers.create({
          email: user.email,
          name: user.fullName || user.username,
          metadata: {
            userId: userId.toString()
          }
        });
        
        customerId = customer.id;
        
        // Update the user in the database with the Stripe customer ID
        await storage.updateUserStripeInfo(userId, { 
          stripeCustomerId: customerId,
          stripeSubscriptionId: null
        });
        
        console.log(`Created new Stripe customer: ${customerId} for user ${userId}`);
      } else {
        // Verify the customer exists in Stripe
        try {
          await stripe.customers.retrieve(customerId);
          console.log(`Verified existing Stripe customer: ${customerId} for user ${userId}`);
        } catch (customerError: any) {
          // If the customer doesn't exist in Stripe anymore, create a new one
          if (customerError.code === 'resource_missing') {
            console.log(`Customer ${customerId} not found in Stripe, creating new one`);
            
            const customer = await stripe.customers.create({
              email: user.email,
              name: user.fullName || user.username,
              metadata: {
                userId: userId.toString()
              }
            });
            
            customerId = customer.id;
            
            // Update the user in the database with the new Stripe customer ID
            await storage.updateUserStripeInfo(userId, { 
              stripeCustomerId: customerId,
              stripeSubscriptionId: null
            });
            
            console.log(`Created replacement Stripe customer: ${customerId} for user ${userId}`);
          } else {
            throw customerError;
          }
        }
      }
      
      console.log(`Creating checkout session for customer: ${customerId}, priceId: ${actualPriceId}`);
      
      // Start the subscription checkout session
      // Get the host from the request for dynamic URLs
      const host = req.headers.host || '';
      const protocol = req.headers['x-forwarded-proto'] || 'http';
      const baseUrl = `${protocol}://${host}`;
      
      console.log(`Using base URL for redirection: ${baseUrl}`);
      
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [
          {
            price: actualPriceId,
            quantity: 1,
          },
        ],
        mode: 'subscription',
        success_url: `${baseUrl}/subscription-success?session_id={CHECKOUT_SESSION_ID}&plan=${planId}`,
        cancel_url: `${baseUrl}/buy-credits`,
        metadata: {
          userId: userId.toString(),
          planId: planId
        },
        // Add subscription_data to ensure metadata is transferred to the subscription
        subscription_data: {
          metadata: {
            userId: userId.toString(),
            planId: planId
          }
        }
      });
      
      console.log(`Subscription checkout session created: ${session.id}`);
      console.log(`Session URL: ${session.url}`);
      
      res.json({ 
        sessionId: session.id,
        url: session.url
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid subscription data", errors: error.errors });
      }
      
      console.error("Subscription creation error:", error);
      
      // Handle "no such customer" error specifically
      if (error.code === 'resource_missing' && error.param === 'customer') {
        // The customer ID in our database doesn't exist in Stripe anymore
        // Let's reset the user's customer ID and try again
        try {
          // Get user ID from the request
          const userId = req.user!.id;
          
          // Get the user record
          const userRecord = await storage.getUser(userId);
          
          if (userRecord) {
            console.log(`Customer ID ${userRecord.stripeCustomerId} doesn't exist in Stripe. Resetting and retrying...`);
            
            // Reset the user's customer ID
            await storage.updateUserStripeInfo(userId, {
              stripeCustomerId: '',  // Use empty string instead of null to avoid type errors
              stripeSubscriptionId: null
            });
            
            // Redirect the user to try again
            return res.status(409).json({ 
              message: "Your customer record needed to be reset. Please try subscribing again.",
              retryNeeded: true
            });
          }
        } catch (retryError) {
          console.error("Error resetting customer ID:", retryError);
        }
      }
      
      res.status(500).json({ 
        message: "Error creating subscription: " + error.message,
        details: error.type || error.code || "Unknown error" 
      });
    }
  });
  app.post("/api/subscriptions/cancel", ensureAuthenticated, async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ message: "Stripe API key not configured" });
      }
      
      const userId = req.user!.id;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      if (!user.stripeSubscriptionId) {
        return res.status(400).json({ message: "No active subscription found" });
      }
      
      // First retrieve the subscription to get current period end
      const subscription = await stripe.subscriptions.retrieve(user.stripeSubscriptionId);
      
      // Cancel the subscription at the end of the current period
      await stripe.subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true
      });
      
      // Convert the Unix timestamp to a JavaScript Date
      const endDate = new Date(subscription.current_period_end * 1000);
      const formattedEndDate = endDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
      
      res.json({ 
        message: "Subscription scheduled for cancellation at the end of the current billing period",
        endDate: formattedEndDate,
        endTimestamp: subscription.current_period_end
      });
    } catch (error: any) {
      res.status(500).json({ message: "Error cancelling subscription: " + error.message });
    }
  });

  // Admin analytics endpoint  
  app.get("/api/admin/analytics", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }
      
      const analytics = await storage.getAdminAnalytics();
      res.json(analytics);
    } catch (error: any) {
      console.error('Error fetching admin analytics:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin lessons browser endpoint
  app.get("/api/admin/lessons", ensureAuthenticated, async (req, res) => {
    try {
      const currentUser = await storage.getUser(req.user!.id);
      
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }
      
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const search = req.query.search as string || '';
      const category = req.query.category as string || 'all';
      const cefrLevel = req.query.cefrLevel as string || 'all';
      
      const result = await storage.getAllLessonsForAdmin(page, pageSize, search, category, cefrLevel);
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching admin lessons:', error);
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

  // Mailchimp configuration endpoint (admin only)
  app.post("/api/admin/config/mailchimp", ensureAuthenticated, async (req, res) => {
    try {
      // Only allow admins to access this endpoint
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }
      
      const { apiKey, serverPrefix, listId } = z.object({
        apiKey: z.string(),
        serverPrefix: z.string(),
        listId: z.string()
      }).parse(req.body);
      
      // Initialize the mailchimp service with the new credentials
      mailchimpService.initialize(apiKey, serverPrefix, listId);
      
      // Store these values in environment variables for persistence
      // Note: In a production app, these would be stored securely in a database or secret manager
      process.env.MAILCHIMP_API_KEY = apiKey;
      process.env.MAILCHIMP_SERVER_PREFIX = serverPrefix;
      process.env.MAILCHIMP_LIST_ID = listId;
      
      // Check if the configuration is working by attempting to fetch lists
      if (mailchimpService.isInitialized()) {
        res.json({ 
          message: "Mailchimp configuration updated successfully", 
          success: true 
        });
      } else {
        res.status(400).json({ 
          message: "Mailchimp configuration failed", 
          success: false 
        });
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid Mailchimp configuration", errors: error.errors });
      }
      res.status(500).json({ message: error.message });
    }
  });

  // Public library endpoints
  app.get("/api/public-lessons", ensureAuthenticated, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const pageSize = parseInt(req.query.pageSize as string) || 20;
      const search = req.query.search as string || '';
      const cefrLevel = req.query.cefrLevel as string || 'all';
      const category = req.query.category as string || 'all';
      
      const result = await storage.getPublicLessons(page, pageSize, search, cefrLevel, category);
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching public lessons:', error);
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/lessons/:id/copy", ensureAuthenticated, async (req, res) => {
    try {
      const lessonId = parseInt(req.params.id);
      const userId = req.user!.id;
      
      const copiedLesson = await storage.copyLessonToUser(lessonId, userId);
      res.json(copiedLesson);
    } catch (error: any) {
      console.error('Error copying lesson:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Admin endpoint to make lessons public  
  app.patch("/api/lessons/:id/public", ensureAuthenticated, async (req, res) => {
    try {
      console.log('Making lesson public - User ID:', req.user?.id);
      console.log('Request body:', req.body);
      
      const currentUser = await storage.getUser(req.user!.id);
      console.log('Current user:', { id: currentUser?.id, isAdmin: currentUser?.isAdmin });
      
      if (!currentUser?.isAdmin) {
        console.log('User is not admin');
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      const lessonId = parseInt(req.params.id);
      const { publicCategory } = req.body;
      
      console.log('Making lesson public:', { lessonId, publicCategory });
      
      const updatedLesson = await storage.updateLesson(lessonId, { 
        isPublic: true, 
        publicCategory: publicCategory || 'general-english'
      });
      
      console.log('Lesson updated successfully:', updatedLesson.id);
      res.json(updatedLesson);
    } catch (error: any) {
      console.error('Error making lesson public:', error);
      res.status(500).json({ message: error.message });
    }
  });

  // Stripe webhook handler
  // Apply express.raw() middleware specifically for this route
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req: any, res) => {
    // Use req.body which now contains the raw buffer
    const payload = req.body; 
    const sig = req.headers['stripe-signature'] as string;
    
    console.log("Received Stripe webhook event");

    const stripe = await getStripe();
    if (!stripe) {
      console.error("Stripe API key not configured");
      return res.status(200).json({ received: true, error: "Stripe API key not configured" });
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error("Stripe webhook secret not configured");
      return res.status(200).json({ received: true, error: "Stripe webhook secret not configured" });
    }
    
    if (!payload) {
      console.error("No body found in webhook request");
      return res.status(200).json({ received: true, error: "No body found in webhook request" });
    }
    
    let event: Stripe.Event | undefined;
    
    try {
      // Verify webhook signature
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
      console.log(`Webhook event type: ${event.type}`);
    } catch (err: any) {
      console.error(`Webhook Signature Error: ${err.message}`);
      return res.status(200).json({ received: true, error: `Webhook Error: ${err.message}` });
    }

    // Handle the event
    try {
      // Make sure event is defined
      if (!event) {
        console.error("Event is undefined after signature verification");
        return res.status(200).json({ received: true, error: "Event is undefined" });
      }
      
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object as Stripe.Checkout.Session;
          
          // Handle if this is a subscription checkout
          if (session.mode === 'subscription' && session.metadata?.userId) {
            const userId = parseInt(session.metadata.userId);
            const subscriptionId = session.subscription as string;
            const planId = session.metadata.planId;
            
            console.log(`Processing checkout.session.completed: userId=${userId}, subscriptionId=${subscriptionId}, planId=${planId}`);
            console.log(`Session metadata:`, JSON.stringify(session.metadata));
            
            // Update user with subscription info
            const user = await storage.getUser(userId);
            if (user) {
              console.log(`Found user for subscription: ${user.username} (${userId})`);
              
              await storage.updateUserStripeInfo(userId, {
                stripeCustomerId: session.customer as string,
                stripeSubscriptionId: subscriptionId
              });
              
              // Set the subscription tier based on the plan
              let subscriptionTier = 'free';
              let creditsToAdd = 0;
              
              // Map the plan ID to the appropriate tier and credits
              if (planId === 'basic_monthly') {
                subscriptionTier = 'basic';
                creditsToAdd = 20; // Basic plan includes 20 credits per month
              } else if (planId === 'premium_monthly') {
                subscriptionTier = 'premium';
                creditsToAdd = 60; // Premium plan includes 60 credits per month
              } else if (planId === 'annual_plan') {
                subscriptionTier = 'annual';
                creditsToAdd = 250; // Annual plan includes 250 credits per year
              }
              
              console.log(`Assigning tier ${subscriptionTier} with ${creditsToAdd} credits (user's current credits: ${user.credits})`);
              
              // Update user's subscription tier
              const updatedUser = await storage.updateUser(userId, {
                subscriptionTier,
                credits: user.credits + creditsToAdd
              });
              
              console.log(`User ${userId} subscribed to ${subscriptionTier} plan. Added ${creditsToAdd} credits. New total: ${updatedUser.credits}`);
            } else {
              console.error(`User not found for subscription: userId=${userId}`);
            }
          }
          break;
        }
        
        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice;
          
          // If this is a recurring payment (not the first one) and has a subscription
          if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription) {
            console.log('Processing recurring payment for subscription:', invoice.subscription);
            
            try {
              // Get the subscription to access its metadata
              const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
              
              // Check if subscription has userId in metadata
              if (subscription.metadata?.userId) {
                const userId = parseInt(subscription.metadata.userId);
                const planId = subscription.metadata.planId;
                
                console.log(`Found subscription metadata. userId=${userId}, planId=${planId}`);
                
                const user = await storage.getUser(userId);
                
                if (user) {
                  let creditsToAdd = 0;
                  
                  // Add credits based on the plan ID in metadata or fallback to user's subscription tier
                  if (planId === 'basic_monthly' || user.subscriptionTier === 'basic') {
                    creditsToAdd = 20;
                  } else if (planId === 'premium_monthly' || user.subscriptionTier === 'premium') {
                    creditsToAdd = 60;
                  } else if (planId === 'annual_plan' || user.subscriptionTier === 'annual') {
                    // Annual plan is billed yearly, so we credit the full 250 credits
                    creditsToAdd = 250;
                  }
                  
                  if (creditsToAdd > 0) {
                    await storage.updateUserCredits(userId, user.credits + creditsToAdd);
                    console.log(`Added ${creditsToAdd} credits to user ${userId} for recurring subscription payment.`);
                  }
                } else {
                  console.error(`User not found for subscription: userId=${userId}`);
                }
              } else {
                console.log('No userId found in subscription metadata');
              }
            } catch (err) {
              console.error('Error retrieving subscription details:', err);
            }
          }
          break;
        }
        
        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription;
          
          console.log('Processing subscription deletion:', subscription.id);
          
          // First try to use metadata for a more direct approach
          if (subscription.metadata?.userId) {
            const userId = parseInt(subscription.metadata.userId);
            console.log(`Found userId ${userId} in subscription metadata`);
            
            const user = await storage.getUser(userId);
            
            if (user) {
              // Reset subscription status
              await storage.updateUser(user.id, {
                subscriptionTier: 'free',
                stripeSubscriptionId: null
              });
              
              console.log(`User ${user.id} subscription has been canceled using metadata.`);
              break;
            }
          }
          
          // Fallback: Find user with this subscription's customer ID
          console.log('No userId in metadata, trying to find by customer ID:', subscription.customer);
          
          // Find user with this customer ID
          const user = await storage.getUserByStripeCustomerId(subscription.customer as string);
          
          if (user) {
            // Reset subscription status
            await storage.updateUser(user.id, {
              subscriptionTier: 'free',
              stripeSubscriptionId: null
            });
            
            console.log(`User ${user.id} subscription has been canceled using customer ID.`);
          } else {
            console.log('No user found with this customer ID');
          }
          
          break;
        }
        
        // Add more event handlers as needed
        
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
      
      // Return a 200 success response to acknowledge receipt of the webhook
      // This is required by Stripe to indicate successful processing
      console.log('Webhook processed successfully');
      return res.status(200).json({ received: true });
    } catch (error: any) {
      console.error(`Error processing webhook: ${error.message || error}`);
      return res.status(200).json({ received: true, error: 'Webhook processing failed' });
    }
  });
  
  // Admin routes - Users with Lesson Statistics
  app.get("/api/admin/users/lesson-stats", ensureAuthenticated, async (req, res) => {
    try {
      // Only allow admins to access this endpoint
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }

      // Parse query parameters
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;
      const search = req.query.search as string || undefined;
      const dateFilter = req.query.dateFilter as string || undefined;

      // Get users with lesson stats
      const result = await storage.getUsersWithLessonStats(page, pageSize, search, dateFilter);
      
      res.json(result);
    } catch (error: any) {
      console.error('Error fetching users with lesson stats:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Admin route - Update user credits
  app.post("/api/admin/update-user-credits", ensureAuthenticated, async (req, res) => {
    try {
      // Only allow admins to access this endpoint
      const currentUser = await storage.getUser(req.user!.id);
      if (!currentUser?.isAdmin) {
        return res.status(403).json({ message: "Unauthorized. Admin privileges required." });
      }
      
      // Validate the request body
      const { userId, credits, action } = z.object({
        userId: z.number(),
        credits: z.number().positive(),
        action: z.enum(['add', 'subtract', 'set'])
      }).parse(req.body);
      
      // Get the user to update
      const userToUpdate = await storage.getUser(userId);
      if (!userToUpdate) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Calculate new credit amount based on action
      let newCredits: number;
      switch (action) {
        case 'add':
          newCredits = userToUpdate.credits + credits;
          break;
        case 'subtract':
          newCredits = Math.max(0, userToUpdate.credits - credits); // Ensure credits don't go below 0
          break;
        case 'set':
          newCredits = credits;
          break;
      }
      
      // Update the user's credits
      const updatedUser = await storage.updateUserCredits(userId, newCredits);
      
      // If updating the currently logged-in user, update their session data too
      if (req.user && req.user.id === userId) {
        req.user = { ...req.user, credits: newCredits };
      }
      
      // Return the updated user (without password)
      const { password, ...userWithoutPassword } = updatedUser;
      res.json({ 
        user: userWithoutPassword,
        message: `Credits ${action === 'set' ? 'set to' : action === 'add' ? 'increased by' : 'reduced by'} ${credits}. New total: ${newCredits}` 
      });
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid request data", errors: error.errors });
      }
      console.error('Error updating user credits:', error);
      res.status(500).json({ message: error.message });
    }
  });
  
  // Create HTTP server
  const httpServer = createServer(app);
  return httpServer;
}