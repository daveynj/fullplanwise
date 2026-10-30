
import {
  users, students, lessons, studentLessons, studentVocabulary, studentPracticeLog, studentIdeas, studentLessonJobs, blogPosts,
  type User, type InsertUser, type Student, type InsertStudent,
  type Lesson, type InsertLesson, type StudentLesson, type InsertStudentLesson,
  type StudentVocabulary, type InsertStudentVocabulary, type StudentIdea,
  type BlogPost, type InsertBlogPost, type UpdateBlogPost
} from "@shared/schema";
import { Store } from "express-session";
import { db, pool } from "./db";
import { createSessionStore } from "./session-store";
import { extractLessonSummary, LESSON_SUMMARY_SOURCE_CHARS } from "@shared/lesson-content";
import { EXPRESSIONS_SECTION_TYPE, expressionItemsOf } from "@shared/lesson-expressions";
import {
  IDEA_DISMISSED,
  IDEA_MADE,
  IDEA_WAITING,
  LESSON_STATUS_DONE,
  LESSON_STATUS_PLANNED,
  MAX_WAITING_IDEAS,
  MAX_WAITING_STUDENT_LESSONS,
  STUDENT_LESSONS_PER_DAY,
  isLessonDone,
  nextPractice,
  type PracticeResult,
  type StudentPracticeStats,
  type StudentRequestCounts,
} from "@shared/student-page";
import { lessonWordDetails } from "./lesson-word-details";
import { ABANDONED_JOB_AGE_MS } from "./lesson-jobs";
import { SQL, eq, and, desc, count, or, ilike, gte, sql, inArray, ne, isNull } from "drizzle-orm";

/** Whether a student may start making a lesson now (reserveStudentLessonJob). */
export type StudentLessonReservation =
  | { status: "reserved" }
  /** A lesson is already being made: the student page follows that one. */
  | { status: "making"; jobId: string }
  /** MAX_WAITING_STUDENT_LESSONS lessons they made are waiting. */
  | { status: "full" }
  /** STUDENT_LESSONS_PER_DAY started in the last 24 hours. */
  | { status: "daily_limit" };

export interface StudentLessonJobRow {
  id: string;
  topic: string;
  status: "pending" | "complete" | "error";
  lessonId: number | null;
  error: string | null;
  /** Pending for longer than any generation takes: its server stopped. */
  abandoned: boolean;
}

/**
 * Two-key advisory lock (namespace, student id) that takes one student's
 * ideas and lessons one at a time, so the waiting limits hold across servers.
 * Lesson generation for teachers uses 42_0001 (server/lesson-jobs.ts).
 */
const STUDENT_REQUEST_LOCK_NAMESPACE = 42_0002;

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
  updateUserPreferredModel(userId: number, model: string | null): Promise<User>;
  decrementUserCredits(userId: number): Promise<void>;
  tryDecrementUserCredits(userId: number): Promise<boolean>;
  incrementUserCredits(userId: number): Promise<void>;
  updateLastLogin(userId: number): Promise<void>;

  // Student methods
  getStudents(teacherId: number): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<Student>): Promise<Student>;
  deleteStudent(id: number): Promise<boolean>;

  // Lesson methods
  getLessons(teacherId: number, page?: number, pageSize?: number, search?: string, cefrLevel?: string, dateFilter?: string): Promise<{ lessons: Lesson[], total: number }>;
  getLessonsByStudent(studentId: number): Promise<Lesson[]>;
  getLesson(id: number): Promise<Lesson | undefined>;
  createLesson(lesson: InsertLesson): Promise<Lesson>;
  updateLesson(id: number, lessonUpdate: Partial<Lesson>): Promise<Lesson>;
  deleteLesson(id: number): Promise<boolean>;
  getLessonDeletionInfo(id: number): Promise<{ assignmentCount: number, affectedStudentIds: number[], lessonTitle: string }>;
  deleteLessonWithStrategy(id: number, strategy: 'delete_all' | 'keep_vocabulary'): Promise<boolean>;

  // Public library methods
  getPublicLessons(page?: number, pageSize?: number, search?: string, cefrLevel?: string, category?: string): Promise<{ lessons: Lesson[], total: number }>;
  getPublicLessonSummaries(cefrLevel?: string): Promise<Array<Pick<Lesson, 'id' | 'title' | 'cefrLevel' | 'publicCategory' | 'createdAt'>>>;
  copyLessonToUser(lessonId: number, userId: number): Promise<Lesson>;

  // Admin methods
  getUsersWithLessonStats(page?: number, pageSize?: number, search?: string, dateFilter?: string): Promise<{ users: any[], total: number }>;
  getAdminAnalytics(): Promise<{
    totalUsers: number;
    activeUsersLast30Days: number;
    activeUsersLast7Days: number;
    totalLessons: number;
    lessonsLast30Days: number;
    lessonsLast7Days: number;
    paidUsers: number;
    topCategories: Array<{ category: string, count: number }>;
    userGrowthData: Array<{ date: string, users: number, lessons: number }>;
    cefrDistribution: Array<{ level: string, count: number }>;
    averageLessonsPerUser: number;
    topUsers: Array<{ username: string, lessonCount: number, lastActive: string }>;
  }>;
  getAllLessonsForAdmin(page?: number, pageSize?: number, search?: string, category?: string, cefrLevel?: string): Promise<{ lessons: any[], total: number }>;

  // Student-Lesson association methods
  assignLessonToStudent(studentId: number, lessonId: number, teacherId: number, notes?: string): Promise<StudentLesson>;
  getStudentLessons(studentId: number): Promise<Array<StudentLesson & { lesson: Lesson }>>;
  removeStudentLesson(studentId: number, lessonId: number): Promise<boolean>;
  removeStudentLessonByAssignmentId(assignmentId: number, studentId: number): Promise<boolean>;
  checkLessonAssignment(studentId: number, lessonId: number): Promise<StudentLesson | undefined>;
  getStudentLessonAssignment(assignmentId: number): Promise<StudentLesson | undefined>;
  markStudentLessonDone(assignmentId: number): Promise<{ assignment: StudentLesson; wordsAdded: number }>;
  markStudentLessonPlanned(assignmentId: number): Promise<StudentLesson>;
  getPlannedLessonWords(studentId: number): Promise<string[]>;

  // Student vocabulary methods
  addStudentVocabulary(vocabulary: InsertStudentVocabulary[]): Promise<StudentVocabulary[]>;
  getStudentVocabulary(studentId: number, limit?: number): Promise<StudentVocabulary[]>;
  extractAndSaveVocabulary(studentId: number, lessonId: number): Promise<number>;

  // The student's own page (shared/student-page.ts)
  getStudentByPageToken(token: string): Promise<Student | undefined>;
  getLessonAccess(lessonId: number): Promise<{ teacherId: number; isPublic: boolean } | undefined>;
  recordStudentPractice(studentId: number, vocabularyId: number, result: PracticeResult): Promise<StudentVocabulary | undefined>;
  getStudentPracticeStats(studentId: number): Promise<StudentPracticeStats>;

  // Ideas and lessons students make on their page
  getWaitingIdeas(studentId: number): Promise<StudentIdea[]>;
  addStudentIdea(student: Pick<Student, "id" | "teacherId">, topic: string): Promise<StudentIdea | null>;
  removeStudentIdea(studentId: number, ideaId: number): Promise<boolean>;
  setStudentIdeaDismissed(teacherId: number, studentId: number, ideaId: number, dismissed: boolean): Promise<StudentIdea | undefined>;
  markStudentIdeaMade(ideaId: number, studentId: number, teacherId: number, lessonId: number): Promise<boolean>;
  getIdeaLessonIds(studentId: number): Promise<number[]>;
  setStudentNextLesson(studentId: number, lessonId: number): Promise<boolean>;
  removeStudentMadeLesson(student: Pick<Student, "id" | "teacherId">, lessonId: number): Promise<{ lessonDeleted: boolean } | null>;
  reserveStudentLessonJob(jobId: string, student: Pick<Student, "id" | "teacherId">, topic: string): Promise<StudentLessonReservation>;
  completeStudentLessonJob(jobId: string, student: Pick<Student, "id" | "teacherId">, lesson: InsertLesson): Promise<Lesson>;
  failStudentLessonJob(jobId: string, message: string): Promise<void>;
  getStudentLessonJob(jobId: string, studentId: number): Promise<StudentLessonJobRow | undefined>;
  getStudentMakingJob(studentId: number): Promise<{ id: string; topic: string } | undefined>;
  countStudentLessonsToday(studentId: number): Promise<number>;
  pruneStudentLessonJobs(): Promise<void>;
  getStudentRequestCounts(teacherId: number): Promise<StudentRequestCounts>;
  getStudentMadeLessons(teacherId: number): Promise<Array<{ lessonId: number; studentId: number }>>;

  // Blog post methods
  getAllBlogPosts(page?: number, pageSize?: number, category?: string, featured?: boolean, isPublished?: boolean): Promise<{ posts: BlogPost[], total: number }>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  updateBlogPost(id: number, post: UpdateBlogPost): Promise<BlogPost>;
  deleteBlogPost(id: number): Promise<boolean>;

  // Session store
  sessionStore: Store;
}

