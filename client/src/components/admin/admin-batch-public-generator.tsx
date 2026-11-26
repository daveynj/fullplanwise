import { useRef, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Loader2, Play, Sparkles, Square, XCircle } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { PUBLIC_LIBRARY_LABELS, type PublicLibraryCategory } from "@shared/schema";

const VALID_LEVELS = new Set(["A1", "A2", "B1", "B2", "C1", "C2"]);
const VALID_PUBLIC_CATEGORIES = new Set(Object.keys(PUBLIC_LIBRARY_LABELS));

export interface BatchPresetPack {
  id: string;
  label: string;
  description: string;
  defaultLessonCategory: "general" | "business" | "academic" | "medical" | "technology" | "tourism";
  lines: string;
}

export const RECOMMENDED_PUBLIC_LESSONS_BATCH = [
  "A1 | general-english | Ordering Food and Coffee at a Café",
  "A1 | general-english | Introducing Yourself and Talking About Your Family",
  "A1 | general-english | Asking for Directions in a New City",
  "A1 | general-english | Shopping for Clothes and Talking About Prices",
  "A1 | conversation-practice | Talking About Your Daily Routine and Weekend",
  "A2 | workplace-communication | Talking About Your Job and Workplace",
  "A2 | general-english | Planning a Holiday and Booking a Hotel",
  "A2 | general-english | Visiting a Doctor and Describing Symptoms",
  "A2 | conversation-practice | Making Small Talk with New People",
  "A2 | conversation-practice | Comparing City Life and Countryside Life",
  "B1 | workplace-communication | Preparing for an English Job Interview",
  "B1 | business-english | Remote Work vs. Working in an Office",
  "B1 | conversation-practice | How Social Media Affects Real-Life Friendships",
  "B1 | conversation-practice | Managing Stress and Staying Healthy at Work",
  "B1 | general-english | Travelling Solo vs. Travelling with Friends",
  "B1 | conversation-practice | Saving Money vs. Enjoying Life Today",
  "B2 | business-english | Negotiating a Salary or Promotion in English",
  "B2 | business-english | AI in the Workplace: Tool or Threat?",
  "B2 | conversation-practice | Work-Life Balance: Can You Really Have It All?",
  "B2 | workplace-communication | Giving Clear Presentations and Handling Tough Questions",
  "B2 | conversation-practice | Fast Fashion vs. Sustainable Shopping",
  "B2 | conversation-practice | Culture Shock and Adapting to Life Abroad",
  "C1 | business-english | Leading High-Stakes Client Meetings in English",
  "C1 | workplace-communication | Diplomatic Disagreement and Persuasion in Business",
  "C1 | business-english | The Economics of the Attention Economy",
  "C1 | conversation-practice | Ethical Dilemmas in Healthcare and Biotech",
  "C1 | business-english | Navigating Cross-Cultural Leadership Styles",
  "C2 | conversation-practice | The Longevity Race: Should Science Extend Human Lifespan?",
  "C2 | conversation-practice | Trust, Privacy, and Regulation in the Age of AI",
  "C2 | vocabulary-building | Subtle Irony, Idiom, and Nuance in Modern Media",
].join("\n");

