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

// Lesson generation types
export const lessonGenerateSchema = z.object({
  cefrLevel: z.string(),
  topic: z.string(),
  studentId: z.number().optional(),
  textInput: z.string().optional(),
  components: z.array(z.string()),
  generateImages: z.boolean().default(true),
  useStudentHistory: z.boolean().default(true),
});

export type LessonGenerateParams = z.infer<typeof lessonGenerateSchema>;

// Credit purchase schema
export const creditPurchaseSchema = z.object({
  amount: z.number().int().positive(),
  quantity: z.number().int().positive(),
});

export type CreditPurchase = z.infer<typeof creditPurchaseSchema>;
