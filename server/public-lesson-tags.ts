import { createHash } from "crypto";
import { type PublicLessonTag } from "@shared/public-lesson-tags";

export interface PublicTagSource {
  id: number;
  title: string;
  cefrLevel: string;
  publicReading: string;
}

// Deliberately conservative: a title match, or two distinct reading keywords.
// Ambiguous lessons get no suggestion and must be tagged manually in review.
const RULES: Record<PublicLessonTag, string[]> = {
  travel: ["travel", "tourism", "tourist", "holiday", "vacation", "hotel", "airport", "passport"],
  technology: ["technology", "software", "computer", "internet", "smartphone", "cybersecurity"],
  "artificial-intelligence": ["artificial intelligence", "chatgpt", "machine learning", "generative ai"],
  environment: ["environment", "climate change", "recycling", "pollution", "sustainability", "renewable energy"],
  work: ["career", "workplace", "job interview", "recruitment", "employee", "salary", "office"],
  money: ["money", "budget", "finance", "investment", "banking", "savings", "inflation"],
  health: ["health", "medical", "doctor", "hospital", "wellbeing", "nutrition", "sleep"],
  food: ["food", "cooking", "recipe", "restaurant", "cuisine", "ingredients", "chef"],
  relationships: ["friendship", "relationships", "family", "marriage", "dating", "parents"],
  culture: ["culture", "traditions", "festival", "customs", "heritage"],
  education: ["education", "school", "university", "classroom", "homework", "exam"],
  sport: ["sport", "football", "basketball", "fitness", "athlete", "gym", "olympics"],
  science: ["science", "scientist", "experiment", "biology", "physics", "astronomy"],
  entertainment: ["cinema", "movie", "music", "concert", "television", "video games"],
  shopping: ["shopping", "retail", "supermarket", "customer", "discount", "refund"],
  transport: ["transport", "traffic", "commute", "railway", "cycling", "public transit"],
};

function matches(text: string, terms: string[]) {
  return terms.filter((term) => new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i").test(text));
}

export function suggestPublicTags(source: Pick<PublicTagSource, "title" | "publicReading">) {
  const evidence: Array<{ tag: PublicLessonTag; source: "title" | "reading"; terms: string[] }> = [];
  for (const [tag, terms] of Object.entries(RULES) as [PublicLessonTag, string[]][]) {
    const titleTerms = matches(source.title, terms);
    const readingTerms = matches(source.publicReading, terms);
    if (titleTerms.length || readingTerms.length >= 2) {
      evidence.push({ tag, source: titleTerms.length ? "title" : "reading", terms: titleTerms.length ? titleTerms : readingTerms });
    }
  }
  evidence.sort((a, b) => Number(b.source === "title") - Number(a.source === "title") || b.terms.length - a.terms.length);
  return { suggestedTags: evidence.slice(0, 4).map((e) => e.tag), evidence: evidence.slice(0, 4) };
}

export function publicTagFingerprint(source: PublicTagSource): string {
  return createHash("sha256").update(JSON.stringify([source.id, source.title, source.cefrLevel, source.publicReading])).digest("hex");
}

export class TagReviewConflict extends Error {}
