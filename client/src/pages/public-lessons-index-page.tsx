import { useEffect, useMemo, useRef, useState } from "react";
import { trackPublicLibraryEvent } from "@/lib/public-library-analytics";
import { trackCta, trackEvent } from "@/lib/analytics";
import { lessonPath } from "@shared/lesson-url";
import { Link, useRoute } from "wouter";
import { libraryDesign, lessonDesign, freeLibraryTeachingGuide, freeLibraryFaq, soloLearnerAiGuide } from "@shared/lesson-pedagogy";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SEOHead } from "@/components/SEOHead";
import { BlogHeader } from "@/components/layout/blog-header";
import { PUBLIC_LIBRARY_LABELS } from "@shared/schema";
import { freeLessonLicence } from "@shared/site-facts";
import {
  ArrowRight,
  BookOpen,
  Briefcase,
  Bus,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  FileDown,
  Film,
  FlaskConical,
  Gift,
  Globe,
  GraduationCap,
  Heart,
  Laptop,
  Leaf,
  Plane,
  Search,
  ShoppingBag,
  Sparkles,
  Trophy,
  Users,
  Utensils,
  X,
  type LucideIcon,
} from "lucide-react";
import { filterPublicLessons, PUBLIC_LESSON_TAGS, PUBLIC_LESSON_TAG_DESCRIPTIONS, FEATURED_SEASONAL_TAGS, isPublicLessonTag, publicTags, type PublicLessonTag } from "@shared/public-lesson-tags";
import { LEVEL_TEACHING_NOTES, levelTopicDescription, levelTopicPath, levelTopicTitle, type CefrLevel } from "@shared/library-browse";

interface ThemeCardStyle {
  card: string;
  iconBox: string;
  accentText: string;
  icon: LucideIcon;
  subtitle: string;
}