export const ADMIN_BATCH_PRESET_PACKS: BatchPresetPack[] = [
  {
    id: "core",
    label: "Core A1–C2 (30)",
    description: "Balanced A1–C2 flagship library across everyday, workplace and advanced topics.",
    defaultLessonCategory: "general",
    lines: RECOMMENDED_PUBLIC_LESSONS_BATCH,
  },
  {
    id: "career",
    label: "Job Interviews & Career (15)",
    description: "High-intent career & interview lessons adult learners on Preply and italki search for.",
    defaultLessonCategory: "business",
    lines: [
      "A2 | workplace-communication | Answering Tell Me About Yourself in a Job Interview",
      "B1 | workplace-communication | Talking About Your Strengths and Weaknesses at an Interview",
      "B1 | workplace-communication | Explaining a Career Change or Employment Gap Clearly",
      "B1 | workplace-communication | Writing Polite Follow-Up and Thank-You Emails After an Interview",
      "B1 | workplace-communication | Handling Customer Complaints Calmly in English",
      "B2 | workplace-communication | Using the STAR Method for Behavioural Interview Questions",
      "B2 | business-english | Asking Smart Questions at the End of a Job Interview",
      "B2 | workplace-communication | Preparing for an Annual Performance Review in English",
      "B2 | business-english | Negotiating Remote Work, Flexible Hours, and Benefits",
      "B2 | workplace-communication | Giving Constructive Feedback Without Sounding Rude",
      "B2 | business-english | Networking and Introducing Your Work at International Conferences",
      "C1 | business-english | Executive Interviews: Pitching Your Leadership Vision in English",
      "C1 | workplace-communication | Pushing Back on Unrealistic Deadlines Diplomatically",
      "C1 | business-english | Transitioning From Individual Contributor to People Manager",
      "C1 | business-english | Explaining Complex Strategy to Non-Expert Stakeholders",
    ].join("\n"),
  },
  {
    id: "tech-business",
    label: "Tech & Business (15)",
    description: "Niche tech, startup, product and SaaS English topics static PDF libraries miss.",
    defaultLessonCategory: "technology",
    lines: [
      "B1 | workplace-communication | Running Clear Daily Stand-Up Meetings in Tech Teams",
      "B1 | business-english | Describing Software Bugs and Technical Issues Clearly",
      "B1 | business-english | Explaining How a Digital Product Works to New Customers",
      "B2 | workplace-communication | Giving and Receiving Code Review Feedback Professionally",
      "B2 | business-english | Managing Scope Creep and Changing Client Requirements",
      "B2 | business-english | Presenting Metrics, Charts, and Quarterly Results in English",
      "B2 | business-english | Customer Onboarding, Retention, and Reducing Churn in SaaS",
      "B2 | business-english | Cybersecurity, Phishing, and Data Privacy in the Modern Office",
      "B2 | workplace-communication | Collaborating Across Time Zones in Distributed Remote Teams",
      "B2 | business-english | Debating Build vs. Buy Decisions in Product Strategy",
      "C1 | business-english | Pitching a Startup and Handling Tough Investor Q&A",
      "C1 | business-english | AI Governance, Risk, and Compliance for Enterprise Leaders",
      "C1 | business-english | Leading Post-Mortem Reviews Without Creating a Blame Culture",
      "C1 | business-english | Negotiating Enterprise Contracts and Service Level Agreements",
      "C2 | business-english | Platform Monopolies, Regulation, and Competition in Big Tech",
    ].join("\n"),
  },
  {
    id: "ielts",
    label: "IELTS Speaking B2–C2 (15)",
    description: "High-search IELTS & academic speaking themes with rich vocabulary and collocations.",
    defaultLessonCategory: "academic",
    lines: [
      "B1 | ielts-preparation | IELTS Speaking: Hometowns, Cities, and Changing Neighbourhoods",
      "B1 | ielts-preparation | IELTS Speaking: Public Transport vs. Private Cars",
      "B2 | ielts-preparation | IELTS Speaking: University Degrees vs. Vocational Training",
      "B2 | ielts-preparation | IELTS Speaking: Urbanisation and Housing Affordability",
      "B2 | ielts-preparation | IELTS Speaking: Tourism, Local Culture, and Overcrowding",
      "B2 | ielts-preparation | IELTS Speaking: Screen Time, Attention Spans, and Children",
      "B2 | ielts-preparation | IELTS Speaking: Renewable Energy vs. Economic Growth",
      "B2 | ielts-preparation | IELTS Speaking: Traditional Libraries in a Digital Age",
      "C1 | ielts-preparation | IELTS Speaking: Automation, Job Displacement, and Retraining",
      "C1 | ielts-preparation | IELTS Speaking: Media Literacy, Algorithms, and Misinformation",
      "C1 | ielts-preparation | IELTS Speaking: Ageing Populations and Healthcare Funding",
      "C1 | ielts-preparation | IELTS Speaking: Preserving Minority Languages in a Globalised World",
      "C1 | ielts-preparation | IELTS Speaking: Public Art, Architecture, and Civic Identity",
      "C2 | ielts-preparation | IELTS Speaking: Scientific Progress vs. Moral Responsibility",
      "C2 | ielts-preparation | IELTS Speaking: Privacy, Surveillance, and Digital Citizenship",
    ].join("\n"),
  },
  {
    id: "medical",
    label: "Medical & Healthcare (12)",
    description: "High-value clinical, nursing and patient-care English topics for medical professionals.",
    defaultLessonCategory: "medical",
    lines: [
      "A2 | general-english | Describing Pain, Allergies, and Common Symptoms at a Clinic",
      "B1 | workplace-communication | Taking a Clear Patient Medical History in English",
      "B1 | workplace-communication | Explaining Prescription Dosages and Side Effects Simply",
      "B1 | workplace-communication | Reassuring an Anxious Patient Before a Medical Procedure",
      "B2 | workplace-communication | Delivering Clear Hospital Shift Handover Briefings",
      "B2 | workplace-communication | Discussing Preventive Care and Lifestyle Changes with Patients",
      "B2 | workplace-communication | Explaining Diagnostic Test Results Without Medical Jargon",
      "B2 | conversation-practice | Preventing Burnout and Supporting Mental Health in Healthcare",
      "C1 | workplace-communication | Breaking Difficult Medical News with Empathy and Clarity",
      "C1 | workplace-communication | Navigating Informed Consent and Treatment Trade-Offs",
      "C1 | conversation-practice | Telemedicine, Remote Diagnostics, and Patient Trust",
      "C1 | conversation-practice | Balancing Clinical Efficiency with Compassionate Patient Care",
    ].join("\n"),
  },
  {
    id: "expat-travel",
    label: "Expat & Relocation (12)",
    description: "Practical A2–C1 survival and integration lessons for expats, travellers and relocating professionals.",
    defaultLessonCategory: "tourism",
    lines: [
      "A1 | general-english | Checking In at the Airport and Going Through Customs",
      "A2 | general-english | Renting an Apartment and Talking to a Landlord",
      "A2 | general-english | Opening a Bank Account and Setting Up Utility Bills Abroad",
      "A2 | general-english | Dealing with Lost Luggage and Flight Delays Calmly",
      "A2 | general-english | Registering with a Local Doctor and Pharmacy in a New Country",
      "B1 | conversation-practice | Making Genuine Friends After Moving to a New Country",
      "B1 | general-english | Understanding Lease Contracts, Deposits, and Tenant Rights",
      "B1 | conversation-practice | Navigating Unspoken Cultural Rules in a New Workplace",
      "B1 | conversation-practice | Dealing with Homesickness During Your First Year Abroad",
      "B2 | conversation-practice | Raising Bilingual Children in an Expat Household",
      "B2 | conversation-practice | Digital Nomads vs. Long-Term Expats: Community and Belonging",
      "C1 | conversation-practice | Identity, Assimilation, and Feeling at Home Between Two Cultures",
    ].join("\n"),
  },
];

