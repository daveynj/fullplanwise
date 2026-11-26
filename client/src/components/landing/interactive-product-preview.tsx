import { useState } from 'react';
import { Link } from 'wouter';
import { BookOpen, FileText, Network, RotateCw, Sparkles } from 'lucide-react';

type PreviewTab = 'vocab' | 'flashcard' | 'semantic' | 'pdf';

const TABS: { id: PreviewTab; label: string; icon: typeof BookOpen }[] = [
  { id: 'vocab', label: 'Vocab Card', icon: BookOpen },
  { id: 'flashcard', label: 'Flashcard', icon: RotateCw },
  { id: 'semantic', label: 'Semantic Map', icon: Network },
  { id: 'pdf', label: 'Study PDF', icon: FileText },
];

/**
 * Interactive 4-tab product preview shown in the homepage hero so visiting
 * teachers can feel the actual lesson depth (real B2 "juggle" entry from
 * "Work-Life Balance: Can You Really Have It All?") before signing up.
 */
export function InteractiveProductPreview() {
  const [tab, setTab] = useState<PreviewTab>('vocab');
  const [flipped, setFlipped] = useState(false);

  return (
    <div className="rounded-3xl bg-white shadow-2xl shadow-brand-navy/12 ring-1 ring-slate-900/10 overflow-hidden">
      {/* Window chrome / lesson header */}
      <div className="bg-brand-navy px-5 py-3.5 flex items-center justify-between gap-2 text-white">
        <div className="flex items-center gap-2 min-w-0">
          <span className="h-2.5 w-2.5 rounded-full bg-brand-yellow flex-shrink-0" />
          <p className="text-xs sm:text-sm font-nunito font-bold truncate">
            Work-Life Balance: Can You Really Have It All?
          </p>
        </div>
        <span className="text-[11px] font-bold bg-brand-yellow text-brand-navy px-2.5 py-0.5 rounded-full flex-shrink-0">
          CEFR B2
        </span>
      </div>

      {/* Interactive tab bar */}
      <div
        role="tablist"
        aria-label="Preview PlanWise ESL lesson stages"
        className="grid grid-cols-4 border-b border-slate-100 bg-slate-50/80 p-1.5 gap-1"
      >
        {TABS.map(({ id, label, icon: Icon }) => {
          const active = tab === id;
          return (
            <button
              key={id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                setTab(id);
                if (id !== 'flashcard') setFlipped(false);
              }}
              className={`flex items-center justify-center gap-1.5 rounded-xl py-2 px-2 text-xs font-semibold transition-all ${
                active
                  ? 'bg-white text-brand-navy shadow-sm ring-1 ring-slate-900/10'
                  : 'text-slate-500 hover:text-brand-navy hover:bg-white/60'
              }`}
            >
              <Icon className={`h-3.5 w-3.5 flex-shrink-0 ${active ? 'text-amber-600' : ''}`} />
              <span className="truncate">{label}</span>
            </button>
          );
        })}
      </div>

      {/* Preview body */}
      <div className="p-5 sm:p-6 min-h-[340px] flex flex-col justify-between">
        {tab === 'vocab' && (
          <div className="space-y-3.5 text-left">
            <div className="flex items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
              <div>
                <span className="text-2xl font-nunito font-extrabold text-brand-navy">juggle</span>
                <span className="ml-2 text-xs font-semibold uppercase tracking-wide text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  verb
                </span>
              </div>
              <span className="text-sm font-mono text-slate-500">/JUG-ul/</span>
            </div>

            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Levelled Definition</p>
              <p className="text-sm text-slate-800 font-medium mt-0.5">
                to manage many things at the same time
              </p>
            </div>

            <div className="rounded-xl bg-amber-50/70 border border-amber-100 p-3">
              <p className="text-[11px] font-bold uppercase tracking-wider text-amber-800">Example</p>
              <p className="text-sm italic text-slate-700 mt-0.5">
                “She juggles a full-time job with raising two small children.”
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="font-bold text-brand-navy mb-1">Common Collocations</p>
                <p className="text-slate-600">juggle work and family · juggle responsibilities · juggle competing demands</p>
              </div>
              <div className="rounded-xl bg-slate-50 p-3 border border-slate-100">
                <p className="font-bold text-brand-navy mb-1">Word Family &amp; Usage Note</p>
                <p className="text-slate-600">juggler, juggling — often used with “with” or “and”; suggests effort and skill.</p>
              </div>
            </div>
          </div>
        )}

        {tab === 'flashcard' && (
          <div className="flex flex-col items-center justify-center flex-1 py-2">
            <button
              type="button"
              onClick={() => setFlipped((f) => !f)}
              className={`w-full rounded-2xl p-6 text-center transition-all duration-300 border-2 cursor-pointer ${
                flipped
                  ? 'bg-emerald-50/70 border-emerald-200'
                  : 'bg-gradient-to-br from-brand-navy to-brand-navy-light text-white border-brand-navy shadow-lg'
              }`}
            >
              {!flipped ? (
                <div className="space-y-3 py-4">
                  <p className="text-xs uppercase tracking-widest text-brand-yellow font-semibold">
                    In-Lesson Active Recall
                  </p>
                  <p className="text-3xl font-nunito font-extrabold">juggle</p>
                  <p className="text-sm text-white/75 italic">verb · /JUG-ul/</p>
                  <span className="inline-flex items-center gap-1.5 mt-3 rounded-full bg-white/15 px-4 py-1.5 text-xs font-semibold text-white">
                    <RotateCw className="h-3.5 w-3.5" /> Click card to flip &amp; check meaning
                  </span>
                </div>
              ) : (
                <div className="space-y-3 py-2 text-left">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">Meaning</span>
                    <span className="text-xs text-slate-500">Click to flip back</span>
                  </div>
                  <p className="text-lg font-nunito font-bold text-brand-navy">
                    to manage many things at the same time
                  </p>
                  <p className="text-sm italic text-slate-700">
                    “I’ve been juggling three projects this month.”
                  </p>
                  <div className="rounded-xl bg-white p-3 border border-emerald-200 text-xs text-emerald-900">
                    <span className="font-bold">Speaking prompt:</span> Ask your student to create their own original sentence using <span className="font-semibold">juggle</span>.
                  </div>
                </div>
              )}
            </button>
            <p className="text-xs text-slate-500 mt-3 text-center">
              Every student also gets spaced flashcards on their zero-login learner dashboard.
            </p>
          </div>
        )}

        {tab === 'semantic' && (
          <div className="space-y-3 text-left">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-wider text-brand-navy">
                5-Part Semantic Map · “juggle”
              </p>
              <span className="text-[11px] text-slate-500">Deep lexical connections</span>
            </div>
            <div className="grid grid-cols-2 gap-2.5 text-xs">
              <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                <p className="font-bold text-emerald-800 mb-1">Synonyms</p>
                <p className="text-emerald-900">manage, balance, handle</p>
              </div>
              <div className="rounded-xl bg-rose-50 border border-rose-200 p-3">
                <p className="font-bold text-rose-800 mb-1">Antonyms</p>
                <p className="text-rose-900">focus on one thing, drop</p>
              </div>
              <div className="rounded-xl bg-blue-50 border border-blue-200 p-3">
                <p className="font-bold text-blue-800 mb-1">Related Concepts</p>
                <p className="text-blue-900">multitasking, busy schedule, priorities</p>
              </div>
              <div className="rounded-xl bg-purple-50 border border-purple-200 p-3">
                <p className="font-bold text-purple-800 mb-1">Contexts</p>
                <p className="text-purple-900">work, family life, studying</p>
              </div>
            </div>
            <div className="rounded-xl bg-amber-50 border border-amber-200 p-3 text-xs">
              <p className="font-bold text-amber-900 mb-1">Associated Words</p>
              <p className="text-amber-950">deadline · schedule · responsibilities</p>
            </div>
          </div>
        )}

        {tab === 'pdf' && (
          <div className="space-y-3.5 text-left">
            <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2 mb-2.5">
                <span className="font-nunito font-bold text-sm text-brand-navy">PlanWise ESL · Vocabulary Review PDF</span>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Print-ready
                </span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed mb-3">
                Sent straight to your student after class—color-coded by part of speech with <strong>phonetic pronunciation</strong>, <strong>4 real-world examples</strong> per word, <strong>word families</strong>, <strong>common collocations</strong>, <strong>usage notes</strong>, and <strong>5-part semantic maps</strong>.
              </p>
              <div className="flex flex-wrap gap-1.5 text-[11px] font-semibold">
                <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800">Nouns</span>
                <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">Verbs</span>
                <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800">Adjectives</span>
                <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">Adverbs</span>
              </div>
            </div>
            <div className="flex items-center justify-between gap-2 rounded-xl bg-brand-navy/5 p-3 text-xs">
              <span className="flex items-center gap-1.5 font-semibold text-brand-navy">
                <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                Plus zero-login student dashboard &amp; flashcards
              </span>
              <Link href="/student-experience" className="font-bold text-brand-navy underline decoration-brand-yellow decoration-2 whitespace-nowrap">
                See details →
              </Link>
            </div>
          </div>
        )}

        {/* Footer bar inside preview */}
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Generated in 1–2 min · Checked section by section</span>
          <Link href="/esl-lessons" className="font-semibold text-brand-navy hover:underline">
            Download a real PDF free →
          </Link>
        </div>
      </div>
    </div>
  );
}