const THEME_CARD_STYLES: Record<PublicLessonTag, ThemeCardStyle> = {
  holidays: {
    card: "border-2 border-rose-300 bg-gradient-to-br from-rose-50 via-amber-50/70 to-white hover:border-rose-500",
    iconBox: "bg-rose-600 text-white",
    accentText: "text-rose-800 group-hover:text-rose-900",
    icon: Gift,
    subtitle: "Christmas, New Year & global traditions",
  },
  culture: {
    card: "border-2 border-indigo-200 bg-gradient-to-br from-indigo-50/90 to-white hover:border-indigo-400",
    iconBox: "bg-indigo-600 text-white",
    accentText: "text-indigo-800 group-hover:text-indigo-900",
    icon: Globe,
    subtitle: "Customs, manners & cultural perspectives",
  },
  travel: {
    card: "border-2 border-sky-200 bg-gradient-to-br from-sky-50/90 to-white hover:border-sky-400",
    iconBox: "bg-sky-600 text-white",
    accentText: "text-sky-800 group-hover:text-sky-900",
    icon: Plane,
    subtitle: "Trips, airports & life abroad",
  },
  work: {
    card: "border-2 border-slate-300 bg-gradient-to-br from-slate-100/90 to-white hover:border-brand-navy",
    iconBox: "bg-brand-navy text-white",
    accentText: "text-brand-navy",
    icon: Briefcase,
    subtitle: "Interviews, meetings & workplace English",
  },
  technology: {
    card: "border-2 border-violet-200 bg-gradient-to-br from-violet-50/90 to-white hover:border-violet-400",
    iconBox: "bg-violet-600 text-white",
    accentText: "text-violet-800 group-hover:text-violet-900",
    icon: Laptop,
    subtitle: "Digital life, apps & innovation",
  },
  "artificial-intelligence": {
    card: "border-2 border-purple-200 bg-gradient-to-br from-purple-50/90 to-white hover:border-purple-400",
    iconBox: "bg-purple-600 text-white",
    accentText: "text-purple-800 group-hover:text-purple-900",
    icon: Sparkles,
    subtitle: "AI tools, ethics & future work",
  },
  environment: {
    card: "border-2 border-emerald-200 bg-gradient-to-br from-emerald-50/90 to-white hover:border-emerald-400",
    iconBox: "bg-emerald-600 text-white",
    accentText: "text-emerald-800 group-hover:text-emerald-900",
    icon: Leaf,
    subtitle: "Climate, nature & sustainability",
  },
  money: {
    card: "border-2 border-amber-300 bg-gradient-to-br from-amber-50/90 to-white hover:border-amber-500",
    iconBox: "bg-amber-600 text-white",
    accentText: "text-amber-800 group-hover:text-amber-900",
    icon: Coins,
    subtitle: "Personal finance, banking & spending",
  },
  health: {
    card: "border-2 border-teal-200 bg-gradient-to-br from-teal-50/90 to-white hover:border-teal-400",
    iconBox: "bg-teal-600 text-white",
    accentText: "text-teal-800 group-hover:text-teal-900",
    icon: Heart,
    subtitle: "Medical visits, wellness & habits",
  },
  food: {
    card: "border-2 border-orange-200 bg-gradient-to-br from-orange-50/90 to-white hover:border-orange-400",
    iconBox: "bg-orange-600 text-white",
    accentText: "text-orange-800 group-hover:text-orange-900",
    icon: Utensils,
    subtitle: "Dining, cooking & street food",
  },
  relationships: {
    card: "border-2 border-pink-200 bg-gradient-to-br from-pink-50/90 to-white hover:border-pink-400",
    iconBox: "bg-pink-600 text-white",
    accentText: "text-pink-800 group-hover:text-pink-900",
    icon: Users,
    subtitle: "Friends, family & social life",
  },
  education: {
    card: "border-2 border-blue-200 bg-gradient-to-br from-blue-50/90 to-white hover:border-blue-400",
    iconBox: "bg-blue-600 text-white",
    accentText: "text-blue-800 group-hover:text-blue-900",
    icon: GraduationCap,
    subtitle: "Study skills, exams & learning",
  },
  sport: {
    card: "border-2 border-lime-300 bg-gradient-to-br from-lime-50/90 to-white hover:border-lime-500",
    iconBox: "bg-lime-600 text-white",
    accentText: "text-lime-800 group-hover:text-lime-900",
    icon: Trophy,
    subtitle: "Fitness, teams & sporting events",
  },
  science: {
    card: "border-2 border-cyan-200 bg-gradient-to-br from-cyan-50/90 to-white hover:border-cyan-400",
    iconBox: "bg-cyan-600 text-white",
    accentText: "text-cyan-800 group-hover:text-cyan-900",
    icon: FlaskConical,
    subtitle: "Discoveries, space & curiosity",
  },
  entertainment: {
    card: "border-2 border-fuchsia-200 bg-gradient-to-br from-fuchsia-50/90 to-white hover:border-fuchsia-400",
    iconBox: "bg-fuchsia-600 text-white",
    accentText: "text-fuchsia-800 group-hover:text-fuchsia-900",
    icon: Film,
    subtitle: "Movies, music & pop culture",
  },
  shopping: {
    card: "border-2 border-yellow-300 bg-gradient-to-br from-yellow-50/90 to-white hover:border-yellow-500",
    iconBox: "bg-yellow-600 text-white",
    accentText: "text-yellow-800 group-hover:text-yellow-900",
    icon: ShoppingBag,
    subtitle: "Retail, consumer habits & returns",
  },
  transport: {
    card: "border-2 border-stone-300 bg-gradient-to-br from-stone-100/90 to-white hover:border-stone-500",
    iconBox: "bg-stone-700 text-white",
    accentText: "text-stone-800 group-hover:text-stone-900",
    icon: Bus,
    subtitle: "Commuting, cities & transit",
  },
};

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
  tags: string[] | null;
}