interface BatchItem {
  cefrLevel: string;
  publicCategory: PublicLibraryCategory;
  topic: string;
  status: "pending" | "generating" | "publishing" | "done" | "error";
  lessonId?: number;
  error?: string;
}

function parseBatchLines(text: string): BatchItem[] {
  const items: BatchItem[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split("|").map((p) => p.trim());
    if (parts.length < 2) continue;
    const level = parts[0].toUpperCase();
    if (!VALID_LEVELS.has(level)) continue;
    let publicCategory: PublicLibraryCategory = "general-english";
    let topic = "";
    if (parts.length >= 3 && VALID_PUBLIC_CATEGORIES.has(parts[1])) {
      publicCategory = parts[1] as PublicLibraryCategory;
      topic = parts.slice(2).join(" | ").trim();
    } else {
      topic = parts.slice(1).join(" | ").trim();
    }
    if (!topic) continue;
    items.push({ cefrLevel: level, publicCategory, topic, status: "pending" });
  }
  return items;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForLessonJob(jobId: string, maxMs = 4 * 60 * 1000): Promise<any> {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    await sleep(5000);
    const res = await apiRequest("GET", `/api/lessons/job/${jobId}`);
    const data = await res.json();
    if (data.status === "complete" && data.lesson?.id) return data.lesson;
    if (data.status === "error") throw new Error(data.error || "Lesson generation failed");
  }
  throw new Error("Timed out waiting for lesson generation");
}

