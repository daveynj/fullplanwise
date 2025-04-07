import { users, students, lessons, type User, type InsertUser, type Student, type InsertStudent, type Lesson, type InsertLesson } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { Store } from "express-session";
import { db } from "./db";
import { SQL, eq, and, desc, count, or, ilike, gte } from "drizzle-orm";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// modify the interface with any CRUD methods
// you might need
export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined>;
  getUsersByEmail(email: string): Promise<User[]>;
  getUserByResetToken(token: string): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUserCredits(userId: number, credits: number): Promise<User>;
  updateUserStripeInfo(userId: number, stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string | null }): Promise<User>;
  updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<User>;
  updateUser(userId: number, updates: Partial<User>): Promise<User>;
  
  // Student methods
  getStudents(teacherId: number): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<Student>): Promise<Student>;
  deleteStudent(id: number): Promise<boolean>;
  
  // Lesson methods
  getLessons(teacherId: number, page?: number, pageSize?: number, search?: string, cefrLevel?: string, dateFilter?: string): Promise<{lessons: Lesson[], total: number}>;
  getLessonsByStudent(studentId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lessonUpdate: Partial<Lesson>): Promise<Lesson>;
  deleteLesson(id: number): Promise<boolean>;
  
  // Session store
  sessionStore: Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    const PostgresSessionStore = connectPg(session);
    this.sessionStore = new PostgresSessionStore({ 
      pool, 
      tableName: 'session',
      createTableIfMissing: true 
    });
    console.log("Database storage initialized with PostgreSQL session store");
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user;
    } catch (error) {
      console.error('Error fetching user by ID:', error);
      throw error;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.username, username));
      return user;
    } catch (error) {
      console.error('Error fetching user by username:', error);
      throw error;
    }
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    try {
      // Ensure default values are set
      const userToInsert = {
        ...insertUser,
        fullName: insertUser.fullName || insertUser.username,
        credits: 5,
        isAdmin: false,
        subscriptionTier: "free"
      };
      
      const [user] = await db.insert(users).values(userToInsert).returning();
      console.log(`User created in database with ID: ${user.id}`);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async updateUserCredits(userId: number, credits: number): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ credits })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        throw new Error("User not found");
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user credits:', error);
      throw error;
    }
  }

  async updateUserStripeInfo(
    userId: number, 
    stripeInfo: { stripeCustomerId: string, stripeSubscriptionId: string | null }
  ): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ 
          stripeCustomerId: stripeInfo.stripeCustomerId,
          stripeSubscriptionId: stripeInfo.stripeSubscriptionId,
          subscriptionTier: stripeInfo.stripeSubscriptionId ? "premium" : "free"
        })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        throw new Error("User not found");
      }
      
      return updatedUser;
    } catch (error) {
      console.error('Error updating user Stripe info:', error);
      throw error;
    }
  }

  async updateUserAdminStatus(userId: number, isAdmin: boolean): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ isAdmin })
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        throw new Error("User not found");
      }
      
      console.log(`User ${userId} admin status updated to: ${isAdmin}`);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user admin status:', error);
      throw error;
    }
  }
  
  async getUserByStripeCustomerId(stripeCustomerId: string): Promise<User | undefined> {
    try {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.stripeCustomerId, stripeCustomerId));
      return user;
    } catch (error) {
      console.error('Error fetching user by Stripe customer ID:', error);
      throw error;
    }
  }
  
  async getUsersByEmail(email: string): Promise<User[]> {
    try {
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.email, email));
      return foundUsers;
    } catch (error) {
      console.error('Error fetching users by email:', error);
      throw error;
    }
  }
  
  async getUserByResetToken(token: string): Promise<User[]> {
    try {
      const foundUsers = await db
        .select()
        .from(users)
        .where(eq(users.resetPasswordToken, token));
      return foundUsers;
    } catch (error) {
      console.error('Error fetching user by reset token:', error);
      throw error;
    }
  }
  
  async updateUser(userId: number, updates: Partial<User>): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set(updates)
        .where(eq(users.id, userId))
        .returning();
      
      if (!updatedUser) {
        throw new Error("User not found");
      }
      
      console.log(`User ${userId} updated with changes:`, updates);
      return updatedUser;
    } catch (error) {
      console.error('Error updating user:', error);
      throw error;
    }
  }

  // Student methods
  async getStudents(teacherId: number): Promise<Student[]> {
    try {
      return await db
        .select()
        .from(students)
        .where(eq(students.teacherId, teacherId));
    } catch (error) {
      console.error('Error fetching students:', error);
      throw error;
    }
  }

  async getStudent(id: number): Promise<Student | undefined> {
    try {
      const [student] = await db
        .select()
        .from(students)
        .where(eq(students.id, id));
      return student;
    } catch (error) {
      console.error('Error fetching student:', error);
      throw error;
    }
  }

  async createStudent(insertStudent: InsertStudent): Promise<Student> {
    try {
      const [student] = await db
        .insert(students)
        .values(insertStudent)
        .returning();
      return student;
    } catch (error) {
      console.error('Error creating student:', error);
      throw error;
    }
  }

  async updateStudent(id: number, studentUpdate: Partial<Student>): Promise<Student> {
    try {
      const [updatedStudent] = await db
        .update(students)
        .set(studentUpdate)
        .where(eq(students.id, id))
        .returning();
      
      if (!updatedStudent) {
        throw new Error("Student not found");
      }
      
      return updatedStudent;
    } catch (error) {
      console.error('Error updating student:', error);
      throw error;
    }
  }

  async deleteStudent(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(students)
        .where(eq(students.id, id))
        .returning({ id: students.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting student:', error);
      throw error;
    }
  }

  // Lesson methods
  // Simple caching for getLessons queries to improve performance
  private lessonsCache: Map<string, {lessons: Lesson[], total: number, timestamp: number}> = new Map();
  private CACHE_TTL = 5000; // Cache time-to-live in ms (5 seconds)

  async getLessons(
    teacherId: number, 
    page: number = 1, 
    pageSize: number = 10, 
    search?: string, 
    cefrLevel?: string, 
    dateFilter?: string
  ): Promise<{lessons: Lesson[], total: number}> {
    try {
      console.log(`Getting lessons for teacherId: ${teacherId} with page: ${page}, search: ${search || 'none'}`);
      
      // Create a cache key from the query parameters
      const cacheKey = JSON.stringify({teacherId, page, pageSize, search, cefrLevel, dateFilter});
      
      // Check cache first
      const cachedResult = this.lessonsCache.get(cacheKey);
      if (cachedResult && (Date.now() - cachedResult.timestamp < this.CACHE_TTL)) {
        console.log('Returning cached lessons result');
        return {
          lessons: cachedResult.lessons,
          total: cachedResult.total
        };
      }
      
      // Calculate offset based on page number and page size
      const offset = (page - 1) * pageSize;
      
      // Build filter conditions
      const conditions = [eq(lessons.teacherId, teacherId)];
      console.log('Initial conditions:', JSON.stringify(conditions)); // Log initial conditions
      
      // Add search filter if provided
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        try {
          // Combine title and topic search with OR
          const searchCondition = or(
            ilike(lessons.title, searchTerm),
            ilike(lessons.topic, searchTerm)
          );
          conditions.push(searchCondition);
          console.log('Added search condition:', JSON.stringify(searchCondition)); // Log search condition
        } catch (error) {
          console.error('Error adding search condition:', error);
          // Don't add additional conditions on failure since teacherId is already included
        }
      }
      
      // Add CEFR level filter if provided
      if (cefrLevel && cefrLevel !== 'all') {
        const cefrCondition = eq(lessons.cefrLevel, cefrLevel);
        conditions.push(cefrCondition);
        console.log('Added CEFR condition:', JSON.stringify(cefrCondition)); // Log CEFR condition
      }
      
      // Add date filter if provided
      if (dateFilter && dateFilter !== 'all') {
        const now = new Date();
        let startDate: Date;
        
        if (dateFilter === 'today') {
          startDate = new Date(now);
          startDate.setHours(0, 0, 0, 0);
        } else if (dateFilter === 'week') {
          startDate = new Date(now);
          startDate.setDate(now.getDate() - 7);
        } else if (dateFilter === 'month') {
          startDate = new Date(now);
          startDate.setMonth(now.getMonth() - 1);
        } else {
          startDate = new Date(0); // Default to epoch start if unknown filter
        }
        
        const dateCondition = gte(lessons.createdAt, startDate);
        conditions.push(dateCondition);
        console.log('Added date condition:', JSON.stringify(dateCondition)); // Log date condition
      }
      
      console.log('Final conditions for count/fetch:', JSON.stringify(conditions)); // Log final conditions
      
      // Try a direct query first to see if we can get any lessons at all for this teacher
      // This helps us debug if the issue is with filtering or with basic data access
      try {
        const basicCheck = await db
          .select({ count: count() })
          .from(lessons)
          .where(eq(lessons.teacherId, teacherId));
        
        console.log(`Basic teacher lessons check: Teacher ID ${teacherId} has ${basicCheck[0]?.count || 0} total lessons in database`);
      } catch (e) {
        console.error('Error in basic teacher lessons check:', e);
      }
      
      // Make sure indexes exist
      try {
        await db.execute(
          `CREATE INDEX IF NOT EXISTS idx_lessons_teacher_id ON lessons(teacher_id);
           CREATE INDEX IF NOT EXISTS idx_lessons_created_at ON lessons(created_at);
           CREATE INDEX IF NOT EXISTS idx_lessons_cefr_level ON lessons(cefr_level);`
        );
        console.log('Ensured indexes exist for optimal querying');
      } catch (e) {
        console.error('Error creating indexes (non-critical):', e);
      }
      
      // Execute count query - get total count
      console.log('Executing count query...');
      let total = 0;
      try {
        const countResult = await db
          .select({ count: count() })
          .from(lessons)
          .where(and(...conditions));
        
        total = Number(countResult[0]?.count || 0);
        console.log(`Found ${total} lessons matching criteria`);
      } catch (countError) {
        console.error('Error in count query:', countError);
        // Fall back to getting all lessons and counting them
        try {
          const allLessons = await db
            .select({ id: lessons.id })
            .from(lessons)
            .where(eq(lessons.teacherId, teacherId));
          
          total = allLessons.length;
          console.log(`Fallback count method found ${total} total lessons`);
        } catch (fallbackError) {
          console.error('Error in fallback count query:', fallbackError);
        }
      }
      
      // Get the filtered and paginated lessons 
      console.log('Fetching paginated lessons...');
      let lessonsList: Lesson[] = [];
      try {
        lessonsList = await db
          .select()
          .from(lessons)
          .where(and(...conditions))
          .orderBy(desc(lessons.createdAt))
          .limit(pageSize)
          .offset(offset);
      } catch (fetchError) {
        console.error('Error fetching lessons with conditions:', fetchError);
        
        // If the conditional query fails, try a simpler query without conditions
        try {
          console.log('Attempting fallback query with minimal conditions');
          lessonsList = await db
            .select()
            .from(lessons)
            .where(eq(lessons.teacherId, teacherId))
            .orderBy(desc(lessons.createdAt))
            .limit(pageSize)
            .offset(offset);
        } catch (fallbackError) {
          console.error('Fallback query also failed:', fallbackError);
        }
      }
      
      console.log(`Retrieved ${lessonsList.length} lessons for page ${page}`);
      
      // Cache the result
      const result = {
        lessons: lessonsList,
        total
      };
      
      this.lessonsCache.set(cacheKey, {
        ...result,
        timestamp: Date.now()
      });
      
      return result;
    } catch (error) {
      console.error('Error fetching lessons:', error);
      
      // Return empty results instead of failing completely
      console.log('Returning empty results due to error');
      return {
        lessons: [],
        total: 0
      };
    }
  }

  async getLessonsByStudent(studentId: number): Promise<Lesson[]> {
    try {
      return await db
        .select()
        .from(lessons)
        .where(eq(lessons.studentId, studentId));
    } catch (error) {
      console.error('Error fetching lessons by student:', error);
      throw error;
    }
  }

  async getLesson(id: number): Promise<Lesson | undefined> {
    try {
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, id));
      return lesson;
    } catch (error) {
      console.error('Error fetching lesson:', error);
      throw error;
    }
  }

  async createLesson(insertLesson: InsertLesson): Promise<Lesson> {
    try {
      const [lesson] = await db
        .insert(lessons)
        .values(insertLesson)
        .returning();
      return lesson;
    } catch (error) {
      console.error('Error creating lesson:', error);
      throw error;
    }
  }

  async updateLesson(id: number, lessonUpdate: Partial<Lesson>): Promise<Lesson> {
    try {
      const [updatedLesson] = await db
        .update(lessons)
        .set(lessonUpdate)
        .where(eq(lessons.id, id))
        .returning();
      
      if (!updatedLesson) {
        throw new Error("Lesson not found");
      }
      
      return updatedLesson;
    } catch (error) {
      console.error('Error updating lesson:', error);
      throw error;
    }
  }

  async deleteLesson(id: number): Promise<boolean> {
    try {
      const result = await db
        .delete(lessons)
        .where(eq(lessons.id, id))
        .returning({ id: lessons.id });
      
      return result.length > 0;
    } catch (error) {
      console.error('Error deleting lesson:', error);
      throw error;
    }
  }
}

// Switch to using DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
