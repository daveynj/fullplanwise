import { useMemo, useState } from "react";
import { lessonPath } from "@shared/lesson-url";
import { Link, useRoute } from "wouter";
import { libraryDesign, lessonDesign } from "@shared/lesson-pedagogy";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";
import { BlogHeader } from "@/components/layout/blog-header";
import { PUBLIC_LIBRARY_LABELS } from "@shared/schema";
import { ArrowRight, BookOpen, CheckCircle2, FileDown, Search, Sparkles, X } from "lucide-react";

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
  publicSlug?: string | null;
  publicLevel?: string | null;
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

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

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

  const availableCategories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of lessons) {
      if (l.publicCategory && l.publicCategory in PUBLIC_LIBRARY_LABELS) {
        counts.set(l.publicCategory, (counts.get(l.publicCategory) ?? 0) + 1);
      }
    }
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return lessons.filter((l) => {
      if (selectedCategory !== "all" && l.publicCategory !== selectedCategory) return false;
      if (!q) return true;
      const catLabel = l.publicCategory
        ? PUBLIC_LIBRARY_LABELS[l.publicCategory as keyof typeof PUBLIC_LIBRARY_LABELS] ?? ""
        : "";
      return (
        l.title.toLowerCase().includes(q) ||
        l.cefrLevel.toLowerCase().includes(q) ||
        catLabel.toLowerCase().includes(q)
      );
    });
  }, [lessons, searchQuery, selectedCategory]);

  const heading = level ? `${level} (${levelName}) Free ESL Lessons` : "Free ESL Lesson Library (A1–C2)";
  const intro = level
    ? `Ready-to-teach ${level} ${levelName.toLowerCase()} ESL conversation lessons — open any lesson free with zero login. ${libraryDesign}`
    : `Open, teach, and share complete CEFR A1–C2 ESL conversation lessons with zero login required. ${libraryDesign}`;

  const renderCard = (lesson: LessonSummary) => {
    const label = lesson.publicCategory
      ? PUBLIC_LIBRARY_LABELS[lesson.publicCategory as keyof typeof PUBLIC_LIBRARY_LABELS]
      : undefined;
    return (
      <Link key={lesson.id} href={lessonPath(lesson)} className="block h-full">
        <Card
          className="h-full p-5 flex flex-col justify-between border-slate-200 hover:border-brand-yellow hover:shadow-md transition-all cursor-pointer group bg-white"
          data-testid={`card-lesson-${lesson.id}`}
        >
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-3">
              <Badge className="bg-brand-navy text-white hover:bg-brand-navy font-semibold">
                {lesson.cefrLevel}
              </Badge>
              {label && (
                <Badge variant="outline" className="border-amber-200 bg-amber-50/70 text-amber-900">
                  {label}
                </Badge>
              )}
            </div>
            <h3 className="text-lg font-semibold text-brand-navy group-hover:text-amber-700 transition-colors leading-snug mb-3">
              {lesson.title}
            </h3>
          </div>
          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-xs font-medium text-slate-500">
            <span>Full 8-stage lesson + Vocab PDF</span>
            <span className="inline-flex items-center gap-1 text-brand-navy font-semibold group-hover:translate-x-0.5 transition-transform">
              Open free <ArrowRight className="h-3.5 w-3.5" />
            </span>
          </div>
        </Card>
      </Link>
    );
  };

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedCategory !== "all";

  return (
    <>
      <SEOHead
        title={
          level
            ? `${level} (${levelName}) ESL Lessons - Free Lesson Plans | PlanWise ESL`
            : "Free ESL Lessons by CEFR Level (A1-C2) | PlanWise ESL"
        }
        description={
          level
            ? `Free ${level} (${levelName}) ESL conversation lessons with pre-taught vocabulary, a levelled reading, speaking support and discussion. Ready to teach.`
            : "Free ESL conversation lessons for every CEFR level (A1–C2) with pre-taught vocabulary, a levelled reading, speaking support and discussion."
        }
        canonicalUrl={level ? `/esl-lessons/${level.toLowerCase()}` : "/esl-lessons"}
        // Only when the data really came back empty. A failed or pending request
        // (e.g. a crawler that can't fetch the API) must not noindex the page.
        noindex={isSuccess && lessons.length === 0}
      />

      <BlogHeader />
      <main className="min-h-screen bg-slate-50/60">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-12">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3.5 py-1.5 text-xs font-semibold text-amber-900 mb-4">
            <span className="inline-flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5 text-amber-700" />
              100% Free &amp; Open
            </span>
            <span className="text-amber-300">•</span>
            <span className="inline-flex items-center gap-1">
              <BookOpen className="h-3.5 w-3.5 text-amber-700" />
              No Login Required
            </span>
            <span className="text-amber-300">•</span>
            <span className="inline-flex items-center gap-1">
              <FileDown className="h-3.5 w-3.5 text-amber-700" />
              Printable Vocab Review PDF Included
            </span>
          </div>

          <h1 className="text-3xl md:text-4xl font-bold text-brand-navy mb-3" data-testid="text-lessons-title">
            {heading}
          </h1>
          <p className="text-base md:text-lg text-slate-600 mb-6 max-w-3xl">
            {intro}{" "}
            <Link
              href={lessonDesign.href}
              className="font-medium text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2"
            >
              {lessonDesign.linkLabel}
            </Link>
          </p>

          {/* Search + CEFR Level + Category Controls */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 md:p-5 shadow-sm mb-8 space-y-4">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search free lessons by topic, level, or category (e.g. interview, salary, AI, travel)..."
                aria-label="Search free ESL lessons"
                className="pl-10 pr-10 bg-slate-50/70 border-slate-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>

            <nav aria-label="CEFR levels" className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1">
                CEFR Level:
              </span>
              <Link href="/esl-lessons">
                <Button variant={level ? "outline" : "default"} size="sm">
                  {level ? "All levels" : `All levels (${lessons.length})`}
                </Button>
              </Link>
              {LEVELS.map((lv) => (
                <Link key={lv} href={`/esl-lessons/${lv.toLowerCase()}`}>
                  <Button variant={lv === level ? "default" : "outline"} size="sm">
                    {lv} {LEVEL_NAMES[lv]}
                  </Button>
                </Link>
              ))}
            </nav>

            {availableCategories.length > 1 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1">
                  Topic Area:
                </span>
                <Button
                  type="button"
                  size="sm"
                  variant={selectedCategory === "all" ? "brand" : "outline"}
                  onClick={() => setSelectedCategory("all")}
                >
                  All topics
                </Button>
                {availableCategories.map(([catKey, count]) => (
                  <Button
                    key={catKey}
                    type="button"
                    size="sm"
                    variant={selectedCategory === catKey ? "brand" : "outline"}
                    onClick={() => setSelectedCategory(catKey)}
                  >
                    {PUBLIC_LIBRARY_LABELS[catKey as keyof typeof PUBLIC_LIBRARY_LABELS]} ({count})
                  </Button>
                ))}
              </div>
            )}
          </div>

          {isLoading ? (
            <p className="text-muted-foreground">Loading lessons…</p>
          ) : filteredLessons.length === 0 ? (
            <div className="rounded-xl border border-slate-200 bg-white p-8 text-center">
              <p className="text-slate-600 mb-4">
                {hasActiveFilters
                  ? "No public lessons match that search or filter yet."
                  : "No lessons found for this level yet."}
              </p>
              <div className="flex flex-wrap justify-center gap-3">
                {hasActiveFilters && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedCategory("all");
                    }}
                  >
                    Reset filters
                  </Button>
                )}
                {(() => {
                  const trimmedQuery = searchQuery.trim();
                  const generateHref = trimmedQuery
                    ? `/auth?register=true&redirect=${encodeURIComponent(
                        `/generate?topic=${encodeURIComponent(trimmedQuery)}${level ? `&level=${encodeURIComponent(level)}` : ""}`
                      )}`
                    : "/auth?register=true";
                  return (
                    <Link href={generateHref}>
                      <Button variant="brand">
                        <Sparkles className="h-4 w-4 mr-1.5" />
                        {trimmedQuery
                          ? `Generate “${trimmedQuery}” free (5-day trial)`
                          : "Generate this topic free (5-day trial)"}
                      </Button>
                    </Link>
                  );
                })()}
              </div>
            </div>
          ) : level || hasActiveFilters ? (
            <div className="grid sm:grid-cols-2 gap-4">{filteredLessons.map(renderCard)}</div>
          ) : (
            LEVELS.map((lv) => {
              const inLevel = filteredLessons.filter((l) => l.cefrLevel === lv);
              if (inLevel.length === 0) return null;
              return (
                <section key={lv} className="mb-10">
                  <div className="flex items-baseline justify-between mb-4">
                    <h2 className="text-2xl font-bold text-brand-navy">
                      <Link href={`/esl-lessons/${lv.toLowerCase()}`} className="hover:underline">
                        {lv} {LEVEL_NAMES[lv]}
                      </Link>
                    </h2>
                    <span className="text-sm text-slate-500">
                      {inLevel.length} {inLevel.length === 1 ? "lesson" : "lessons"}
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-4">{inLevel.map(renderCard)}</div>
                </section>
              );
            })
          )}

          <div className="mt-12 rounded-2xl bg-brand-navy text-white p-6 md:p-8 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <h2 className="text-xl md:text-2xl font-bold mb-2">
                Need a lesson on your student’s exact topic?
              </h2>
              <p className="text-slate-200 max-w-xl">
                Generate a complete 8-stage CEFR A1–C2 lesson on any niche topic in 1–2 minutes — complete with flashcards, semantic maps, and a printable Vocabulary Review PDF.
              </p>
            </div>
            <Link href="/auth?register=true" className="shrink-0">
              <Button variant="brand" size="lg">
                Start 5-Day Free Trial
              </Button>
            </Link>
          </div>

          <p className="mt-6 text-center text-sm text-slate-500">
            Created by <span className="font-medium text-brand-navy">Dave Jackson</span> (British ESL teacher, 11 years &amp; 2,000+ students). These lessons are designed to be teacher-led — if you’re an English learner who wants to take them 1-on-1 with a teacher, you can book with Dave at{" "}
            <a
              href="https://speakwithdave.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2 hover:text-amber-700"
            >
              SpeakWithDave.com
            </a>
            .
          </p>
        </div>
      </main>
    </>
  );
}