/**
 * Admin-only batch generator that sequentially generates CEFR lessons and
 * publishes them to /esl-lessons. Never rendered for non-admin accounts.
 */
export function AdminBatchPublicGenerator({ onLessonPublished }: { onLessonPublished: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activePackId, setActivePackId] = useState<string>("career");
  const [rawList, setRawList] = useState(
    ADMIN_BATCH_PRESET_PACKS.find((p) => p.id === "career")?.lines ?? RECOMMENDED_PUBLIC_LESSONS_BATCH
  );
  const [items, setItems] = useState<BatchItem[]>([]);
  const [running, setRunning] = useState(false);
  const stopRef = useRef(false);

  // Defense in depth: strictly admin-only UI (route is also requireAdmin + backend checks isAdmin).
  if (!user?.isAdmin) return null;

  const activePack = ADMIN_BATCH_PRESET_PACKS.find((p) => p.id === activePackId);

  const selectPack = (pack: BatchPresetPack) => {
    if (running) return;
    setActivePackId(pack.id);
    setRawList(pack.lines);
    setItems([]);
  };

  const updateItem = (index: number, patch: Partial<BatchItem>) => {
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));
  };

  const handleStart = async () => {
    const parsed = parseBatchLines(rawList);
    if (parsed.length === 0) {
      toast({
        title: "No valid lines found",
        description: "Use format: CEFR | category | Topic (e.g. B2 | business-english | Negotiating a Salary)",
        variant: "destructive",
      });
      return;
    }

    stopRef.current = false;
    setItems(parsed);
    setRunning(true);

    let publishedCount = 0;

    for (let i = 0; i < parsed.length; i++) {
      if (stopRef.current) break;
      const item = parsed[i];
      updateItem(i, { status: "generating", error: undefined });

      try {
        const category =
          activePack && activePack.defaultLessonCategory !== "general"
            ? activePack.defaultLessonCategory
            : item.publicCategory === "ielts-preparation" || item.publicCategory === "exam-preparation"
              ? "academic"
              : item.publicCategory === "business-english" || item.publicCategory === "workplace-communication"
                ? "business"
                : "general";

        const res = await fetch("/api/lessons/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            topic: item.topic,
            cefrLevel: item.cefrLevel,
            category,
            focus: "general",
            lessonLength: 60,
            components: [
              "warm-up",
              "vocabulary",
              "reading",
              "comprehension",
              "sentences",
              "discussion",
              "quiz",
              ...(!["A1", "A2"].includes(item.cefrLevel) ? ["expressions"] : []),
            ],
            generateImages: true,
            useStudentHistory: false,
          }),
        });

        if (!res.ok) {
          const text = await res.text();
          let msg = text;
          try {
            msg = JSON.parse(text).message || text;
          } catch {}
          throw new Error(msg || `HTTP ${res.status}`);
        }

        const genData = await res.json();
        const lesson = genData.jobId
          ? await waitForLessonJob(genData.jobId)
          : genData?.id
            ? genData
            : null;

        if (!lesson?.id) {
          throw new Error("Generator returned no lesson ID");
        }

        updateItem(i, { status: "publishing", lessonId: lesson.id });

        await apiRequest("PATCH", `/api/lessons/${lesson.id}/public`, {
          publicCategory: item.publicCategory,
        });

        publishedCount += 1;
        updateItem(i, { status: "done", lessonId: lesson.id });
        onLessonPublished();
      } catch (err: any) {
        updateItem(i, { status: "error", error: err?.message || "Failed" });
      }
    }

    setRunning(false);
    toast({
      title: stopRef.current ? "Batch stopped" : "Batch complete",
      description: `Published ${publishedCount} of ${parsed.length} public lessons (images continue attaching in the background).`,
    });
  };

  const completedCount = items.filter((i) => i.status === "done").length;

  return (
    <Card className="mb-8 border-amber-200 bg-amber-50/40">
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Sparkles className="h-5 w-5 text-amber-600" />
              Admin Batch Generator — Public Library
            </CardTitle>
            <CardDescription className="mt-1">
              Admin-only tool. Generates lessons sequentially (~1–2 min each; images auto-attach in the background) and publishes them straight to <code>/esl-lessons</code>. Keep this tab open while running.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            {running ? (
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  stopRef.current = true;
                }}
              >
                <Square className="h-4 w-4 mr-1.5" />
                Stop after current
              </Button>
            ) : (
              <Button variant="brand" size="sm" onClick={handleStart}>
                <Play className="h-4 w-4 mr-1.5" />
                Generate &amp; Publish All ({parseBatchLines(rawList).length})
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Load a high-intent niche pack (click to switch):
          </div>
          <div className="flex flex-wrap gap-2">
            {ADMIN_BATCH_PRESET_PACKS.map((pack) => {
              const isSelected = pack.id === activePackId;
              return (
                <Button
                  key={pack.id}
                  type="button"
                  size="sm"
                  variant={isSelected ? "brand" : "outline"}
                  disabled={running}
                  onClick={() => selectPack(pack)}
                  className={isSelected ? "" : "bg-white hover:bg-amber-50 border-slate-200 text-slate-700"}
                >
                  {pack.label}
                </Button>
              );
            })}
          </div>
          {activePack && (
            <p className="text-xs text-slate-600">
              {activePack.description}
            </p>
          )}
        </div>

        <div>
          <label htmlFor="admin-batch-topics" className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
            One lesson per line: <code>CEFR | public-category | Topic</code> (edit or trim as needed)
          </label>
          <Textarea
            id="admin-batch-topics"
            rows={8}
            value={rawList}
            onChange={(e) => setRawList(e.target.value)}
            disabled={running}
            className="font-mono text-xs bg-white"
          />
        </div>

        {items.length > 0 && (
          <div className="rounded-xl bg-white border border-slate-200 p-4 space-y-2 max-h-72 overflow-y-auto">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 pb-2 border-b">
              <span>Progress: {completedCount} / {items.length} published</span>
              {running && <span className="text-amber-700">Running sequentially…</span>}
            </div>
            {items.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-xs py-1">
                <div className="flex items-center gap-2 min-w-0">
                  <Badge variant="outline" className="font-mono text-[10px]">{item.cefrLevel}</Badge>
                  <span className="truncate font-medium text-slate-800">{item.topic}</span>
                </div>
                <div className="flex-shrink-0">
                  {item.status === "pending" && <Badge variant="secondary">Queued</Badge>}
                  {item.status === "generating" && (
                    <Badge className="bg-amber-100 text-amber-800">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Generating…
                    </Badge>
                  )}
                  {item.status === "publishing" && (
                    <Badge className="bg-blue-100 text-blue-800">
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Publishing…
                    </Badge>
                  )}
                  {item.status === "done" && (
                    <a
                      href={`/lessons/${item.lessonId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-emerald-700 font-semibold hover:underline"
                    >
                      <CheckCircle2 className="h-3.5 w-3.5" /> Public #{item.lessonId}
                    </a>
                  )}
                  {item.status === "error" && (
                    <span className="inline-flex items-center gap-1 text-red-600" title={item.error}>
                      <XCircle className="h-3.5 w-3.5" /> {item.error?.slice(0, 40) || "Error"}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
