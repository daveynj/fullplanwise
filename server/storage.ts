import { 
  users, students, lessons, studentLessons, studentVocabulary,
  type User, type InsertUser, type Student, type InsertStudent, 
  type Lesson, type InsertLesson, type StudentLesson, type InsertStudentLesson,
  type StudentVocabulary, type InsertStudentVocabulary 
} from "@shared/schema";
import createMemoryStore from "memorystore";
import session from "express-session";
import { Store } from "express-session";
import { db } from "./db";
import { SQL, eq, and, desc, count, or, ilike, gte, sql } from "drizzle-orm";
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
  
  // Public library methods
  getPublicLessons(page?: number, pageSize?: number, search?: string, cefrLevel?: string, category?: string): Promise<{lessons: Lesson[], total: number}>;
  copyLessonToUser(lessonId: number, userId: number): Promise<Lesson>;
  
  // Admin methods
  getUsersWithLessonStats(page?: number, pageSize?: number, search?: string, dateFilter?: string): Promise<{users: any[], total: number}>;
  getAdminAnalytics(): Promise<{
    totalUsers: number;
    activeUsersLast30Days: number;
    activeUsersLast7Days: number;
    totalLessons: number;
    lessonsLast30Days: number;
    lessonsLast7Days: number;
    topCategories: Array<{category: string, count: number}>;
    userGrowthData: Array<{date: string, users: number, lessons: number}>;
    cefrDistribution: Array<{level: string, count: number}>;
    averageLessonsPerUser: number;
    topUsers: Array<{username: string, lessonCount: number, lastActive: string}>;
  }>;
  getAllLessonsForAdmin(page?: number, pageSize?: number, search?: string, category?: string, cefrLevel?: string): Promise<{lessons: any[], total: number}>;
  
  // Student-Lesson association methods
  assignLessonToStudent(studentId: number, lessonId: number, teacherId: number, notes?: string): Promise<StudentLesson>;
  getStudentLessons(studentId: number): Promise<Array<StudentLesson & { lesson: Lesson }>>;
  removeStudentLesson(studentId: number, lessonId: number): Promise<boolean>;
  removeStudentLessonByAssignmentId(assignmentId: number, studentId: number): Promise<boolean>;
  checkLessonAssignment(studentId: number, lessonId: number): Promise<StudentLesson | undefined>;
  updateStudentLessonStatus(id: number, status: string): Promise<StudentLesson>;
  
  // Student vocabulary methods
  addStudentVocabulary(vocabulary: InsertStudentVocabulary[]): Promise<StudentVocabulary[]>;
  getStudentVocabulary(studentId: number, limit?: number): Promise<StudentVocabulary[]>;
  extractAndSaveVocabulary(studentId: number, lessonId: number): Promise<number>;
  
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
          subscriptionTier: stripeInfo.stripeSubscriptionId ? "unlimited" : "free"
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
  private lessonsCache: Map<string, {lessons: Lesson[], total: number, timestamp: number}> = new Map();
  private CACHE_TTL = 5000; // Cache time-to-live in ms (5 seconds)

  async getLessons(
    teacherId: number, 
    page: number = 1, 
    pageSize: number = 10, 
    search?: string, 
    cefrLevel?: string, 
    dateFilter?: string,
    category?: string
  ): Promise<{lessons: Lesson[], total: number}> {
    try {
      console.log(`[Storage.getLessons] START - teacherId: ${teacherId}, page: ${page}, pageSize: ${pageSize}, search: ${search || 'none'}`);
      
      // Calculate offset based on page number and page size
      const offset = (page - 1) * pageSize;
      console.log(`[Storage.getLessons] Calculated offset: ${offset}`);
      
      // Build filter conditions
      const conditions = [eq(lessons.teacherId, teacherId)];
      console.log('Initial conditions set for teacherId:', teacherId); // Simplified log
      
      // Add search filter if provided
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        try {
          // Combine title and topic search with OR
          // Make sure searchCondition is not undefined before pushing
          const searchCondition = or(
            ilike(lessons.title, searchTerm),
            ilike(lessons.topic, searchTerm)
          );
          conditions.push(searchCondition);
          console.log('Added search condition for term:', searchTerm); // Simplified log
        } catch (error) {
          console.error('Error adding search condition:', error);
          // Don't add additional conditions on failure since teacherId is already included
        }
      }
      
      // Add CEFR level filter if provided
      if (cefrLevel && cefrLevel !== 'all') {
        const cefrCondition = eq(lessons.cefrLevel, cefrLevel);
        conditions.push(cefrCondition);
        console.log('Added CEFR condition for level:', cefrLevel); // Simplified log
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
        console.log('Added date condition for filter:', dateFilter, 'Start date:', startDate.toISOString()); // Simplified log
      }
      
      // Add category filter if provided
      if (category && category !== 'all') {
        const categoryCondition = eq(lessons.category, category);
        conditions.push(categoryCondition);
        console.log('Added category condition for category:', category); // Simplified log
      }
      
      console.log(`Final condition count for count/fetch: ${conditions.length}`); // Simplified log
      
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
      
      console.log(`[Storage.getLessons] Total lessons matching criteria: ${total}`);
            
      // Get the filtered and paginated lessons 
      console.log(`[Storage.getLessons] Fetching lessons with limit=${pageSize}, offset=${offset}...`);
      let lessonsList: Lesson[] = [];
      let fetchErrorOccurred = false;
      try {
        lessonsList = await db
          .select({
            id: lessons.id,
            teacherId: lessons.teacherId,
            studentId: lessons.studentId,
            title: lessons.title,
            topic: lessons.topic,
            cefrLevel: lessons.cefrLevel,
            notes: lessons.notes,
            grammarSpotlight: lessons.grammarSpotlight,
            category: lessons.category,
            tags: lessons.tags,
            isPublic: lessons.isPublic,
            publicCategory: lessons.publicCategory,
            createdAt: lessons.createdAt
            // Excluding 'content' field to avoid 67MB response limit
          })
          .from(lessons)
          .where(and(...conditions))
          .orderBy(desc(lessons.createdAt))
          .limit(pageSize)
          .offset(offset);
        console.log(`[Storage.getLessons] Main query successful. Found ${lessonsList.length} lessons.`);
      } catch (fetchError) {
        fetchErrorOccurred = true;
        console.error('[Storage.getLessons] Error fetching lessons with conditions:', fetchError);
        
        // If the conditional query fails, try a simpler query without conditions
        try {
          console.log('[Storage.getLessons] Attempting fallback query with minimal conditions...');
          lessonsList = await db
            .select({
              id: lessons.id,
              teacherId: lessons.teacherId,
              studentId: lessons.studentId,
              title: lessons.title,
              topic: lessons.topic,
              cefrLevel: lessons.cefrLevel,
              notes: lessons.notes,
              grammarSpotlight: lessons.grammarSpotlight,
              category: lessons.category,
              tags: lessons.tags,
              isPublic: lessons.isPublic,
              publicCategory: lessons.publicCategory,
              createdAt: lessons.createdAt
              // Excluding 'content' field to avoid 67MB response limit
            })
            .from(lessons)
            .where(eq(lessons.teacherId, teacherId))
            .orderBy(desc(lessons.createdAt))
            .limit(pageSize)
            .offset(offset);
           console.log(`[Storage.getLessons] Fallback query successful. Found ${lessonsList.length} lessons.`);
        } catch (fallbackError) {
          console.error('[Storage.getLessons] Fallback query also failed:', fallbackError);
          lessonsList = []; // Ensure empty list on complete failure
        }
      }
      
      console.log(`[Storage.getLessons] Returning ${lessonsList.length} lessons for page ${page}. Fetch error occurred: ${fetchErrorOccurred}`);
      
      // Return result directly without caching
      return {
        lessons: lessonsList,
        total
      };
    } catch (error) {
      console.error('[Storage.getLessons] Outer catch block error:', error);
      
      // Return empty results instead of failing completely
      console.log('[Storage.getLessons] Returning empty results due to outer error');
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
      console.log(`[Storage.getLesson] Fetching lesson ${id}`);
      const [lesson] = await db
        .select()
        .from(lessons)
        .where(eq(lessons.id, id));
      
      if (lesson) {
        console.log(`[Storage.getLesson] Found lesson ${id}: "${lesson.title}"`);
      } else {
        console.log(`[Storage.getLesson] Lesson ${id} not found in database`);
      }
      
      return lesson;
    } catch (error) {
      console.error(`[Storage.getLesson] Error fetching lesson ${id}:`, error);
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
  
  // Admin methods
  async getUsersWithLessonStats(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    dateFilter?: string
  ): Promise<{users: any[], total: number}> {
    try {
      console.log(`Getting users with lesson stats, page: ${page}, search: ${search || 'none'}, dateFilter: ${dateFilter || 'none'}`);
      
      // Calculate offset based on page number and page size
      const offset = (page - 1) * pageSize;
      
      // Build search condition for users
      let userConditions = [];
      if (search && search.trim() !== '') {
        const searchTerm = `%${search.trim()}%`;
        userConditions.push(
          or(
            ilike(users.username, searchTerm),
            ilike(users.email, searchTerm),
            ilike(users.fullName, searchTerm)
          )
        );
      }
      
      // Find the total number of users matching search
      let countResult;
      if (userConditions.length > 0) {
        countResult = await db
          .select({ count: count() })
          .from(users)
          .where(and(...userConditions));
      } else {
        countResult = await db
          .select({ count: count() })
          .from(users);
      }
      
      const total = Number(countResult[0]?.count || 0);
      
      // Get users with pagination
      let usersList;
      if (userConditions.length > 0) {
        usersList = await db
          .select()
          .from(users)
          .where(and(...userConditions))
          .orderBy(desc(users.id))
          .limit(pageSize)
          .offset(offset);
      } else {
        usersList = await db
          .select()
          .from(users)
          .orderBy(desc(users.id))
          .limit(pageSize)
          .offset(offset);
      }
      
      // Build date filter for lessons if needed
      let startDate: Date | undefined;
      if (dateFilter && dateFilter !== 'all') {
        const now = new Date();
        
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
      }
      
      // For each user, get their lesson stats
      const usersWithStats = await Promise.all(
        usersList.map(async (user) => {
          // Count total lessons
          let lessonCountResult;
          if (startDate) {
            lessonCountResult = await db
              .select({ count: count() })
              .from(lessons)
              .where(
                and(
                  eq(lessons.teacherId, user.id),
                  gte(lessons.createdAt, startDate)
                )
              );
          } else {
            lessonCountResult = await db
              .select({ count: count() })
              .from(lessons)
              .where(eq(lessons.teacherId, user.id));
          }
          
          const lessonCount = Number(lessonCountResult[0]?.count || 0);
          
          // Get most recent lesson date
          let recentLesson;
          if (startDate) {
            const dateFilter = and(
              eq(lessons.teacherId, user.id),
              gte(lessons.createdAt, startDate)
            );
            recentLesson = await db
              .select({ createdAt: lessons.createdAt })
              .from(lessons)
              .where(dateFilter)
              .orderBy(desc(lessons.createdAt))
              .limit(1);
          } else {
            recentLesson = await db
              .select({ createdAt: lessons.createdAt })
              .from(lessons)
              .where(eq(lessons.teacherId, user.id))
              .orderBy(desc(lessons.createdAt))
              .limit(1);
          }
          
          const mostRecentDate = recentLesson[0]?.createdAt || null;
          
          // Create user object without password
          const { password, ...userWithoutPassword } = user;
          
          // Return user with lesson stats
          return {
            ...userWithoutPassword,
            lessonCount,
            mostRecentLessonDate: mostRecentDate
          };
        })
      );
      
      return {
        users: usersWithStats,
        total
      };
    } catch (error) {
      console.error('Error fetching users with lesson stats:', error);
      
      // Return empty results instead of failing completely
      return {
        users: [],
        total: 0
      };
    }
  }

  async getAdminAnalytics() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      // Use simple count queries for basic analytics
      const totalUsersResult = await db.select({ count: sql`count(*)` }).from(users);
      const totalUsers = Number(totalUsersResult[0].count);

      const totalLessonsResult = await db.select({ count: sql`count(*)` }).from(lessons);
      const totalLessons = Number(totalLessonsResult[0].count);

      // Active users who created lessons in last 30 days
      const activeUsers30Result = await db
        .select({ count: sql`count(distinct ${users.id})` })
        .from(users)
        .innerJoin(lessons, eq(users.id, lessons.teacherId))
        .where(gte(lessons.createdAt, thirtyDaysAgo));
      const activeUsersLast30Days = Number(activeUsers30Result[0].count);

      // Active users who created lessons in last 7 days
      const activeUsers7Result = await db
        .select({ count: sql`count(distinct ${users.id})` })
        .from(users)
        .innerJoin(lessons, eq(users.id, lessons.teacherId))
        .where(gte(lessons.createdAt, sevenDaysAgo));
      const activeUsersLast7Days = Number(activeUsers7Result[0].count);

      // Lessons created in last 30 days
      const lessons30Result = await db
        .select({ count: sql`count(*)` })
        .from(lessons)
        .where(gte(lessons.createdAt, thirtyDaysAgo));
      const lessonsLast30Days = Number(lessons30Result[0].count);

      // Lessons created in last 7 days
      const lessons7Result = await db
        .select({ count: sql`count(*)` })
        .from(lessons)
        .where(gte(lessons.createdAt, sevenDaysAgo));
      const lessonsLast7Days = Number(lessons7Result[0].count);

      // Top categories
      const topCategoriesResult = await db
        .select({
          category: lessons.category,
          count: sql`count(*)`.as('count')
        })
        .from(lessons)
        .groupBy(lessons.category)
        .orderBy(desc(sql`count(*)`))
        .limit(10);
      const topCategories = topCategoriesResult.map(row => ({
        category: row.category,
        count: Number(row.count)
      }));

      // CEFR level distribution
      const cefrDistributionResult = await db
        .select({
          level: lessons.cefrLevel,
          count: sql`count(*)`.as('count')
        })
        .from(lessons)
        .groupBy(lessons.cefrLevel)
        .orderBy(lessons.cefrLevel);
      const cefrDistribution = cefrDistributionResult.map(row => ({
        level: row.level,
        count: Number(row.count)
      }));

      // Average lessons per user
      const averageLessonsPerUser = totalUsers > 0 ? Math.round((totalLessons / totalUsers) * 10) / 10 : 0;

      // Top users by lesson count
      const topUsersResult = await db
        .select({
          username: users.username,
          lessonCount: sql`count(${lessons.id})`.as('lessonCount'),
          lastActive: sql`max(${lessons.createdAt})`.as('lastActive')
        })
        .from(users)
        .leftJoin(lessons, eq(users.id, lessons.teacherId))
        .groupBy(users.id, users.username)
        .having(sql`count(${lessons.id}) > 0`)
        .orderBy(desc(sql`count(${lessons.id})`))
        .limit(10);
      const topUsers = topUsersResult.map(row => ({
        username: row.username,
        lessonCount: Number(row.lessonCount),
        lastActive: row.lastActive as string
      }));

      // Simple user growth data placeholder
      const userGrowthData: Array<{date: string, users: number, lessons: number}> = [];

      return {
        totalUsers,
        activeUsersLast30Days,
        activeUsersLast7Days,
        totalLessons,
        lessonsLast30Days,
        lessonsLast7Days,
        topCategories,
        userGrowthData,
        cefrDistribution,
        averageLessonsPerUser,
        topUsers
      };
    } catch (error) {
      console.error('Error fetching admin analytics:', error);
      throw error;
    }
  }

  async getAllLessonsForAdmin(page = 1, pageSize = 20, search = '', category = 'all', cefrLevel = 'all') {
    try {
      const offset = (page - 1) * pageSize;
      
      // Build base query for counting
      let countQuery = db
        .select({ count: sql`count(*)` })
        .from(lessons)
        .innerJoin(users, eq(lessons.teacherId, users.id));

      // Build base query for lessons
      let lessonsQuery = db
        .select({
          id: lessons.id,
          title: lessons.title,
          topic: lessons.topic,
          cefrLevel: lessons.cefrLevel,
          category: lessons.category,
          createdAt: lessons.createdAt,
          teacherName: users.username,
          contentPreview: sql`substring(${lessons.content}, 1, 200)`.as('contentPreview')
        })
        .from(lessons)
        .innerJoin(users, eq(lessons.teacherId, users.id));

      // Apply search filter
      if (search && search !== '') {
        const searchCondition = or(
          ilike(lessons.title, `%${search}%`),
          ilike(lessons.topic, `%${search}%`),
          ilike(users.username, `%${search}%`)
        );
        countQuery = countQuery.where(searchCondition);
        lessonsQuery = lessonsQuery.where(searchCondition);
      }
      
      // Apply category filter
      if (category && category !== 'all') {
        countQuery = countQuery.where(eq(lessons.category, category));
        lessonsQuery = lessonsQuery.where(eq(lessons.category, category));
      }
      
      // Apply CEFR level filter
      if (cefrLevel && cefrLevel !== 'all') {
        countQuery = countQuery.where(eq(lessons.cefrLevel, cefrLevel));
        lessonsQuery = lessonsQuery.where(eq(lessons.cefrLevel, cefrLevel));
      }

      // Execute count query
      const [countResult] = await countQuery;
      const total = Number(countResult.count);
      
      // Execute lessons query
      const lessonsResult = await lessonsQuery
        .orderBy(desc(lessons.createdAt))
        .limit(pageSize)
        .offset(offset);
      
      return {
        lessons: lessonsResult,
        total
      };
    } catch (error) {
      console.error('Error fetching admin lessons:', error);
      throw error;
    }
  }

  async getPublicLessons(page = 1, pageSize = 20, search = '', cefrLevel = 'all', category = 'all') {
    try {
      const offset = (page - 1) * pageSize;
      
      // Build base query for counting
      let countQuery = db
        .select({ count: sql`count(*)` })
        .from(lessons)
        .innerJoin(users, eq(lessons.teacherId, users.id))
        .where(eq(lessons.isPublic, true));

      // Build base query for lessons
      let lessonsQuery = db
        .select({
          id: lessons.id,
          title: lessons.title,
          topic: lessons.topic,
          cefrLevel: lessons.cefrLevel,
          category: lessons.category,
          publicCategory: lessons.publicCategory,
          createdAt: lessons.createdAt,
          teacherName: users.username,
          contentPreview: sql`substring(${lessons.content}::text, 1, 200)`.as('contentPreview')
        })
        .from(lessons)
        .innerJoin(users, eq(lessons.teacherId, users.id))
        .where(eq(lessons.isPublic, true));

      // Apply search filter
      if (search && search !== '') {
        const searchCondition = or(
          ilike(lessons.title, `%${search}%`),
          ilike(lessons.topic, `%${search}%`),
          ilike(users.username, `%${search}%`)
        );
        countQuery = countQuery.where(and(eq(lessons.isPublic, true), searchCondition));
        lessonsQuery = lessonsQuery.where(and(eq(lessons.isPublic, true), searchCondition));
      }
      
      // Apply category filter (using publicCategory field)
      if (category && category !== 'all') {
        countQuery = countQuery.where(and(eq(lessons.isPublic, true), eq(lessons.publicCategory, category)));
        lessonsQuery = lessonsQuery.where(and(eq(lessons.isPublic, true), eq(lessons.publicCategory, category)));
      }
      
      // Apply CEFR level filter
      if (cefrLevel && cefrLevel !== 'all') {
        countQuery = countQuery.where(and(eq(lessons.isPublic, true), eq(lessons.cefrLevel, cefrLevel)));
        lessonsQuery = lessonsQuery.where(and(eq(lessons.isPublic, true), eq(lessons.cefrLevel, cefrLevel)));
      }

      // Execute count query
      const [countResult] = await countQuery;
      const total = Number(countResult.count);
      
      // Execute lessons query
      const lessonsResult = await lessonsQuery
        .orderBy(desc(lessons.createdAt))
        .limit(pageSize)
        .offset(offset);
      
      return {
        lessons: lessonsResult,
        total
      };
    } catch (error) {
      console.error('Error fetching public lessons:', error);
      throw error;
    }
  }

  async copyLessonToUser(lessonId: number, userId: number): Promise<Lesson> {
    try {
      // Get the original lesson
      const originalLesson = await this.getLesson(lessonId);
      if (!originalLesson) {
        throw new Error('Lesson not found');
      }

      // Verify it's a public lesson
      if (!originalLesson.isPublic) {
        throw new Error('Lesson is not available in public library');
      }

      // Create a copy for the user
      const lessonCopy = {
        teacherId: userId,
        title: originalLesson.title + ' (Copy)',
        topic: originalLesson.topic,
        cefrLevel: originalLesson.cefrLevel,
        content: originalLesson.content,
        notes: originalLesson.notes,
        grammarSpotlight: originalLesson.grammarSpotlight,
        category: originalLesson.category,
        tags: originalLesson.tags || [],
        isPublic: false, // User copies are private by default
        publicCategory: null
      };

      const [newLesson] = await db.insert(lessons).values(lessonCopy).returning();
      return newLesson;
    } catch (error) {
      console.error('Error copying lesson:', error);
      throw error;
    }
  }

  // Student-Lesson association methods
  async assignLessonToStudent(studentId: number, lessonId: number, teacherId: number, notes?: string): Promise<StudentLesson> {
    try {
      const [studentLesson] = await db.insert(studentLessons).values({
        studentId,
        lessonId,
        teacherId,
        notes: notes || null,
        status: 'assigned'
      }).returning();
      
      // Extract and save vocabulary from this lesson
      await this.extractAndSaveVocabulary(studentId, lessonId);
      
      return studentLesson;
    } catch (error) {
      console.error('Error assigning lesson to student:', error);
      throw error;
    }
  }

  async getStudentLessons(studentId: number): Promise<Array<StudentLesson & { lesson: any }>> {
    try {
      console.log(`[getStudentLessons] Fetching lessons for student ${studentId}`);
      
      // Use basic select with explicit column selection to avoid loading massive content field
      const result = await db
        .select({
          // All student_lessons fields
          id: studentLessons.id,
          studentId: studentLessons.studentId,
          lessonId: studentLessons.lessonId,
          teacherId: studentLessons.teacherId,
          assignedAt: studentLessons.assignedAt,
          status: studentLessons.status,
          notes: studentLessons.notes,
          // Only lesson metadata - EXCLUDE content field
          lesson: {
            id: lessons.id,
            teacherId: lessons.teacherId,
            studentId: lessons.studentId,
            title: lessons.title,
            topic: lessons.topic,
            cefrLevel: lessons.cefrLevel,
            notes: lessons.notes,
            grammarSpotlight: lessons.grammarSpotlight,
            category: lessons.category,
            tags: lessons.tags,
            isPublic: lessons.isPublic,
            publicCategory: lessons.publicCategory,
            createdAt: lessons.createdAt,
          }
        })
        .from(studentLessons)
        .leftJoin(lessons, eq(studentLessons.lessonId, lessons.id))
        .where(eq(studentLessons.studentId, studentId))
        .orderBy(desc(studentLessons.assignedAt));
      
      console.log(`[getStudentLessons] Found ${result.length} lesson assignments`);
      
      // Filter out orphaned assignments where lesson doesn't exist
      // With LEFT JOIN, row.lesson is an object with null values when no match
      const validLessons = result.filter(row => row.lesson.id !== null);
      
      if (validLessons.length < result.length) {
        console.log(`[getStudentLessons] Warning: Filtered out ${result.length - validLessons.length} orphaned lesson assignments`);
      }
      
      return validLessons as any;
    } catch (error) {
      console.error('Error getting student lessons:', error);
      throw error;
    }
  }

  async removeStudentLesson(studentId: number, lessonId: number): Promise<boolean> {
    try {
      // First, remove vocabulary associated with this lesson
      await db.delete(studentVocabulary)
        .where(and(
          eq(studentVocabulary.studentId, studentId),
          eq(studentVocabulary.lessonId, lessonId)
        ));
      console.log(`Removed vocabulary for student ${studentId}, lesson ${lessonId}`);
      
      // Then remove the lesson association
      await db.delete(studentLessons)
        .where(and(
          eq(studentLessons.studentId, studentId),
          eq(studentLessons.lessonId, lessonId)
        ));
      console.log(`Removed lesson association for student ${studentId}, lesson ${lessonId}`);
      
      return true;
    } catch (error) {
      console.error('Error removing student lesson:', error);
      throw error;
    }
  }

  async removeStudentLessonByAssignmentId(assignmentId: number, studentId: number): Promise<boolean> {
    try {
      // First, get the lesson ID from the assignment
      const [assignment] = await db
        .select()
        .from(studentLessons)
        .where(and(
          eq(studentLessons.id, assignmentId),
          eq(studentLessons.studentId, studentId)
        ));
      
      if (!assignment) {
        console.log(`No assignment found for ID ${assignmentId}`);
        return false;
      }
      
      // Remove vocabulary associated with this specific assignment
      await db.delete(studentVocabulary)
        .where(and(
          eq(studentVocabulary.studentId, studentId),
          eq(studentVocabulary.lessonId, assignment.lessonId)
        ));
      console.log(`Removed vocabulary for student ${studentId}, lesson ${assignment.lessonId} (assignment ${assignmentId})`);
      
      // Remove the specific lesson assignment
      await db.delete(studentLessons)
        .where(eq(studentLessons.id, assignmentId));
      console.log(`Removed lesson assignment ${assignmentId} for student ${studentId}`);
      
      return true;
    } catch (error) {
      console.error('Error removing student lesson by assignment ID:', error);
      throw error;
    }
  }

  async checkLessonAssignment(studentId: number, lessonId: number): Promise<StudentLesson | undefined> {
    try {
      const [assignment] = await db
        .select()
        .from(studentLessons)
        .where(and(
          eq(studentLessons.studentId, studentId),
          eq(studentLessons.lessonId, lessonId)
        ))
        .limit(1);
      return assignment;
    } catch (error) {
      console.error('Error checking lesson assignment:', error);
      throw error;
    }
  }

  async updateStudentLessonStatus(id: number, status: string): Promise<StudentLesson> {
    try {
      const [updated] = await db
        .update(studentLessons)
        .set({ status })
        .where(eq(studentLessons.id, id))
        .returning();
      return updated;
    } catch (error) {
      console.error('Error updating student lesson status:', error);
      throw error;
    }
  }

  // Student vocabulary methods
  async addStudentVocabulary(vocabulary: InsertStudentVocabulary[]): Promise<StudentVocabulary[]> {
    try {
      if (vocabulary.length === 0) return [];
      const result = await db.insert(studentVocabulary).values(vocabulary).returning();
      return result;
    } catch (error) {
      console.error('Error adding student vocabulary:', error);
      throw error;
    }
  }

  async getStudentVocabulary(studentId: number, limit?: number): Promise<StudentVocabulary[]> {
    try {
      let query = db
        .select()
        .from(studentVocabulary)
        .where(eq(studentVocabulary.studentId, studentId))
        .orderBy(desc(studentVocabulary.learnedAt));
      
      if (limit) {
        query = query.limit(limit);
      }
      
      return await query;
    } catch (error) {
      console.error('Error getting student vocabulary:', error);
      throw error;
    }
  }

  async extractAndSaveVocabulary(studentId: number, lessonId: number): Promise<number> {
    try {
      console.log(`[extractAndSaveVocabulary] Starting extraction for student ${studentId}, lesson ${lessonId}`);
      const lesson = await this.getLesson(lessonId);
      if (!lesson || !lesson.content) {
        console.log(`[extractAndSaveVocabulary] Lesson ${lessonId} not found or has no content`);
        return 0;
      }

      const vocabularyToAdd: InsertStudentVocabulary[] = [];
      // Parse content if it's a string
      let content = lesson.content as any;
      console.log(`[extractAndSaveVocabulary] Content type: ${typeof content}`);
      
      if (typeof content === 'string') {
        try {
          content = JSON.parse(content);
          console.log(`[extractAndSaveVocabulary] Parsed string content to object`);
        } catch (parseError) {
          console.error(`[extractAndSaveVocabulary] Failed to parse content JSON:`, parseError);
          return 0;
        }
      }

      // Get existing vocabulary for this student to avoid duplicates
      const existingVocab = await this.getStudentVocabulary(studentId);
      const existingWords = new Set(existingVocab.map(v => v.word.toLowerCase()));
      console.log(`[extractAndSaveVocabulary] Student already knows ${existingWords.size} unique words`);

      // Extract vocabulary from lesson sections
      if (content.sections && Array.isArray(content.sections)) {
        console.log(`[extractAndSaveVocabulary] Found ${content.sections.length} sections`);
        for (const section of content.sections) {
          if (section.type === 'vocabulary' && section.words && Array.isArray(section.words)) {
            console.log(`[extractAndSaveVocabulary] Found vocabulary section with ${section.words.length} words`);
            for (const word of section.words) {
              const wordTerm = (word.term || word.word || '').toLowerCase();
              
              // Only add if student doesn't already know this word
              if (wordTerm && !existingWords.has(wordTerm)) {
                vocabularyToAdd.push({
                  studentId,
                  lessonId,
                  word: word.term || word.word || '',
                  definition: word.coreDefinition || word.definition || '',
                  cefrLevel: lesson.cefrLevel
                });
              } else if (wordTerm) {
                console.log(`[extractAndSaveVocabulary] Skipping duplicate word: ${wordTerm}`);
              }
            }
          }
        }
      } else {
        console.log(`[extractAndSaveVocabulary] No sections found in content or sections is not an array`);
      }

      console.log(`[extractAndSaveVocabulary] Extracted ${vocabularyToAdd.length} NEW vocabulary words (skipped duplicates)`);
      if (vocabularyToAdd.length > 0) {
        await this.addStudentVocabulary(vocabularyToAdd);
        console.log(`[extractAndSaveVocabulary] ✅ Saved ${vocabularyToAdd.length} vocabulary items to database`);
      } else {
        console.log(`[extractAndSaveVocabulary] ℹ️  No new vocabulary to save (all words already known)`);
      }

      return vocabularyToAdd.length;
    } catch (error) {
      console.error('Error extracting and saving vocabulary:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