// Public (no login) browse pages: /esl-lessons and /esl-lessons/:level.
// Search engines get server-rendered HTML for these URLs; this component takes
// over once the app loads.
export default function PublicLessonsIndexPage() {
  const [isTopicRoute, topicParams] = useRoute("/esl-lessons/topics/:tag");
  const [isLevelTopicRoute, levelTopicParams] = useRoute("/esl-lessons/:level/topics/:tag");
  const [, params] = useRoute("/esl-lessons/:level");
  const rawTopic = isTopicRoute ? topicParams?.tag?.toLowerCase() : isLevelTopicRoute ? levelTopicParams?.tag?.toLowerCase() : undefined;
  const activeTopic: PublicLessonTag | undefined = rawTopic && isPublicLessonTag(rawTopic) ? rawTopic : undefined;
  const requested = isLevelTopicRoute ? levelTopicParams?.level?.toUpperCase() : !isTopicRoute ? params?.level?.toUpperCase() : undefined;
  const level = requested && (LEVELS as readonly string[]).includes(requested) ? requested : undefined;

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");
  const [selectedThemeLevel, setSelectedThemeLevel] = useState<string>("all");
  const [copiedAiPrompt, setCopiedAiPrompt] = useState(false);
  const pendingFilterAction = useRef<{ level: string | undefined; delay: number } | null>(null);

  const copyAiPrompt = async () => {
    try {
      await navigator.clipboard?.writeText(soloLearnerAiGuide.prompt);
      setCopiedAiPrompt(true);
      trackEvent("public_library_ai_prompt_copied", { location: "library_index" });
      window.setTimeout(() => setCopiedAiPrompt(false), 2500);
    } catch {
      // Clipboard may be unavailable in restricted contexts.
    }
  };

  useEffect(() => {
    setSelectedThemeLevel("all");
  }, [activeTopic]);

  const { data, isLoading, isFetching, isSuccess, isError, error, refetch } = useQuery<{ lessons: LessonSummary[] }>({
    queryKey: ["public-lesson-index", level ?? "all"],
    queryFn: async () => {
      const res = await fetch(`/api/public-lesson-index${level ? `?level=${level}` : ""}`);
      if (!res.ok) throw new Error("Failed to load lessons");
      return res.json();
    },
  });

  const allLessons = data?.lessons ?? [];
  const lessons = useMemo(() => {
    if (!activeTopic) return allLessons;
    return allLessons.filter((l) => publicTags(l.tags).includes(activeTopic));
  }, [allLessons, activeTopic]);
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

  const availableTags = useMemo(() => {
    const counts = new Map<PublicLessonTag, number>();
    for (const lesson of lessons) {
      for (const tag of publicTags(lesson.tags)) counts.set(tag, (counts.get(tag) ?? 0) + 1);
    }
    return Array.from(counts.entries()).sort((a, b) => {
      const aPinned = FEATURED_SEASONAL_TAGS.includes(a[0]) ? 0 : 1;
      const bPinned = FEATURED_SEASONAL_TAGS.includes(b[0]) ? 0 : 1;
      if (aPinned !== bPinned) return aPinned - bPinned;
      return b[1] - a[1] || PUBLIC_LESSON_TAGS[a[0]].localeCompare(PUBLIC_LESSON_TAGS[b[0]]);
    });
  }, [lessons]);

  const filteredLessons = useMemo(() => {
    const base = filterPublicLessons(lessons, searchQuery, selectedCategory, selectedTag, PUBLIC_LIBRARY_LABELS);
    if (!activeTopic || selectedThemeLevel === "all") return base;
    return base.filter((l) => l.cefrLevel === selectedThemeLevel);
  }, [lessons, searchQuery, selectedCategory, selectedTag, activeTopic, selectedThemeLevel]);

  // Consume only user-initiated actions, never initial loads, rerenders or refetches.
  // Search changes settle for 500ms so a word isn't counted once per keystroke.
  useEffect(() => {
    const pending = pendingFilterAction.current;
    if (!pending) return;
    if (pending.level !== level) {
      pendingFilterAction.current = null;
      return;
    }
    if (!isSuccess || isFetching) return;
    const timer = window.setTimeout(() => {
      pendingFilterAction.current = null;
      if (filteredLessons.length === 0 && (searchQuery.trim() || selectedCategory !== "all" || selectedTag !== "all")) {
        trackPublicLibraryEvent("public_library_zero_results", {
          tag: selectedTag, category: selectedCategory, level, resultCount: 0,
        });
      }
    }, pending.delay);
    return () => window.clearTimeout(timer);
  }, [searchQuery, selectedCategory, selectedTag, level, filteredLessons, isSuccess, isFetching]);

  function changeFilters(next: { search?: string; category?: string; tag?: string }, reset = false) {
    const search = next.search ?? searchQuery;
    const category = next.category ?? selectedCategory;
    const tag = next.tag ?? selectedTag;
    if (search === searchQuery && category === selectedCategory && tag === selectedTag) return;
    const resultCount = filterPublicLessons(lessons, search, category, tag, PUBLIC_LIBRARY_LABELS).length;
    // Reset payloads describe the filters being cleared; selection payloads
    // describe the new filters and their resulting lesson count.
    if (reset) {
      trackPublicLibraryEvent("public_library_filters_reset", {
        tag: selectedTag, category: selectedCategory, level, resultCount,
      });
    } else if (tag !== selectedTag) {
      trackPublicLibraryEvent("public_library_tag_selected", { tag, category, level, resultCount });
    } else if (category !== selectedCategory) {
      trackPublicLibraryEvent("public_library_category_selected", { tag, category, level, resultCount });
    }
    const debouncedSearch = next.search !== undefined && !reset;
    if (!debouncedSearch && isSuccess && !isFetching) {
      pendingFilterAction.current = null;
      if (resultCount === 0 && (search.trim() || category !== "all" || tag !== "all")) {
        trackPublicLibraryEvent("public_library_zero_results", { tag, category, level, resultCount });
      }
    } else {
      pendingFilterAction.current = { level, delay: debouncedSearch ? 500 : 0 };
    }
    setSearchQuery(search);
    setSelectedCategory(category);
    setSelectedTag(tag);
  }

  const heading = level && activeTopic
    ? levelTopicTitle(level, activeTopic)
    : activeTopic
      ? `Free ${PUBLIC_LESSON_TAGS[activeTopic]} ESL Lessons (A1–C2)`
      : level
        ? `${level} (${levelName}) Free ESL Lessons`
        : "Free ESL Lesson Library (A1–C2)";
  const intro = level && activeTopic
    ? `${lessons.length} free ${level} (${levelName.toLowerCase()}) ESL conversation lessons about ${PUBLIC_LESSON_TAGS[activeTopic].toLowerCase()}, ready to teach with no login. ${LEVEL_TEACHING_NOTES[level as CefrLevel] ?? ""} ${libraryDesign}`
    : activeTopic
      ? `${PUBLIC_LESSON_TAG_DESCRIPTIONS[activeTopic]} ${libraryDesign}`
      : level
        ? `Ready-to-teach ${level} ${levelName.toLowerCase()} ESL conversation lessons — open any lesson free with zero login. ${libraryDesign}`
        : `Open, teach, and share complete CEFR A1–C2 ESL conversation lessons with zero login required. ${libraryDesign}`;

  const renderCard = (lesson: LessonSummary) => {
    const label = lesson.publicCategory
      ? PUBLIC_LIBRARY_LABELS[lesson.publicCategory as keyof typeof PUBLIC_LIBRARY_LABELS]
      : undefined;
    return (
      <Link key={lesson.id} href={lessonPath(lesson)} className="block h-full"
        onClick={() => trackPublicLibraryEvent("public_library_lesson_opened", {
          tag: selectedTag, category: selectedCategory, level: lesson.cefrLevel,
          resultCount: filteredLessons.length, lessonId: lesson.id,
        })}
      >
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
              {publicTags(lesson.tags).map((tag) => (
                <Badge key={tag} variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                  {PUBLIC_LESSON_TAGS[tag]}
                </Badge>
              ))}
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

  const hasActiveFilters = searchQuery.trim().length > 0 || selectedCategory !== "all" || selectedTag !== "all" || selectedThemeLevel !== "all";

  return (
    <>
      <SEOHead
        title={
          level && activeTopic
            ? `${levelTopicTitle(level, activeTopic)} | PlanWise ESL`
            : activeTopic
              ? `Free ${PUBLIC_LESSON_TAGS[activeTopic]} ESL Lessons (A1–C2) | PlanWise ESL`
              : level
                ? `${level} (${levelName}) ESL Lessons - Free Lesson Plans | PlanWise ESL`
                : "Free ESL Lessons by CEFR Level (A1-C2) | PlanWise ESL"
        }
        description={
          level && activeTopic
            ? levelTopicDescription(level, activeTopic, lessons.length)
            : activeTopic
              ? PUBLIC_LESSON_TAG_DESCRIPTIONS[activeTopic]
              : level
                ? `Free ${level} (${levelName}) ESL conversation lessons with pre-taught vocabulary, a levelled reading, speaking support and discussion. Ready to teach.`
                : "Free ESL conversation lessons for every CEFR level (A1–C2) with pre-taught vocabulary, a levelled reading, speaking support and discussion."
        }
        canonicalUrl={
          level && activeTopic
            ? levelTopicPath(level, activeTopic)
            : activeTopic
              ? `/esl-lessons/topics/${activeTopic}`
              : level
                ? `/esl-lessons/${level.toLowerCase()}`
                : "/esl-lessons"
        }
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
          <p className="text-base md:text-lg text-slate-600 mb-3 max-w-3xl">
            {intro}{" "}
            <Link
              href={lessonDesign.href}
              className="font-medium text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2"
            >
              {lessonDesign.linkLabel}
            </Link>
          </p>
          <a
            href="#how-to-teach-free-lessons"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-navy hover:text-amber-700 mb-6 underline decoration-brand-yellow decoration-2 underline-offset-4"
          >
            How to teach any free lesson (30- &amp; 60-min teacher guide) ↓
          </a>

          {/* Search + CEFR Level + Category Controls */}
          <div className="rounded-2xl bg-white border border-slate-200 p-4 md:p-5 shadow-sm mb-8 space-y-4">
            <div className="relative">
              <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <Input
                type="search"
                value={searchQuery}
                onChange={(e) => changeFilters({ search: e.target.value })}
                placeholder="Search free lessons by topic, level, or category (e.g. interview, salary, AI, travel)..."
                aria-label="Search free ESL lessons"
                className="pl-10 pr-10 bg-slate-50/70 border-slate-200"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => changeFilters({ search: "" }, true)}
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
              {activeTopic ? (
                <>
                  <Button
                    type="button"
                    variant={selectedThemeLevel === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedThemeLevel("all")}
                  >
                    All levels ({lessons.length})
                  </Button>
                  {LEVELS.map((lv) => {
                    const count = lessons.filter((l) => l.cefrLevel === lv).length;
                    if (!count) return null;
                    return (
                      <Button
                        key={lv}
                        type="button"
                        variant={selectedThemeLevel === lv ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedThemeLevel(lv)}
                      >
                        {lv} {LEVEL_NAMES[lv]} ({count})
                      </Button>
                    );
                  })}
                  <Link href="/esl-lessons" className="ml-auto text-xs font-semibold text-brand-navy hover:text-amber-700 underline">
                    ← All free lessons
                  </Link>
                </>
              ) : (
                <>
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
                </>
              )}
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
                  onClick={() => changeFilters({ category: "all" }, true)}
                >
                  All topics
                </Button>
                {availableCategories.map(([catKey, count]) => (
                  <Button
                    key={catKey}
                    type="button"
                    size="sm"
                    variant={selectedCategory === catKey ? "brand" : "outline"}
                    onClick={() => changeFilters({ category: catKey })}
                  >
                    {PUBLIC_LIBRARY_LABELS[catKey as keyof typeof PUBLIC_LIBRARY_LABELS]} ({count})
                  </Button>
                ))}
              </div>
            )}
            {availableTags.length > 0 && !activeTopic && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100" aria-label="Curated topic tags">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mr-1">
                  Curated tags:
                </span>
                <Button type="button" size="sm" variant={selectedTag === "all" ? "brand" : "outline"} onClick={() => changeFilters({ tag: "all" }, true)} aria-pressed={selectedTag === "all"}>
                  All tags
                </Button>
                {availableTags.map(([tag, count]) => (
                  <Button
                    key={tag}
                    type="button"
                    size="sm"
                    variant={selectedTag === tag ? "brand" : "outline"}
                    onClick={() => changeFilters({ tag })}
                    aria-pressed={selectedTag === tag}
                  >
                    {PUBLIC_LESSON_TAGS[tag as keyof typeof PUBLIC_LESSON_TAGS]} ({count})
                  </Button>
                ))}
              </div>
            )}
          </div>

          {!level && !activeTopic && !hasActiveFilters && availableTags.length > 0 && (
            <section className="mb-8" aria-label="Browse free lessons by theme">
              <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl font-bold text-brand-navy">Browse by Theme</h2>
                <span className="text-xs font-medium text-slate-600">Dedicated collections across CEFR A1–C2</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {availableTags.map(([tag, count]) => {
                  const isSeasonal = FEATURED_SEASONAL_TAGS.includes(tag);
                  const themeStyle = THEME_CARD_STYLES[tag];
                  const Icon = themeStyle.icon;
                  return (
                    <Link
                      key={tag}
                      href={`/esl-lessons/topics/${tag}`}
                      onClick={() => trackPublicLibraryEvent("public_library_theme_clicked", { tag, category: "", resultCount: count })}
                      className={`group flex items-start gap-3.5 rounded-2xl p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${themeStyle.card}`}
                    >
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl shadow-sm ${themeStyle.iconBox}`}>
                        <Icon className="h-5 w-5" aria-hidden="true" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-base font-bold leading-snug text-brand-navy">
                            {PUBLIC_LESSON_TAGS[tag]}
                          </span>
                          {isSeasonal && (
                            <span className="shrink-0 rounded-full bg-brand-navy px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                              Seasonal
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs text-slate-600 line-clamp-1">
                          {themeStyle.subtitle}
                        </p>
                        <div className={`mt-2.5 flex items-center justify-between border-t border-slate-900/10 pt-2 text-xs font-bold ${themeStyle.accentText}`}>
                          <span>{count} {count === 1 ? "lesson" : "lessons"}</span>
                          <span className="inline-flex items-center gap-1">
                            Explore
                            <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                          </span>
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {isLoading ? (
            <div role="status" aria-label="Loading lessons" className="grid sm:grid-cols-2 gap-4">
              {Array.from({ length: 4 }).map((_, index) => <div key={index} className="h-36 rounded-xl bg-slate-200/70 animate-pulse" />)}
            </div>
          ) : isError ? (
            <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
              <p className="text-red-900 font-semibold">Lessons could not be loaded.</p>
              <p className="mt-1 text-sm text-red-800">{error instanceof Error ? error.message : "Please try again."}</p>
              <Button className="mt-4" variant="outline" onClick={() => void refetch()}>Try again</Button>
            </div>
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
                      changeFilters({ search: "", category: "all", tag: "all" }, true);
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
                          ? `Generate “${trimmedQuery}” free (14-day trial)`
                          : "Generate this topic free (14-day trial)"}
                      </Button>
                    </Link>
                  );
                })()}
              </div>
            </div>
          ) : (
            <>
              <p className="mb-4 text-sm text-slate-500" aria-live="polite">
                Showing {filteredLessons.length} of {lessons.length} {lessons.length === 1 ? "lesson" : "lessons"}
              </p>
              {level || hasActiveFilters ? (
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
            </>
          )}

          <section
            id="how-to-teach-free-lessons"
            className="mt-14 rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-brand-navy mb-2">
              {freeLibraryTeachingGuide.heading}
            </h2>
            <p className="text-slate-600 mb-6 max-w-3xl">
              {freeLibraryTeachingGuide.intro}
            </p>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full border-collapse text-sm text-left">
                <thead>
                  <tr className="bg-brand-navy text-white">
                    <th scope="col" className="px-4 py-3 font-semibold">Lesson Stage</th>
                    <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">30-Min Class</th>
                    <th scope="col" className="px-4 py-3 font-semibold whitespace-nowrap">50–60 Min Class</th>
                    <th scope="col" className="px-4 py-3 font-semibold">How to Teach It</th>
                  </tr>
                </thead>
                <tbody>
                  {freeLibraryTeachingGuide.stages.map((item) => (
                    <tr key={item.stage} className="border-t border-slate-200">
                      <td className="px-4 py-3 font-semibold text-brand-navy whitespace-nowrap">{item.stage}</td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{item.min30}</td>
                      <td className="px-4 py-3 text-slate-700 whitespace-nowrap">{item.min60}</td>
                      <td className="px-4 py-3 text-slate-600">{item.howToTeach}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section
            id={freeLessonLicence.id}
            className="mt-8 rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-brand-navy mb-2">{freeLessonLicence.heading}</h2>
            <p className="text-slate-600 max-w-3xl">{freeLessonLicence.text}</p>
          </section>

          <section
            id="self-study-with-ai"
            className="mt-8 rounded-2xl bg-amber-50/60 border border-amber-200 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-brand-navy mb-2">
              {soloLearnerAiGuide.heading}
            </h2>
            <p className="text-slate-700 mb-4 max-w-3xl">
              {soloLearnerAiGuide.intro}
            </p>
            <ol className="list-decimal list-inside space-y-1.5 text-sm text-slate-700 mb-4">
              {soloLearnerAiGuide.steps.map((step) => (
                <li key={step}>{step}</li>
              ))}
            </ol>
            <div className="rounded-xl border border-amber-200 bg-white p-4 font-mono text-xs leading-relaxed text-slate-800 mb-4">
              {soloLearnerAiGuide.prompt}
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Button type="button" variant="outline" onClick={() => void copyAiPrompt()} className="bg-white">
                {copiedAiPrompt ? <Check className="mr-2 h-4 w-4 text-emerald-600" /> : <Copy className="mr-2 h-4 w-4" />}
                {copiedAiPrompt ? "Copied AI Tutor Prompt" : "Copy AI Tutor Prompt"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-600 leading-relaxed max-w-3xl">
              {soloLearnerAiGuide.modelTip}
            </p>
            <p className="mt-2.5 text-xs text-slate-700 leading-relaxed max-w-3xl">
              {soloLearnerAiGuide.liveTeacherPrefix}
              <a
                href={soloLearnerAiGuide.liveTeacherHref}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => trackCta("self-study-with-ai", "Book 1-on-1 with Dave")}
                className="font-medium text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-2 hover:text-amber-700"
              >
                {soloLearnerAiGuide.liveTeacherLinkLabel}
              </a>
              .
            </p>
          </section>

          <section
            id="free-library-faq"
            className="mt-8 rounded-2xl bg-white border border-slate-200 p-6 md:p-8 shadow-sm"
          >
            <h2 className="text-2xl font-bold text-brand-navy mb-5">
              Frequently Asked Questions
            </h2>
            <div className="space-y-5">
              {freeLibraryFaq.map((item) => (
                <div key={item.question} className="border-b border-slate-100 last:border-b-0 pb-4 last:pb-0">
                  <h3 className="text-base font-semibold text-brand-navy mb-1.5">
                    {item.question}
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              ))}
            </div>
          </section>

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
                Start 14-Day Free Trial
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
