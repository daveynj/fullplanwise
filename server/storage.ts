import { users, students, lessons, type User, type InsertUser, type Student, type InsertStudent, type Lesson, type InsertLesson } from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { Store } from "express-session";
import { db } from "./db";
import { eq, and, desc, count } from "drizzle-orm";
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
  getLessons(teacherId: number, page?: number, pageSize?: number): Promise<{lessons: Lesson[], total: number}>;
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
  async getLessons(teacherId: number, page: number = 1, pageSize: number = 10): Promise<{lessons: Lesson[], total: number}> {
    try {
      // Calculate offset based on page number and page size
      const offset = (page - 1) * pageSize;
      
      // Get total count for pagination
      const totalCountResult = await db
        .select({ count: count() })
        .from(lessons)
        .where(eq(lessons.teacherId, teacherId));
      
      const total = totalCountResult[0]?.count || 0;
      
      // Get paginated lessons ordered by most recent first
      const lessonsList = await db
        .select()
        .from(lessons)
        .where(eq(lessons.teacherId, teacherId))
        .orderBy(desc(lessons.createdAt))
        .limit(pageSize)
        .offset(offset);
      
      return {
        lessons: lessonsList,
        total
      };
    } catch (error) {
      console.error('Error fetching lessons:', error);
      throw error;
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
