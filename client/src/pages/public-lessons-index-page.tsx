import { Link, useRoute } from "wouter";
import { libraryDesign, lessonDesign } from "@shared/lesson-pedagogy";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { SEOHead } from "@/components/SEOHead";
import { BlogHeader } from "@/components/layout/blog-header";
import { PUBLIC_LIBRARY_LABELS } from "@shared/schema";

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"] as const;

const LEVEL_NAMES: Record<string, string> = {
  A1: "Beginner",
  A2: "Elementary",
  B1: "Intermediate",
  B2: "Upper Intermediate",
  C1: "Advanced",
  C2: "Proficiency",
};

interface LessonSummary {
  id: number;
  title: string;
  cefrLevel: string;
  publicCategory: string | null;
}

// Public (no login) browse pages: /esl-lessons and /esl-lessons/:level.
// Search engines get server-rendered HTML for these URLs; this component takes
// over once the app loads.
export default function PublicLessonsIndexPage() {
  const [, params] = useRoute("/esl-lessons/:level");
  const requested = params?.level?.toUpperCase();
  const level = requested && (LEVELS as readonly string[]).includes(requested) ? requested : undefined;

  const { data, isLoading, isSuccess } = useQuery<{ lessons: LessonSummary[] }>({
    queryKey: ["public-lesson-index", level ?? "all"],
    queryFn: async () => {
      const res = await fetch(`/api/public-lesson-index${level ? `?level=${level}` : ""}`);
      if (!res.ok) throw new Error("Failed to load lessons");
      return res.json();
    },
  });

  const lessons = data?.lessons ?? [];
  const levelName = level ? LEVEL_NAMES[level] : "";

  const heading = level ? `${level} (${levelName}) ESL Lessons` : "Free ESL Lessons by CEFR Level";
  const intro = level
    ? `Ready-to-teach ${level} ${levelName.toLowerCase()} ESL conversation lessons. ${libraryDesign}`
    : `Browse ready-to-teach ESL conversation lessons for every CEFR level from A1 to C2. ${libraryDesign}`;

  const renderCard = (lesson: LessonSummary) => {
    const label = lesson.publicCategory
      ? PUBLIC_LIBRARY_LABELS[lesson.publicCategory as keyof typeof PUBLIC_LIBRARY_LABELS]
      : undefined;
    return (
      <Link key={lesson.id} href={`/lessons/${lesson.id}`}>
        <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer" data-testid={`card-lesson-${lesson.id}`}>
          <h3 className="text-lg font-semibold mb-2">{lesson.title}</h3>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <Badge variant="secondary">{lesson.cefrLevel}</Badge>
            {label && <Badge variant="outline">{label}</Badge>}
          </div>
        </Card>
      </Link>
    );
  };

  return (
    <>
      <SEOHead
        title={
          level
            ? `${level} (${levelName}) ESL Lessons - Free Lesson Plans | PlanWise ESL`
            : "Free ESL Lessons by CEFR Level (A1-C2) | PlanWise ESL"
        }
        description={level
          ? `Free ${level} (${levelName}) ESL conversation lessons with pre-taught vocabulary, a levelled reading, speaking support and discussion. Ready to teach.`
          : 'Free ESL conversation lessons for every CEFR level (A1–C2) with pre-taught vocabulary, a levelled reading, speaking support and discussion.'}
        canonicalUrl={level ? `/esl-lessons/${level.toLowerCase()}` : "/esl-lessons"}
        // Only when the data really came back empty. A failed or pending request
        // (e.g. a crawler that can't fetch the API) must not noindex the page.
        noindex={isSuccess && lessons.length === 0}
      />

      <BlogHeader />
      <main className="min-h-screen bg-background">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <h1 className="text-3xl md:text-4xl font-bold mb-4" data-testid="text-lessons-title">
            {heading}
          </h1>
          <p className="text-lg text-muted-foreground mb-6">
            {intro}{" "}
            <Link href={lessonDesign.href} className="font-medium text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2">
              {lessonDesign.linkLabel}
            </Link>
          </p>

          <nav aria-label="CEFR levels" className="flex flex-wrap gap-2 mb-10">
            <Link href="/esl-lessons">
              <Button variant={level ? "outline" : "default"} size="sm">All levels</Button>
            </Link>
            {LEVELS.map((lv) => (
              <Link key={lv} href={`/esl-lessons/${lv.toLowerCase()}`}>
                <Button variant={lv === level ? "default" : "outline"} size="sm">
                  {lv} {LEVEL_NAMES[lv]}
                </Button>
              </Link>
            ))}
          </nav>

          {isLoading ? (
            <p className="text-muted-foreground">Loading lessons…</p>
          ) : lessons.length === 0 ? (
            <p className="text-muted-foreground">No lessons found for this level yet.</p>
          ) : level ? (
            <div className="grid gap-4">{lessons.map(renderCard)}</div>
          ) : (
            LEVELS.map((lv) => {
              const inLevel = lessons.filter((l) => l.cefrLevel === lv);
              if (inLevel.length === 0) return null;
              return (
                <section key={lv} className="mb-10">
                  <h2 className="text-2xl font-semibold mb-4">
                    <Link href={`/esl-lessons/${lv.toLowerCase()}`}>
                      {lv} {LEVEL_NAMES[lv]}
                    </Link>
                  </h2>
                  <div className="grid gap-4">{inLevel.map(renderCard)}</div>
                </section>
              );
            })
          )}

          <div className="mt-12 rounded-xl bg-primary/5 p-6">
            <h2 className="text-xl font-semibold mb-2">Need a lesson on a different topic?</h2>
            <p className="mb-4 text-muted-foreground">
              PlanWise ESL generates a complete lesson on any topic at any CEFR level in minutes.
            </p>
            <Link href="/auth?register=true">
              <Button variant="brand">Sign Up Free</Button>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
