import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull(),
  fullName: text("full_name"),
  credits: integer("credits").notNull().default(5),
  isAdmin: boolean("is_admin").notNull().default(false),
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  subscriptionTier: text("subscription_tier").default("free"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordExpires: timestamp("reset_password_expires")
});

// Student table schema
export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  name: text("name").notNull(),
  cefrLevel: text("cefr_level").notNull(),
  email: text("email"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Lesson table schema
export const lessons = pgTable("lessons", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull(),
  studentId: integer("student_id"),
  title: text("title").notNull(),
  topic: text("topic").notNull(),
  cefrLevel: text("cefr_level").notNull(),
  content: text("content").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  fullName: true,
}).extend({
  fullName: z.string().optional(),
});

export const insertStudentSchema = createInsertSchema(students).pick({
  teacherId: true,
  name: true,
  cefrLevel: true,
  email: true,
  notes: true,
});

export const insertLessonSchema = createInsertSchema(lessons).pick({
  teacherId: true,
  studentId: true,
  title: true,
  topic: true,
  cefrLevel: true,
  content: true,
  notes: true,
});

// Types for inserts
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertLesson = z.infer<typeof insertLessonSchema>;

// Types for selects
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;

// AI provider enum
export const AIProviderEnum = z.enum(['qwen', 'gemini']);
export type AIProvider = z.infer<typeof AIProviderEnum>;

// Lesson generation types
export const lessonGenerateSchema = z.object({
  cefrLevel: z.string(),
  topic: z.string(),
  focus: z.string().default("general"), // Area of focus (speaking, grammar, vocabulary, etc.)
  lessonLength: z.number().int().min(15).max(120).default(60), // Lesson duration in minutes
  studentId: z.number().optional(),
  textInput: z.string().optional(),
  additionalNotes: z.string().optional(), // Additional instructions for the AI
  targetVocabulary: z.string().optional(), // Custom vocabulary words to include in the lesson
  components: z.array(z.string()),
  generateImages: z.boolean().default(true),
  useStudentHistory: z.boolean().default(true),
  aiProvider: AIProviderEnum.default('qwen'), // Default to Qwen AI
});

export type LessonGenerateParams = z.infer<typeof lessonGenerateSchema>;

// Credit purchase schema
export const creditPurchaseSchema = z.object({
  amount: z.number().positive(),
  quantity: z.number().int().positive(),
});

export type CreditPurchase = z.infer<typeof creditPurchaseSchema>;

// Subscription tiers enum
export const SubscriptionTierEnum = z.enum(['free', 'basic', 'premium', 'annual']);
export type SubscriptionTier = z.infer<typeof SubscriptionTierEnum>;

// Subscription schema for creating subscriptions
export const subscriptionSchema = z.object({
  planId: z.string(),
  customerId: z.string().optional(),
  priceId: z.string(),
  quantity: z.number().int().positive().default(1),
});

export type SubscriptionCreate = z.infer<typeof subscriptionSchema>;
