import { db } from "../server/db";
import { users, lessons } from "../shared/schema";
import { eq, sql } from "drizzle-orm";
const rows = await db.select({ name: users.fullName, email: users.email, tier: users.subscriptionTier, made: sql<number>`count(${lessons.id})::int`, lastLesson: sql<string>`max(${lessons.createdAt})::date::text`, lastLogin: sql<string>`${users.lastLoginAt}::date::text` }).from(users).leftJoin(lessons, eq(lessons.teacherId, users.id)).where(eq(users.isAdmin, false)).groupBy(users.id).having(sql`count(${lessons.id}) >= 5`).orderBy(sql`count(${lessons.id}) desc`);
console.log(JSON.stringify(rows));
process.exit(0);