// List queries fetch only the first few KB of the raw content column
// (`contentHead`) and turn it into a readable card summary here, instead of
// sending encoded lesson JSON to the client.
function withContentPreview<T extends { contentHead: string | null }>(rows: T[]) {
  return rows.map(({ contentHead, ...rest }) => ({
    ...rest,
    contentPreview: extractLessonSummary(contentHead),
  }));
}

export class DatabaseStorage implements IStorage {
  sessionStore: Store;

  constructor() {
    this.sessionStore = createSessionStore(pool);
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
      // Calculate trial expiry date (5 days from now) — new accounts get
      // unlimited lesson generation until this date.
      const trialExpiresAt = new Date();
      trialExpiresAt.setDate(trialExpiresAt.getDate() + 5);

      // Ensure default values are set
      const userToInsert = {
        ...insertUser,
        fullName: insertUser.fullName || insertUser.username,
        isAdmin: false,
        subscriptionTier: "free",
        freeCreditsRemaining: 0,  // hard paywall after the trial — applies to new accounts only
        trialExpiresAt  // 5-day unlimited trial for new signups
      };

      const [user] = await db.insert(users).values(userToInsert).returning();
      console.log(`User created in database with ID: ${user.id}, trial expires: ${trialExpiresAt.toISOString()}`);
      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async decrementUserCredits(userId: number): Promise<void> {
    try {
      await db.update(users)
        .set({
          freeCreditsRemaining: sql`GREATEST(0, COALESCE(${users.freeCreditsRemaining}, 0) - 1)`
        })
        .where(eq(users.id, userId));
      console.log(`Decremented credits for user ${userId}`);
    } catch (error) {
      console.error('Error decrementing user credits:', error);
      throw error;
    }
  }

  // Atomically decrement one credit only when the balance is above zero.
  // Returns true when a credit was actually spent, false when the balance was empty.
  async tryDecrementUserCredits(userId: number): Promise<boolean> {
    try {
      const result = await db.update(users)
        .set({
          freeCreditsRemaining: sql`COALESCE(${users.freeCreditsRemaining}, 0) - 1`
        })
        .where(and(
          eq(users.id, userId),
          sql`COALESCE(${users.freeCreditsRemaining}, 0) > 0`
        ))
        .returning({ id: users.id });
      const decremented = result.length > 0;
      console.log(`Atomic credit decrement for user ${userId}: ${decremented ? 'spent 1 credit' : 'no credits available'}`);
      return decremented;
    } catch (error) {
      console.error('Error atomically decrementing user credits:', error);
      throw error;
    }
  }

  // Compensating increment used to refund a credit when generation fails
  async incrementUserCredits(userId: number): Promise<void> {
    try {
      await db.update(users)
        .set({
          freeCreditsRemaining: sql`COALESCE(${users.freeCreditsRemaining}, 0) + 1`
        })
        .where(eq(users.id, userId));
      console.log(`Refunded 1 credit for user ${userId}`);
    } catch (error) {
      console.error('Error refunding user credit:', error);
      throw error;
    }
  }

  async updateLastLogin(userId: number): Promise<void> {
    try {
      await db.update(users)
        .set({ lastLoginAt: new Date() })
        .where(eq(users.id, userId));
    } catch (error) {
      console.error('Error updating last login:', error);
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

  async updateUserPreferredModel(userId: number, model: string | null): Promise<User> {
    try {
      const [updatedUser] = await db
        .update(users)
        .set({ preferredAiModel: model })
        .where(eq(users.id, userId))
        .returning();

      if (!updatedUser) {
        throw new Error("User not found");
      }

      console.log(`User ${userId} preferred AI model set to:`, model ?? '(default)');
      return updatedUser;
    } catch (error) {
      console.error('Error updating preferred AI model:', error);
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
  private lessonsCache: Map<string, { lessons: Lesson[], total: number, timestamp: number }> = new Map();
  private CACHE_TTL = 5000; // Cache time-to-live in ms (5 seconds)

  async getLessons(
    teacherId: number,
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    cefrLevel?: string,
    dateFilter?: string,
    category?: string
  ): Promise<{ lessons: Lesson[], total: number }> {
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
          if (searchCondition) conditions.push(searchCondition);
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

      // Indexes for these queries are created once at startup (see db-indexes.ts)

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
          .offset(offset) as unknown as Lesson[];
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
            .offset(offset) as unknown as Lesson[];
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

  async getLessonDeletionInfo(id: number): Promise<{ assignmentCount: number, affectedStudentIds: number[], lessonTitle: string }> {
    try {
      // Get lesson title
      const [lesson] = await db.select({ title: lessons.title })
        .from(lessons)
        .where(eq(lessons.id, id));

      if (!lesson) {
        throw new Error('Lesson not found');
      }

      // Get all assignments for this lesson
      const assignments = await db.select({ studentId: studentLessons.studentId })
        .from(studentLessons)
        .where(eq(studentLessons.lessonId, id));

      const affectedStudentIds = [...new Set(assignments.map(a => a.studentId))];

      return {
        assignmentCount: assignments.length,
        affectedStudentIds,
        lessonTitle: lesson.title
      };
    } catch (error) {
      console.error('Error getting lesson deletion info:', error);
      throw error;
    }
  }

  async deleteLessonWithStrategy(id: number, strategy: 'delete_all' | 'keep_vocabulary'): Promise<boolean> {
    try {
      // Get lesson info first
      const { lessonTitle, assignmentCount } = await this.getLessonDeletionInfo(id);

      // If no assignments, just do a simple delete (shouldn't happen from UI, but safety check)
      if (assignmentCount === 0) {
        console.log(`Lesson ${id} has no assignments, performing simple delete`);
        return await this.deleteLesson(id);
      }

      // Use transaction to ensure all operations succeed or fail together
      await db.transaction(async (tx) => {
        if (strategy === 'delete_all') {
          // Strategy A: Delete everything (assignments + vocabulary + lesson)
          console.log(`Deleting lesson ${id} with all associated data`);

          // Delete vocabulary
          await tx.delete(studentVocabulary)
            .where(eq(studentVocabulary.lessonId, id));

          // Delete assignments
          await tx.delete(studentLessons)
            .where(eq(studentLessons.lessonId, id));

          // Delete lesson
          await tx.delete(lessons)
            .where(eq(lessons.id, id));

        } else {
          // Strategy B: Keep vocabulary as standalone (delete lesson but preserve vocabulary)
          console.log(`Deleting lesson ${id} but keeping vocabulary as standalone`);

          // Only update vocabulary that came from this lesson (source='lesson')
          // Preserve originLessonTitle if already set (for words migrated from multiple deleted lessons)
          await tx.update(studentVocabulary)
            .set({
              lessonId: null,
              source: 'manual',
              originLessonTitle: sql`COALESCE(origin_lesson_title, ${lessonTitle})`
            })
            .where(
              and(
                eq(studentVocabulary.lessonId, id),
                eq(studentVocabulary.source, 'lesson')
              )
            );

          // Delete assignments
          await tx.delete(studentLessons)
            .where(eq(studentLessons.lessonId, id));

          // Delete lesson
          await tx.delete(lessons)
            .where(eq(lessons.id, id));
        }
      });

      console.log(`Successfully deleted lesson ${id} with strategy: ${strategy}`);
      return true;
    } catch (error) {
      console.error(`Error deleting lesson with strategy ${strategy}:`, error);
      throw error;
    }
  }

  // Admin methods
  async getUsersWithLessonStats(
    page: number = 1,
    pageSize: number = 10,
    search?: string,
    dateFilter?: string
  ): Promise<{ users: any[], total: number }> {
    try {
      console.log(`Getting users with lesson stats, page: ${page}, search: ${search || 'none'}, dateFilter: ${dateFilter || 'none'}`);

      const offset = (page - 1) * pageSize;

      // Map frontend filter values to date thresholds
      let startDate: Date | undefined;
      if (dateFilter && dateFilter !== 'all') {
        const now = new Date();
        if (dateFilter === '7days') {
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        } else if (dateFilter === '30days') {
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (dateFilter === '90days') {
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        }
      }

      // Build search condition
      const searchCondition = search && search.trim() !== ''
        ? or(
            ilike(users.username, `%${search.trim()}%`),
            ilike(users.email, `%${search.trim()}%`),
            ilike(users.fullName, `%${search.trim()}%`)
          )
        : undefined;

      // Count total matching users
      const countResult = await db
        .select({ count: count() })
        .from(users)
        .where(searchCondition);
      const total = Number(countResult[0]?.count || 0);

      // Fetch paginated users (single query)
      const usersList = await db
        .select({
          id: users.id,
          username: users.username,
          email: users.email,
          fullName: users.fullName,
          isAdmin: users.isAdmin,
          subscriptionTier: users.subscriptionTier,
          freeCreditsRemaining: users.freeCreditsRemaining,
          trialExpiresAt: users.trialExpiresAt,
          lastLoginAt: users.lastLoginAt,
        })
        .from(users)
        .where(searchCondition)
        .orderBy(desc(users.id))
        .limit(pageSize)
        .offset(offset);

      if (usersList.length === 0) return { users: [], total };

      const userIds = usersList.map(u => u.id);

      // Single query to get lesson counts and most-recent date per user
      const lessonWhereConditions: any[] = [inArray(lessons.teacherId, userIds)];
      if (startDate) lessonWhereConditions.push(gte(lessons.createdAt, startDate));

      const lessonStats = await db
        .select({
          teacherId: lessons.teacherId,
          lessonCount: sql<number>`cast(count(${lessons.id}) as integer)`,
          mostRecentLessonDate: sql<string>`max(${lessons.createdAt})`,
        })
        .from(lessons)
        .where(and(...lessonWhereConditions))
        .groupBy(lessons.teacherId);

      const statsMap = new Map(lessonStats.map(s => [s.teacherId, s]));

      const usersWithStats = usersList.map(user => {
        const stats = statsMap.get(user.id);
        return {
          ...user,
          lessonCount: stats ? Number(stats.lessonCount) : 0,
          mostRecentLessonDate: stats?.mostRecentLessonDate || null,
        };
      });

      return { users: usersWithStats, total };
    } catch (error) {
      console.error('Error fetching users with lesson stats:', error);
      return { users: [], total: 0 };
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
        category: row.category as string,
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
        level: row.level as string,
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

      // Daily lesson counts for the past 30 days (real data)
      const dailyLessonsResult = await db
        .select({
          date: sql<string>`date_trunc('day', ${lessons.createdAt})::date::text`,
          lessons: sql<number>`count(*)`,
        })
        .from(lessons)
        .where(gte(lessons.createdAt, thirtyDaysAgo))
        .groupBy(sql`date_trunc('day', ${lessons.createdAt})`)
        .orderBy(sql`date_trunc('day', ${lessons.createdAt})`);

      const userGrowthData = dailyLessonsResult.map(row => ({
        date: row.date,
        users: 0, // reserved for future signup tracking
        lessons: Number(row.lessons),
      }));

      // Subscription breakdown
      const paidUsersResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(sql`${users.subscriptionTier} = 'unlimited'`);
      const paidUsers = Number(paidUsersResult[0]?.count || 0);

      return {
        totalUsers,
        activeUsersLast30Days,
        activeUsersLast7Days,
        totalLessons,
        lessonsLast30Days,
        lessonsLast7Days,
        paidUsers,
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
        .innerJoin(users, eq(lessons.teacherId, users.id))
        .$dynamic();

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
          contentHead: sql<string | null>`substring(${lessons.content}, 1, ${LESSON_SUMMARY_SOURCE_CHARS})`.as('contentHead')
        })
        .from(lessons)
        .innerJoin(users, eq(lessons.teacherId, users.id))
        .$dynamic();

      // Collect every filter and apply them together: calling .where() more than
      // once on a query replaces the previous condition instead of adding to it.
      const conditions = [];

      if (search && search !== '') {
        const searchCondition = or(
          ilike(lessons.title, `%${search}%`),
          ilike(lessons.topic, `%${search}%`),
          ilike(users.username, `%${search}%`)
        );
        if (searchCondition) conditions.push(searchCondition);
      }

      if (category && category !== 'all') {
        conditions.push(eq(lessons.category, category));
      }

      if (cefrLevel && cefrLevel !== 'all') {
        conditions.push(eq(lessons.cefrLevel, cefrLevel));
      }

      if (conditions.length > 0) {
        countQuery = countQuery.where(and(...conditions));
        lessonsQuery = lessonsQuery.where(and(...conditions));
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
        lessons: withContentPreview(lessonsResult) as unknown as Lesson[],
        total
      };
    } catch (error) {
      console.error('Error fetching admin lessons:', error);
      throw error;
    }
  }

  // Lightweight list of every public lesson (no content), for the crawlable
  // browse pages and the sitemap. Optionally limited to one CEFR level.
  async getPublicLessonSummaries(cefrLevel?: string) {
    const conditions = [eq(lessons.isPublic, true)];
    if (cefrLevel) conditions.push(eq(lessons.cefrLevel, cefrLevel));

    return db
      .select({
        id: lessons.id,
        title: lessons.title,
        cefrLevel: lessons.cefrLevel,
        publicCategory: lessons.publicCategory,
        createdAt: lessons.createdAt,
      })
      .from(lessons)
      .where(and(...conditions))
      .orderBy(desc(lessons.createdAt))
      .limit(1000);
  }

  async getPublicLessons(page = 1, pageSize = 20, search = '', cefrLevel = 'all', category = 'all') {
    try {
      const offset = (page - 1) * pageSize;

      // Build base query for counting
      let countQuery = db
        .select({ count: sql`count(*)` })
        .from(lessons)
        .innerJoin(users, eq(lessons.teacherId, users.id))
        .where(eq(lessons.isPublic, true))
        .$dynamic();

      // Build base query for lessons
      let lessonsQuery = db
        .select({
          id: lessons.id,
          title: lessons.title,
          cefrLevel: lessons.cefrLevel,
          category: lessons.category,
          publicCategory: lessons.publicCategory,
          createdAt: lessons.createdAt,
          contentHead: sql<string | null>`substring(${lessons.content}, 1, ${LESSON_SUMMARY_SOURCE_CHARS})`.as('contentHead')
        })
        .from(lessons)
        .innerJoin(users, eq(lessons.teacherId, users.id))
        .where(eq(lessons.isPublic, true))
        .$dynamic();

      // Collect every filter and apply them together: calling .where() more than
      // once on a query replaces the previous condition instead of adding to it.
      const conditions = [eq(lessons.isPublic, true)];

      if (search && search !== '') {
        // Title only: the topic holds the teacher's private request, and
        // matching on it would let a search probe what it says.
        conditions.push(ilike(lessons.title, `%${search}%`));
      }

      // Category filter (using publicCategory field)
      if (category && category !== 'all') {
        conditions.push(eq(lessons.publicCategory, category));
      }

      // CEFR level filter
      if (cefrLevel && cefrLevel !== 'all') {
        conditions.push(eq(lessons.cefrLevel, cefrLevel));
      }

      countQuery = countQuery.where(and(...conditions));
      lessonsQuery = lessonsQuery.where(and(...conditions));

      // Execute count query
      const [countResult] = await countQuery;
      const total = Number(countResult.count);

      // Execute lessons query
      const lessonsResult = await lessonsQuery
        .orderBy(desc(lessons.createdAt))
        .limit(pageSize)
        .offset(offset);

      return {
        lessons: withContentPreview(lessonsResult) as unknown as Lesson[],
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

  /**
   * Plans a lesson for a student. Its words join the student's list only when
   * the teacher marks it done (markStudentLessonDone).
   */
  async assignLessonToStudent(studentId: number, lessonId: number, teacherId: number, notes?: string): Promise<StudentLesson> {
    try {
      const [studentLesson] = await db.insert(studentLessons).values({
        studentId,
        lessonId,
        teacherId,
        notes: notes || null,
        status: LESSON_STATUS_PLANNED
      }).returning();

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
          completedAt: studentLessons.completedAt,
          madeByStudent: studentLessons.madeByStudent,
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
      const validLessons = result.filter(row => {
        return row && row.lesson && row.lesson.id !== null;
      });

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

  async getStudentLessonAssignment(assignmentId: number): Promise<StudentLesson | undefined> {
    try {
      const [assignment] = await db
        .select()
        .from(studentLessons)
        .where(eq(studentLessons.id, assignmentId))
        .limit(1);
      return assignment;
    } catch (error) {
      console.error('Error getting student lesson assignment:', error);
      throw error;
    }
  }

  /**
   * "We did this": the lesson's words join the student's list and the lesson
   * counts as done. The words are added first, so a failure leaves the lesson
   * planned and the teacher can simply try again.
   */
  async markStudentLessonDone(assignmentId: number): Promise<{ assignment: StudentLesson; wordsAdded: number }> {
    const existing = await this.getStudentLessonAssignment(assignmentId);
    if (!existing) throw new Error("Lesson assignment not found");
    if (isLessonDone(existing.status)) return { assignment: existing, wordsAdded: 0 };

    const wordsAdded = await this.extractAndSaveVocabulary(existing.studentId, existing.lessonId);
    const [assignment] = await db
      .update(studentLessons)
      .set({ status: LESSON_STATUS_DONE, completedAt: new Date() })
      .where(eq(studentLessons.id, assignmentId))
      .returning();
    console.log(`[Student lessons] Lesson ${existing.lessonId} done for student ${existing.studentId}: ${wordsAdded} words added`);
    return { assignment, wordsAdded };
  }

  /**
   * Undoes "We did this": the lesson is planned again and the words it added
   * leave the student's list, as when a lesson is unassigned.
   */
  async markStudentLessonPlanned(assignmentId: number): Promise<StudentLesson> {
    const existing = await this.getStudentLessonAssignment(assignmentId);
    if (!existing) throw new Error("Lesson assignment not found");
    if (!isLessonDone(existing.status)) return existing;

    await db.delete(studentVocabulary)
      .where(and(
        eq(studentVocabulary.studentId, existing.studentId),
        eq(studentVocabulary.lessonId, existing.lessonId)
      ));
    const [assignment] = await db
      .update(studentLessons)
      .set({ status: LESSON_STATUS_PLANNED, completedAt: null })
      .where(eq(studentLessons.id, assignmentId))
      .returning();
    return assignment;
  }

  /**
   * Words in the student's planned lessons. New lessons avoid them as well as
   * the words the student has learned, though they are not in the list yet.
   */
  async getPlannedLessonWords(studentId: number): Promise<string[]> {
    const planned = await db
      .select({ lessonId: studentLessons.lessonId })
      .from(studentLessons)
      .where(and(
        eq(studentLessons.studentId, studentId),
        or(isNull(studentLessons.status), ne(studentLessons.status, LESSON_STATUS_DONE))
      ));
    const words = new Set<string>();
    for (const { lessonId } of planned) {
      for (const detail of await lessonWordDetails(lessonId)) words.add(detail.term.trim());
    }
    return [...words];
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
        .orderBy(desc(studentVocabulary.learnedAt))
        .$dynamic();

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
      // The lessons.content column type decodes stored JSON into an object.
      const content = lesson.content;

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
                  cefrLevel: lesson.cefrLevel,
                  kind: 'word'
                });
              } else if (wordTerm) {
                console.log(`[extractAndSaveVocabulary] Skipping duplicate word: ${wordTerm}`);
              }
            }
          }
          // Lessons made with the idioms & phrasal verbs switch also teach
          // expressions; they are tracked like words, so later lessons for
          // this student don't teach them again.
          if (section.type === EXPRESSIONS_SECTION_TYPE) {
            for (const item of expressionItemsOf(section)) {
              const term = item.expression.toLowerCase();
              if (existingWords.has(term) || vocabularyToAdd.some((entry) => entry.word.toLowerCase() === term)) {
                console.log(`[extractAndSaveVocabulary] Skipping duplicate expression: ${term}`);
                continue;
              }
              vocabularyToAdd.push({
                studentId,
                lessonId,
                word: item.expression,
                definition: item.meaning,
                cefrLevel: lesson.cefrLevel,
                kind: item.kind
              });
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

  // The student's own page

  /** The student whose page has this code, while the teacher has the page switched on. */
  async getStudentByPageToken(token: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(and(eq(students.pageToken, token), eq(students.pageEnabled, true)))
      .limit(1);
    return student;
  }

  /** Who owns a lesson and whether it is public, without loading its content. */
  async getLessonAccess(lessonId: number): Promise<{ teacherId: number; isPublic: boolean } | undefined> {
    const [lesson] = await db
      .select({ teacherId: lessons.teacherId, isPublic: lessons.isPublic })
      .from(lessons)
      .where(eq(lessons.id, lessonId))
      .limit(1);
    return lesson;
  }

  /** Saves one flashcard answer: the word's next practice date, and a row for the teacher's practice summary. */
  async recordStudentPractice(studentId: number, vocabularyId: number, result: PracticeResult): Promise<StudentVocabulary | undefined> {
    const [word] = await db
      .select()
      .from(studentVocabulary)
      .where(and(eq(studentVocabulary.id, vocabularyId), eq(studentVocabulary.studentId, studentId)))
      .limit(1);
    if (!word) return undefined;

    const now = new Date();
    const [updated] = await db
      .update(studentVocabulary)
      .set({ ...nextPractice(word.practiceLevel, result, now), lastPractisedAt: now })
      .where(eq(studentVocabulary.id, vocabularyId))
      .returning();
    await db.insert(studentPracticeLog).values({ studentId, vocabularyId, result, practisedAt: now });
    return updated;
  }

  /** How the student has practised in the last 7 days, and the words they are still learning. */
  async getStudentPracticeStats(studentId: number): Promise<StudentPracticeStats> {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const [summary] = await db
      .select({
        lastPractisedAt: sql<Date | null>`max(${studentPracticeLog.practisedAt})`,
        cardsThisWeek: sql<number>`count(*) filter (where ${studentPracticeLog.practisedAt} >= ${weekAgo})`,
        daysPractisedThisWeek: sql<number>`count(distinct date(${studentPracticeLog.practisedAt})) filter (where ${studentPracticeLog.practisedAt} >= ${weekAgo})`,
      })
      .from(studentPracticeLog)
      .where(eq(studentPracticeLog.studentId, studentId));
    const stillLearning = await db
      .select({ word: studentVocabulary.word })
      .from(studentVocabulary)
      .where(and(
        eq(studentVocabulary.studentId, studentId),
        eq(studentVocabulary.practiceLevel, 0),
        sql`${studentVocabulary.lastPractisedAt} IS NOT NULL`
      ))
      .orderBy(desc(studentVocabulary.lastPractisedAt))
      .limit(8);
    return {
      lastPractisedAt: summary?.lastPractisedAt ? new Date(summary.lastPractisedAt).toISOString() : null,
      cardsThisWeek: Number(summary?.cardsThisWeek ?? 0),
      daysPractisedThisWeek: Number(summary?.daysPractisedThisWeek ?? 0),
      stillLearning: stillLearning.map((row) => row.word),
    };
  }

  // Ideas and lessons students make on their page (shared/student-page.ts)

  /** Ideas the student sent that the teacher hasn't made or dismissed, newest first. */
  async getWaitingIdeas(studentId: number): Promise<StudentIdea[]> {
    return db
      .select()
      .from(studentIdeas)
      .where(and(eq(studentIdeas.studentId, studentId), eq(studentIdeas.status, IDEA_WAITING)))
      .orderBy(desc(studentIdeas.createdAt), desc(studentIdeas.id));
  }

  /** Saves a student's idea for their teacher, or returns null when MAX_WAITING_IDEAS are already waiting. */
  async addStudentIdea(student: Pick<Student, "id" | "teacherId">, topic: string): Promise<StudentIdea | null> {
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${STUDENT_REQUEST_LOCK_NAMESPACE}, ${student.id})`);
      const [{ waiting }] = await tx
        .select({ waiting: count() })
        .from(studentIdeas)
        .where(and(eq(studentIdeas.studentId, student.id), eq(studentIdeas.status, IDEA_WAITING)));
      if (Number(waiting) >= MAX_WAITING_IDEAS) return null;
      const [idea] = await tx
        .insert(studentIdeas)
        .values({ studentId: student.id, teacherId: student.teacherId, topic })
        .returning();
      return idea;
    });
  }

  /** The student takes back an idea the teacher hasn't acted on yet. */
  async removeStudentIdea(studentId: number, ideaId: number): Promise<boolean> {
    const removed = await db
      .delete(studentIdeas)
      .where(and(eq(studentIdeas.id, ideaId), eq(studentIdeas.studentId, studentId), eq(studentIdeas.status, IDEA_WAITING)))
      .returning({ id: studentIdeas.id });
    return removed.length > 0;
  }

  /** The teacher dismisses a waiting idea, or brings a dismissed one back. */
  async setStudentIdeaDismissed(teacherId: number, studentId: number, ideaId: number, dismissed: boolean): Promise<StudentIdea | undefined> {
    const [idea] = await db
      .update(studentIdeas)
      .set(dismissed ? { status: IDEA_DISMISSED, resolvedAt: new Date() } : { status: IDEA_WAITING, resolvedAt: null })
      .where(and(
        eq(studentIdeas.id, ideaId),
        eq(studentIdeas.studentId, studentId),
        eq(studentIdeas.teacherId, teacherId),
        eq(studentIdeas.status, dismissed ? IDEA_WAITING : IDEA_DISMISSED),
      ))
      .returning();
    return idea;
  }

  /** Records the lesson the teacher made from a student's idea. */
  async markStudentIdeaMade(ideaId: number, studentId: number, teacherId: number, lessonId: number): Promise<boolean> {
    const updated = await db
      .update(studentIdeas)
      .set({ status: IDEA_MADE, lessonId, resolvedAt: new Date() })
      .where(and(
        eq(studentIdeas.id, ideaId),
        eq(studentIdeas.studentId, studentId),
        eq(studentIdeas.teacherId, teacherId),
        inArray(studentIdeas.status, [IDEA_WAITING, IDEA_DISMISSED]),
      ))
      .returning({ id: studentIdeas.id });
    return updated.length > 0;
  }

  /** Lessons the teacher made from the student's ideas. */
  async getIdeaLessonIds(studentId: number): Promise<number[]> {
    const rows = await db
      .select({ lessonId: studentIdeas.lessonId })
      .from(studentIdeas)
      .where(and(eq(studentIdeas.studentId, studentId), eq(studentIdeas.status, IDEA_MADE)));
    return rows.map((row) => row.lessonId).filter((id): id is number => id !== null);
  }

  /** Stars the planned lesson the student wants to do next. False when it isn't one of their planned lessons. */
  async setStudentNextLesson(studentId: number, lessonId: number): Promise<boolean> {
    const updated = await db
      .update(students)
      .set({ nextLessonId: lessonId })
      .where(and(
        eq(students.id, studentId),
        sql`EXISTS (SELECT 1 FROM ${studentLessons} WHERE ${studentLessons.studentId} = ${studentId}
          AND ${studentLessons.lessonId} = ${lessonId} AND ${studentLessons.status} = ${LESSON_STATUS_PLANNED})`,
      ))
      .returning({ id: students.id });
    return updated.length > 0;
  }

  /**
   * The student removes a lesson they made that isn't done yet. It was their
   * draft, so it leaves the teacher's library too, unless the teacher has
   * since given it to another student or shared it. Null when there was no
   * such lesson to remove.
   */
  async removeStudentMadeLesson(student: Pick<Student, "id" | "teacherId">, lessonId: number): Promise<{ lessonDeleted: boolean } | null> {
    return db.transaction(async (tx) => {
      const removed = await tx
        .delete(studentLessons)
        .where(and(
          eq(studentLessons.studentId, student.id),
          eq(studentLessons.lessonId, lessonId),
          eq(studentLessons.madeByStudent, true),
          eq(studentLessons.status, LESSON_STATUS_PLANNED),
        ))
        .returning({ id: studentLessons.id });
      if (removed.length === 0) return null;
      await tx
        .update(students)
        .set({ nextLessonId: null })
        .where(and(eq(students.id, student.id), eq(students.nextLessonId, lessonId)));
      const deleted = await tx
        .delete(lessons)
        .where(and(
          eq(lessons.id, lessonId),
          eq(lessons.teacherId, student.teacherId),
          eq(lessons.isPublic, false),
          eq(lessons.isShared, false),
          sql`NOT EXISTS (SELECT 1 FROM ${studentLessons} WHERE ${studentLessons.lessonId} = ${lessonId})`,
        ))
        .returning({ id: lessons.id });
      return { lessonDeleted: deleted.length > 0 };
    });
  }

  /**
   * Starts a lesson the student is making, if they may: one at a time, at
   * most MAX_WAITING_STUDENT_LESSONS they made waiting, and at most
   * STUDENT_LESSONS_PER_DAY in 24 hours. Taken one at a time per student, so
   * a double tap (even on two servers) never starts two.
   */
  async reserveStudentLessonJob(jobId: string, student: Pick<Student, "id" | "teacherId">, topic: string): Promise<StudentLessonReservation> {
    return db.transaction(async (tx) => {
      await tx.execute(sql`SELECT pg_advisory_xact_lock(${STUDENT_REQUEST_LOCK_NAMESPACE}, ${student.id})`);
      const [making] = await tx
        .select({ id: studentLessonJobs.id })
        .from(studentLessonJobs)
        .where(and(
          eq(studentLessonJobs.studentId, student.id),
          eq(studentLessonJobs.status, "pending"),
          sql`${studentLessonJobs.createdAt} >= now() - make_interval(secs => ${ABANDONED_JOB_AGE_MS / 1000})`,
        ))
        .orderBy(desc(studentLessonJobs.createdAt))
        .limit(1);
      if (making) return { status: "making", jobId: making.id };

      const [{ waiting }] = await tx
        .select({ waiting: count() })
        .from(studentLessons)
        .where(and(
          eq(studentLessons.studentId, student.id),
          eq(studentLessons.madeByStudent, true),
          eq(studentLessons.status, LESSON_STATUS_PLANNED),
        ));
      if (Number(waiting) >= MAX_WAITING_STUDENT_LESSONS) return { status: "full" };

      const [{ started }] = await tx
        .select({ started: count() })
        .from(studentLessonJobs)
        .where(and(
          eq(studentLessonJobs.studentId, student.id),
          ne(studentLessonJobs.status, "error"),
          sql`${studentLessonJobs.createdAt} > now() - interval '24 hours'`,
        ));
      if (Number(started) >= STUDENT_LESSONS_PER_DAY) return { status: "daily_limit" };

      await tx.insert(studentLessonJobs).values({
        id: jobId,
        studentId: student.id,
        teacherId: student.teacherId,
        topic,
        status: "pending",
      });
      return { status: "reserved" };
    });
  }

  /**
   * Saves the lesson a student made, in one transaction: into the teacher's
   * library, planned for the student and marked as theirs, starred as the
   * lesson they want next, and the job settled.
   */
  async completeStudentLessonJob(jobId: string, student: Pick<Student, "id" | "teacherId">, lessonData: InsertLesson): Promise<Lesson> {
    return db.transaction(async (tx) => {
      const [lesson] = await tx.insert(lessons).values(lessonData).returning();
      await tx.insert(studentLessons).values({
        studentId: student.id,
        lessonId: lesson.id,
        teacherId: student.teacherId,
        status: LESSON_STATUS_PLANNED,
        madeByStudent: true,
      });
      await tx.update(students).set({ nextLessonId: lesson.id }).where(eq(students.id, student.id));
      await tx
        .update(studentLessonJobs)
        .set({ status: "complete", lessonId: lesson.id })
        .where(eq(studentLessonJobs.id, jobId));
      return lesson;
    });
  }

  async failStudentLessonJob(jobId: string, message: string): Promise<void> {
    await db
      .update(studentLessonJobs)
      .set({ status: "error", error: (message || "Lesson generation failed").slice(0, 2000) })
      .where(and(eq(studentLessonJobs.id, jobId), ne(studentLessonJobs.status, "complete")));
  }

  async getStudentLessonJob(jobId: string, studentId: number): Promise<StudentLessonJobRow | undefined> {
    const [job] = await db
      .select({
        id: studentLessonJobs.id,
        topic: studentLessonJobs.topic,
        status: studentLessonJobs.status,
        lessonId: studentLessonJobs.lessonId,
        error: studentLessonJobs.error,
        abandoned: sql<boolean>`${studentLessonJobs.createdAt} < now() - make_interval(secs => ${ABANDONED_JOB_AGE_MS / 1000})`,
      })
      .from(studentLessonJobs)
      .where(and(eq(studentLessonJobs.id, jobId), eq(studentLessonJobs.studentId, studentId)))
      .limit(1);
    return job as StudentLessonJobRow | undefined;
  }

  /** The lesson the student is making right now, if any. */
  async getStudentMakingJob(studentId: number): Promise<{ id: string; topic: string } | undefined> {
    const [job] = await db
      .select({ id: studentLessonJobs.id, topic: studentLessonJobs.topic })
      .from(studentLessonJobs)
      .where(and(
        eq(studentLessonJobs.studentId, studentId),
        eq(studentLessonJobs.status, "pending"),
        sql`${studentLessonJobs.createdAt} >= now() - make_interval(secs => ${ABANDONED_JOB_AGE_MS / 1000})`,
      ))
      .orderBy(desc(studentLessonJobs.createdAt))
      .limit(1);
    return job;
  }

  /** Lessons the student started making in the last 24 hours (failed ones don't count). */
  async countStudentLessonsToday(studentId: number): Promise<number> {
    const [{ started }] = await db
      .select({ started: count() })
      .from(studentLessonJobs)
      .where(and(
        eq(studentLessonJobs.studentId, studentId),
        ne(studentLessonJobs.status, "error"),
        sql`${studentLessonJobs.createdAt} > now() - interval '24 hours'`,
      ));
    return Number(started);
  }

  /** Job rows only matter for a day (the daily limit); the lessons live in the lessons table. */
  async pruneStudentLessonJobs(): Promise<void> {
    await db.delete(studentLessonJobs).where(sql`${studentLessonJobs.createdAt} < now() - interval '2 days'`);
  }

  /** Per student: ideas waiting and lessons they made that aren't done, for the teacher's Students page. */
  async getStudentRequestCounts(teacherId: number): Promise<StudentRequestCounts> {
    const [ideas, made] = await Promise.all([
      db
        .select({ studentId: studentIdeas.studentId, n: count() })
        .from(studentIdeas)
        .where(and(eq(studentIdeas.teacherId, teacherId), eq(studentIdeas.status, IDEA_WAITING)))
        .groupBy(studentIdeas.studentId),
      db
        .select({ studentId: studentLessons.studentId, n: count() })
        .from(studentLessons)
        .where(and(
          eq(studentLessons.teacherId, teacherId),
          eq(studentLessons.madeByStudent, true),
          eq(studentLessons.status, LESSON_STATUS_PLANNED),
        ))
        .groupBy(studentLessons.studentId),
    ]);
    const counts: StudentRequestCounts = {};
    for (const row of ideas) counts[row.studentId] = { ideas: Number(row.n), madeLessons: 0 };
    for (const row of made) counts[row.studentId] = { ideas: counts[row.studentId]?.ideas ?? 0, madeLessons: Number(row.n) };
    return counts;
  }

  /** The teacher's lessons that a student made, for the library. */
  async getStudentMadeLessons(teacherId: number): Promise<Array<{ lessonId: number; studentId: number }>> {
    return db
      .select({ lessonId: studentLessons.lessonId, studentId: studentLessons.studentId })
      .from(studentLessons)
      .where(and(eq(studentLessons.teacherId, teacherId), eq(studentLessons.madeByStudent, true)));
  }

  // Blog post methods
  async getAllBlogPosts(page: number = 1, pageSize: number = 10, category?: string, featured?: boolean, isPublished?: boolean): Promise<{ posts: BlogPost[], total: number }> {
    try {
      const offset = (page - 1) * pageSize;

      let whereConditions = [];
      if (category) {
        whereConditions.push(eq(blogPosts.category, category));
      }
      if (featured !== undefined) {
        whereConditions.push(eq(blogPosts.featured, featured));
      }
      if (isPublished !== undefined) {
        whereConditions.push(eq(blogPosts.isPublished, isPublished));
      }

      const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

      // Build query conditionally based on where clause
      let query = db.select().from(blogPosts).$dynamic();
      if (whereClause) {
        query = query.where(whereClause);
      }
      // Build count query conditionally
      let countQuery = db.select({ count: count() }).from(blogPosts).$dynamic();
      if (whereClause) {
        countQuery = countQuery.where(whereClause);
      }

      // Run both queries at once instead of one after the other.
      const [posts, [{ count: totalCount }]] = await Promise.all([
        query
          .orderBy(desc(blogPosts.createdAt))
          .limit(pageSize)
          .offset(offset),
        countQuery,
      ]);

      return { posts, total: Number(totalCount) };
    } catch (error) {
      console.error('Error fetching blog posts:', error);
      throw error;
    }
  }

  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    try {
      const [post] = await db.select().from(blogPosts).where(eq(blogPosts.id, id));
      return post;
    } catch (error) {
      console.error('Error fetching blog post:', error);
      throw error;
    }
  }

  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    try {
      const [post] = await db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
      return post;
    } catch (error) {
      console.error('Error fetching blog post by slug:', error);
      throw error;
    }
  }

  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    try {
      const [newPost] = await db.insert(blogPosts).values(post).returning();
      return newPost;
    } catch (error) {
      console.error('Error creating blog post:', error);
      throw error;
    }
  }

  async updateBlogPost(id: number, postUpdate: UpdateBlogPost): Promise<BlogPost> {
    try {
      // UpdateBlogPost type already has all allowed fields as optional
      // Filter out undefined values and ensure we only update provided fields
      const updateData: any = {};

      if (postUpdate.title !== undefined) updateData.title = postUpdate.title;
      if (postUpdate.slug !== undefined) updateData.slug = postUpdate.slug;
      if (postUpdate.content !== undefined) updateData.content = postUpdate.content;
      if (postUpdate.excerpt !== undefined) updateData.excerpt = postUpdate.excerpt;
      if (postUpdate.author !== undefined) updateData.author = postUpdate.author;
      if (postUpdate.publishDate !== undefined) updateData.publishDate = postUpdate.publishDate;
      if (postUpdate.category !== undefined) updateData.category = postUpdate.category;
      if (postUpdate.tags !== undefined) updateData.tags = postUpdate.tags;
      if (postUpdate.readTime !== undefined) updateData.readTime = postUpdate.readTime;
      if (postUpdate.featured !== undefined) updateData.featured = postUpdate.featured;
      if (postUpdate.featuredImageUrl !== undefined) updateData.featuredImageUrl = postUpdate.featuredImageUrl;
      if (postUpdate.featuredImageAlt !== undefined) updateData.featuredImageAlt = postUpdate.featuredImageAlt;
      if (postUpdate.metaTitle !== undefined) updateData.metaTitle = postUpdate.metaTitle;
      if (postUpdate.metaDescription !== undefined) updateData.metaDescription = postUpdate.metaDescription;
      if (postUpdate.publishedAt !== undefined) updateData.publishedAt = postUpdate.publishedAt;
      if (postUpdate.isPublished !== undefined) updateData.isPublished = postUpdate.isPublished;

      // Always update the updatedAt timestamp
      updateData.updatedAt = new Date();

      const [updatedPost] = await db
        .update(blogPosts)
        .set(updateData)
        .where(eq(blogPosts.id, id))
        .returning();
      return updatedPost;
    } catch (error) {
      console.error('Error updating blog post:', error);
      throw error;
    }
  }

  async deleteBlogPost(id: number): Promise<boolean> {
    try {
      await db.delete(blogPosts).where(eq(blogPosts.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting blog post:', error);
      throw error;
    }
  }
}

export const storage = new DatabaseStorage();
