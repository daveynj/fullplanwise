/**
 * One-off: tag each account in Mailchimp with a reactivation segment based on
 * how many lessons the teacher has made, so campaigns can be targeted.
 *   "Seg: never" 0 lessons   "Seg: tried" 1-4 lessons   "Seg: heavy" 5+ lessons
 * Paying (unlimited) accounts get all three tags removed; admins are skipped.
 * Only existing list members are touched; nobody is added to Mailchimp here.
 * Run: npx tsx scripts/mailchimp-segment-tags.ts [--dry-run]
 */
import { db } from "../server/db";
import { users, lessons } from "../shared/schema";
import { mailchimpService } from "../server/services/mailchimp.service";
import { eq, sql } from "drizzle-orm";

const dryRun = process.argv.includes("--dry-run");
const TAGS = ["Seg: never", "Seg: tried", "Seg: heavy"] as const;
type Seg = (typeof TAGS)[number];

function segmentFor(made: number): Seg {
  if (made === 0) return "Seg: never";
  if (made < 5) return "Seg: tried";
  return "Seg: heavy";
}

async function main() {
  const rows = await db
    .select({
      id: users.id,
      email: users.email,
      tier: users.subscriptionTier,
      isAdmin: users.isAdmin,
      made: sql<number>`count(${lessons.id})::int`,
    })
    .from(users)
    .leftJoin(lessons, eq(lessons.teacherId, users.id))
    .groupBy(users.id);

  const totals = { never: 0, tried: 0, heavy: 0, paying: 0, admin: 0, notOnList: 0, failed: 0 };
  if (!dryRun && !mailchimpService.isInitialized()) throw new Error("Mailchimp is not configured here");

  for (const r of rows) {
    if (r.isAdmin) { totals.admin++; continue; }
    if (!r.email) continue;
    const paying = r.tier === "unlimited";
    const seg: Seg | null = paying ? null : segmentFor(r.made);
    if (paying) totals.paying++;
    else if (seg === "Seg: never") totals.never++;
    else if (seg === "Seg: tried") totals.tried++;
    else totals.heavy++;
    if (dryRun) continue;
    for (const tag of TAGS) {
      const out = await mailchimpService.setMemberTag(r.email, tag, tag === seg);
      if (out.notOnList) { totals.notOnList++; break; }
      if (!out.success) { totals.failed++; console.error(`user ${r.id}: ${tag}: ${out.error ?? "unknown error"}`); }
    }
  }
  console.log(JSON.stringify({ dryRun, accounts: rows.length, ...totals }, null, 2));
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
