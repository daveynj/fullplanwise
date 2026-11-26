import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Link, useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { InteractiveProductPreview } from '@/components/landing/interactive-product-preview';
import { useFreeTrial } from '@/hooks/use-free-trial';
import { trackCta } from '@/lib/analytics';
import { formatTrialEndDate } from '@shared/free-trial-date';
import {
  Clock, Target, MonitorSmartphone, Users, Layers, ShieldCheck,
  CheckCircle2, Sparkles, XCircle, Menu, X, Lock as LockIcon, ArrowRight, Play, Quote,
} from 'lucide-react';
import {
  homepageMeta, hero, definition, personalisation, showcase, problem, features, science, steps,
  founder, pricing, verifiableProof, finalCta, faq, footer, FeatureIcon, FaqAnswerPart,
} from '@shared/homepage-content';
import { publicNav } from '@shared/marketing-pages';

// The lesson renderer is large; load it separately so it isn't part of the
// homepage's first download.
const LessonContent = lazy(() =>
  import('@/components/lesson/lesson-content').then((m) => ({ default: m.LessonContent })),
);

/**
 * Shows the YouTube thumbnail and only loads the real player when clicked.
 * An embedded YouTube player downloads a lot of script on page load, which
 * slows the homepage for every visitor, including those who never press play.
 */
const HeroVideo = ({ url }: { url: string }) => {
  const [playing, setPlaying] = useState(false);
  const videoId = url.match(/(?:embed\/|v=|youtu\.be\/)([\w-]{11})/)?.[1];

  if (playing || !videoId) {
    return (
      <iframe
        className="w-full aspect-video"
        src={videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : url}
        title="YouTube video player"
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        referrerPolicy="strict-origin-when-cross-origin"
        allowFullScreen
      ></iframe>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className="group relative block w-full aspect-video bg-slate-900"
      aria-label={`Play video: ${hero.videoTitle}`}
    >
      <img
        src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        width={480}
        height={360}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <span className="absolute inset-0 flex items-center justify-center">
        <span className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600 shadow-lg transition-transform group-hover:scale-110">
          <Play className="h-7 w-7 translate-x-0.5 fill-white text-white" />
        </span>
      </span>
    </button>
  );
};

const featureIcons: Record<FeatureIcon, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  target: Target,
  monitor: MonitorSmartphone,
  users: Users,
  layers: Layers,
  shield: ShieldCheck,
};

const FreeTrialBanner = () => {
  const { isFreeTrialActive, freeTrialEndDate } = useFreeTrial();

  if (!isFreeTrialActive || !freeTrialEndDate) {
    return null;
  }

  const endDate = formatTrialEndDate(freeTrialEndDate);

  return (
    <div className="bg-brand-yellow text-brand-navy text-center py-3 px-4 font-semibold">
      🎉 <span className="font-bold">Limited Time Offer:</span> Get unlimited lesson generations for FREE until {endDate}!
    </div>
  );
};

function FaqAnswer({ parts }: { parts: FaqAnswerPart[] }) {
  return (
    <p className="text-slate-600 leading-relaxed">
      {parts.map((part, i) =>
        part.type === 'link' ? (
          <Link key={i} href={part.href} className="text-brand-navy font-medium underline decoration-brand-yellow decoration-2 underline-offset-2 hover:text-brand-navy-light">
            {part.text}
          </Link>
        ) : (
          <span key={i}>{part.text}</span>
        )
      )}
    </p>
  );
}

/** The main call to action: always the same destination, tracked by where it sits on the page. */
function TrialButton({ location, label, className = '', dark = false }: { location: string; label: string; className?: string; dark?: boolean }) {
  return (
    <Link href="/auth?register=true" onClick={() => trackCta(location, label)}>
      <Button
        size="lg"
        variant="brand"
        className={`font-semibold px-8 rounded-full ${dark ? 'shadow-xl shadow-brand-yellow/30' : 'shadow-lg shadow-brand-yellow/40'} ${className}`}
      >
        {label} <ArrowRight className="ml-2 h-4 w-4" />
      </Button>
    </Link>
  );
}

function SectionHeading({ children, sub }: { children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-nunito font-bold tracking-tight">{children}</h2>
      {sub && <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed mt-4">{sub}</p>}
    </div>
  );
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="font-semibold text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-4">
      {children}
    </Link>
  );
}

export default function LandingPage() {
  const { isFreeTrialActive, freeTrialEndDate } = useFreeTrial();
  const endDate = freeTrialEndDate ? formatTrialEndDate(freeTrialEndDate, { withYear: false }) : '';
  const [, setLocation] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [parsedLessonContent, setParsedLessonContent] = useState<any>(null);
  const [showStickyCta, setShowStickyCta] = useState(false);
  const [monthlyLessons, setMonthlyLessons] = useState(20);
  const [heroTopic, setHeroTopic] = useState('');
  const [heroLevel, setHeroLevel] = useState<'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'>('B2');

  const handleHeroLessonStart = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = heroTopic.trim();
    trackCta('hero-builder', cleaned ? `Build ${heroLevel} lesson` : hero.primaryCta);
    if (cleaned) {
      const target = `/generate?topic=${encodeURIComponent(cleaned)}&level=${encodeURIComponent(heroLevel)}`;
      setLocation(`/auth?register=true&redirect=${encodeURIComponent(target)}`);
    } else {
      setLocation('/auth?register=true');
    }
  };

  // Fetch live lesson data for the showcase
  const { data: lesson, isLoading: isLessonLoading } = useQuery<any>({
    queryKey: [`/api/lessons/${showcase.lessonId}`],
    staleTime: 1000 * 60 * 60, // Cache for 1 hour
    retry: false,
  });

  // Parse lesson content exactly like full-screen-lesson-page does
  useEffect(() => {
    if (lesson && lesson.content) {
      try {
        if (typeof lesson.content === 'string') {
          const parsed = JSON.parse(lesson.content);
          setParsedLessonContent({
            ...parsed,
            grammarSpotlight: lesson.grammarSpotlight
          });
        } else {
          setParsedLessonContent({
            ...lesson.content,
            grammarSpotlight: lesson.grammarSpotlight
          });
        }
      } catch (e) {
        console.error('Error parsing lesson content:', e);
      }
    }
  }, [lesson]);

  // On phones, keep a "try it free" button in reach once the hero has scrolled away.
  useEffect(() => {
    const onScroll = () => setShowStickyCta(window.scrollY > 700);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const trialNote = isFreeTrialActive
    ? `${hero.noCardNote} • Unlimited lessons until ${endDate}`
    : `${hero.noCardNote} • ${hero.freeLessonsNote}`;

  const finalTrialNote = isFreeTrialActive
    ? `${hero.noCardNote} • Unlimited lessons until ${endDate}`
    : `${hero.noCardNote} • ${finalCta.freeLessonsNote}`;

  return (
    <div className="flex flex-col min-h-screen font-open-sans bg-white text-brand-navy antialiased">
      <SEOHead
        title={homepageMeta.title}
        exactTitle
        description={homepageMeta.description}
        keywords={homepageMeta.keywords}
        canonicalUrl={homepageMeta.canonicalUrl}
        ogImage={homepageMeta.imagePath}
        ogImageAlt={homepageMeta.imageAlt}
      />
      <FreeTrialBanner />

      {/* Header/Navigation */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-100 sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <Link href="/" className="flex items-center gap-2">
            <img src="/PlanWise_ESL_logo.png" alt="PlanWise ESL logo" className="h-14 sm:h-16 w-auto" />
            <span className="text-lg sm:text-xl font-nunito font-bold text-brand-navy tracking-tight uppercase whitespace-nowrap">PlanWise ESL</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-0.5 xl:gap-2">
            {publicNav.map((item) => (
              <Link key={item.href} href={item.href}>
                <Button variant="ghost" className="text-brand-navy/80 hover:text-brand-navy hover:bg-amber-50 rounded-full px-2.5 xl:px-4">
                  {item.label}
                </Button>
              </Link>
            ))}
            <Link href="/auth">
              <Button variant="ghost" className="text-brand-navy/80 hover:text-brand-navy hover:bg-amber-50 rounded-full px-2.5 xl:px-4">
                Login
              </Button>
            </Link>
            <Link href="/auth?register=true" onClick={() => trackCta('header', 'Sign Up Free')}>
              <Button variant="brand" className="rounded-full px-5 xl:px-6 shadow-md shadow-brand-yellow/30">Sign Up Free</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="lg:hidden p-2 text-brand-navy hover:bg-amber-50 rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile Navigation Menu */}
        <div className={`lg:hidden bg-white border-t border-slate-100 px-6 space-y-3 transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-[32rem] opacity-100 py-4' : 'max-h-0 opacity-0 py-0'}`}>
          {publicNav.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileMenuOpen(false)}>
              <Button variant="ghost" className="w-full justify-start text-brand-navy hover:bg-amber-50 rounded-full">
                {item.label}
              </Button>
            </Link>
          ))}
          <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-brand-navy hover:bg-amber-50 rounded-full">
              Login
            </Button>
          </Link>
          <Link href="/auth?register=true" onClick={() => { setMobileMenuOpen(false); trackCta('mobile-menu', 'Sign Up Free'); }}>
            <Button variant="brand" className="w-full rounded-full">
              Sign Up Free
            </Button>
          </Link>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-white pt-12 pb-16 md:pt-20 md:pb-20 px-6">
          <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-yellow/10 blur-3xl" />
          <div aria-hidden="true" className="pointer-events-none absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-amber-200/20 blur-3xl" />

          <div className="container mx-auto max-w-6xl relative">
            <div className="grid lg:grid-cols-2 items-center gap-12">
              <div className="text-center lg:text-left">
                <span className="inline-block bg-white border border-amber-200 text-amber-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 shadow-sm">
                  {hero.badge}
                </span>
                <h1 className="text-4xl md:text-5xl font-nunito font-bold mb-5 leading-tight tracking-tight">
                  {hero.heading}
                </h1>
                <p className="text-lg md:text-xl mb-8 text-slate-600 leading-relaxed">
                  {hero.subheading}
                </p>

                <ul className="mb-8 space-y-3 mx-auto lg:mx-0 max-w-lg text-left">
                  {hero.benefits.map((benefit, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                        <CheckCircle2 className="h-4 w-4 text-amber-700" />
                      </span>
                      <span className="text-slate-700">{benefit}</span>
                    </li>
                  ))}
                </ul>

                {/* Interactive Hero Lesson Starter: carries topic + level straight into /generate after 3-field signup */}
                <form
                  onSubmit={handleHeroLessonStart}
                  className="mb-4 rounded-2xl bg-white p-4 sm:p-5 shadow-xl shadow-brand-navy/10 ring-1 ring-amber-200/90 text-left"
                >
                  <label htmlFor="hero-topic-input" className="block text-xs font-bold uppercase tracking-wider text-amber-800 mb-2">
                    Try it on your next student’s topic
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <input
                      id="hero-topic-input"
                      type="text"
                      value={heroTopic}
                      onChange={(e) => setHeroTopic(e.target.value)}
                      placeholder="e.g. Job interviews, Football marketing, Travel..."
                      className="flex-1 rounded-xl border border-slate-200 bg-slate-50/70 px-3.5 py-2.5 text-sm text-brand-navy placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-yellow focus:bg-white"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      variant="brand"
                      className="font-bold px-6 rounded-xl shadow-md shadow-brand-yellow/40 whitespace-nowrap"
                    >
                      {heroTopic.trim() ? `Build ${heroLevel} Lesson` : hero.primaryCta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1" role="group" aria-label="Choose CEFR level">
                      {(['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const).map((lvl) => (
                        <button
                          key={lvl}
                          type="button"
                          onClick={() => setHeroLevel(lvl)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                            heroLevel === lvl
                              ? 'bg-brand-navy text-brand-yellow'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-brand-navy'
                          }`}
                        >
                          {lvl}
                        </button>
                      ))}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {['Job Interviews', 'Work-Life Balance', 'AI at Work'].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setHeroTopic(preset)}
                          className="text-[11px] font-medium text-slate-500 hover:text-brand-navy bg-amber-50/70 hover:bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200/70 transition-colors"
                        >
                          {preset}
                        </button>
                      ))}
                    </div>
                  </div>
                </form>

                <p className="flex items-center justify-center lg:justify-start text-slate-500 text-sm">
                  <LockIcon className="h-3 w-3 mr-1.5" />
                  {trialNote} · Keep every lesson you make
                </p>
                <div className="mt-5 pt-4 border-t border-amber-200/70 flex flex-wrap items-center justify-center lg:justify-start gap-x-5 gap-y-2 text-xs text-slate-600">
                  <span className="font-semibold text-brand-navy">Built by Dave Jackson · 11 yrs teaching ESL · 2,000+ students</span>
                  <a href="#sample-lesson" className="underline decoration-brand-yellow decoration-2 underline-offset-2 font-medium text-brand-navy hover:text-brand-navy-light">
                    Scroll full B2 lesson ↓
                  </a>
                  <Link href="/esl-lessons" className="underline decoration-brand-yellow decoration-2 underline-offset-2 font-medium text-brand-navy hover:text-brand-navy-light">
                    Free lessons (no login) →
                  </Link>
                </div>
              </div>

              <div className="w-full max-w-xl mx-auto">
                <InteractiveProductPreview />

                <div className="mt-5 bg-white/80 backdrop-blur rounded-2xl border border-amber-100 p-5">
                  <p className="font-nunito font-bold text-sm uppercase tracking-wide text-amber-800 mb-2">{hero.audienceIntro}</p>
                  <ul className="space-y-1.5 text-slate-600 text-sm">
                    {hero.audience.map((item, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-brand-yellow mt-1">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* What is PlanWise ESL? A plain answer search engines and AI assistants can quote. */}
        <section id="what-is-planwise" className="px-6 py-14 bg-white">
          <div className="container mx-auto max-w-4xl">
            <div className="rounded-3xl bg-brand-navy text-white p-8 md:p-10 shadow-xl shadow-brand-navy/20">
              <h2 className="text-2xl md:text-3xl font-nunito font-bold mb-4 text-brand-yellow">{definition.heading}</h2>
              <p className="text-white/85 leading-relaxed text-lg">{definition.text}</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
                {finalCta.stats.map((stat, i) => (
                  <div key={i} className="bg-white/5 rounded-2xl py-4 px-3 ring-1 ring-white/10 text-center">
                    <p className="text-2xl md:text-3xl font-nunito font-bold text-brand-yellow">{stat.value}</p>
                    <p className="text-xs md:text-sm text-white/70 mt-1">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Personalisation: real course titles */}
        <section className="py-16 md:py-20 px-6 bg-gradient-to-b from-white to-amber-50/50">
          <div className="container mx-auto max-w-5xl">
            <SectionHeading sub={personalisation.intro}>{personalisation.heading}</SectionHeading>
            <div className="grid md:grid-cols-2 gap-6">
              {[personalisation.personal, personalisation.general].map((course, i) => (
                <div key={i} className={`rounded-2xl p-7 bg-white ring-1 shadow-lg ${i === 0 ? 'ring-brand-yellow/60 shadow-brand-yellow/10' : 'ring-slate-900/5 shadow-slate-900/5'}`}>
                  <h3 className="font-nunito font-bold text-sm uppercase tracking-wide text-amber-800 mb-4">{course.label}</h3>
                  <ol className="space-y-3">
                    {course.titles.map((title, j) => (
                      <li key={j} className="flex items-start gap-3 text-slate-700">
                        <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand-navy text-brand-yellow text-xs font-bold flex items-center justify-center mt-0.5">{j + 1}</span>
                        <span>{title}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
            <p className="text-center text-slate-600 mt-8">{personalisation.note}</p>
            <p className="text-center mt-4">
              <TextLink href={personalisation.href}>{personalisation.cta} →</TextLink>
            </p>
          </div>
        </section>

        {/* Live sample lesson */}
        <section id="sample-lesson" className="py-16 md:py-20 px-6 bg-white scroll-mt-24">
          <div className="container mx-auto max-w-6xl">
            <SectionHeading sub={showcase.subheading}>{showcase.heading}</SectionHeading>

            <div className="bg-white rounded-3xl ring-1 ring-slate-900/5 shadow-2xl shadow-slate-900/10 overflow-hidden">
              {lesson && (
                <div className="bg-gradient-to-r from-brand-navy to-brand-navy-light px-6 py-5 text-white">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wider text-brand-yellow font-semibold mb-1">{showcase.sampleLabel}</p>
                      <h3 className="font-nunito font-bold text-xl">{lesson.title}</h3>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="px-3 py-1 bg-brand-yellow text-brand-navy text-sm font-bold rounded-full">
                        CEFR {lesson.cefrLevel}
                      </span>
                      <Link href={`/lessons/${showcase.lessonId}`}>
                        <Button variant="outline" size="sm" className="bg-transparent border-white/40 text-white hover:bg-white/10 hover:text-white rounded-full">
                          {showcase.viewFullLabel} →
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-6 max-h-[800px] overflow-y-auto">
                {isLessonLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                      <div className="w-12 h-12 border-4 border-t-brand-yellow border-brand-yellow/30 rounded-full animate-spin mx-auto mb-4"></div>
                      <p className="text-slate-500">Loading lesson preview...</p>
                    </div>
                  </div>
                ) : parsedLessonContent ? (
                  <Suspense
                    fallback={
                      <div className="flex items-center justify-center py-12">
                        <div className="w-12 h-12 border-4 border-t-brand-yellow border-brand-yellow/30 rounded-full animate-spin"></div>
                      </div>
                    }
                  >
                    <LessonContent content={parsedLessonContent} />
                  </Suspense>
                ) : (
                  <div className="text-center py-12">
                    <p className="text-slate-500">Unable to load lesson preview. <Link href={`/lessons/${showcase.lessonId}`} className="text-brand-navy font-medium underline">Click here to view the full lesson.</Link></p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-12 text-center">
              <TrialButton location="sample-lesson" label={showcase.cta} className="px-10" />
            </div>
          </div>
        </section>

        {/* Why not just ChatGPT? */}
        <section className="py-16 md:py-20 px-6 bg-gradient-to-b from-amber-50/60 to-white">
          <div className="container mx-auto max-w-4xl">
            <SectionHeading sub={problem.intro}>{problem.heading}</SectionHeading>

            <div className="grid md:grid-cols-2 gap-6 mb-10">
              <div className="bg-white rounded-2xl p-7 ring-1 ring-slate-900/5 shadow-lg shadow-slate-900/5">
                <h3 className="text-lg font-nunito font-bold mb-4 text-red-600 flex items-center">
                  <Clock className="h-5 w-5 mr-2" /> {problem.traditional.title}
                </h3>
                <ul className="space-y-3">
                  {problem.traditional.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-600">
                      <XCircle className="h-5 w-5 text-red-400 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-white rounded-2xl p-7 ring-2 ring-brand-yellow/60 shadow-xl shadow-brand-yellow/10 relative">
                <span className="absolute -top-3 right-6 bg-brand-yellow text-brand-navy text-xs font-bold px-3 py-1 rounded-full">BUILT FOR TUTORS</span>
                <h3 className="text-lg font-nunito font-bold mb-4 text-emerald-600 flex items-center">
                  <Sparkles className="h-5 w-5 mr-2" /> {problem.withPlanwise.title}
                </h3>
                <ul className="space-y-3">
                  {problem.withPlanwise.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-slate-700">
                      <CheckCircle2 className="h-5 w-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <p className="text-lg font-nunito font-bold text-brand-navy text-center">
              {problem.conclusion}
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/compare"
                className="inline-flex items-center gap-2 rounded-full border-2 border-brand-navy bg-white px-5 py-2.5 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:bg-brand-navy hover:text-white"
              >
                Compare PlanWise ESL vs. ESL Joy, Twee, Fluentize, ESL Brains &amp; More
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/compare/student-memory-proof"
                className="inline-flex items-center gap-2 rounded-full border border-brand-yellow bg-amber-50 px-5 py-2.5 text-sm font-semibold text-brand-navy shadow-sm transition-colors hover:bg-brand-yellow"
              >
                See Live 4-Lesson Memory Proof (36 words, 0 duplicates)
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        {/* Free Public ESL Lesson Library (A1-C2) — No Login Required */}
        <section className="py-12 md:py-14 px-6 bg-brand-navy text-white">
          <div className="container mx-auto max-w-5xl text-center">
            <span className="inline-block rounded-full bg-brand-yellow/20 border border-brand-yellow/40 text-brand-yellow text-xs font-bold uppercase tracking-wider px-3.5 py-1 mb-3">
              100% Free • No Login Required
            </span>
            <h2 className="text-2xl md:text-3xl font-nunito font-bold mb-3">
              Browse Free Teacher-Led ESL Lessons by CEFR Level
            </h2>
            <p className="text-slate-200 max-w-2xl mx-auto mb-6 text-sm md:text-base">
              Inspect complete 8-stage lessons before signing up — complete with phonetic pronunciation, word families, collocations, levelled readings, semantic maps, and downloadable Vocabulary Review PDFs.
            </p>
            <div className="flex flex-wrap justify-center gap-2.5 mb-6">
              {(
                [
                  ["A1", "Beginner"],
                  ["A2", "Elementary"],
                  ["B1", "Intermediate"],
                  ["B2", "Upper Int."],
                  ["C1", "Advanced"],
                  ["C2", "Proficiency"],
                ] as const
              ).map(([lv, label]) => (
                <Link key={lv} href={`/esl-lessons/${lv.toLowerCase()}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-full border-white/25 bg-white/10 text-white hover:bg-brand-yellow hover:text-brand-navy hover:border-brand-yellow font-semibold"
                  >
                    {lv} {label}
                  </Button>
                </Link>
              ))}
            </div>
            <Link href="/esl-lessons">
              <Button variant="brand" size="lg" className="rounded-full px-8 shadow-lg shadow-brand-yellow/20">
                Browse All Free ESL Lessons →
              </Button>
            </Link>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-16 md:py-20 px-6 bg-white">
          <div className="container mx-auto max-w-5xl">
            <SectionHeading>{features.heading}</SectionHeading>
            <div className="grid md:grid-cols-3 gap-6">
              {features.items.map((feature, i) => {
                const Icon = featureIcons[feature.icon];
                return (
                  <div key={i} className="group bg-gradient-to-b from-amber-50/50 to-white rounded-2xl p-7 ring-1 ring-slate-900/5 hover:ring-brand-yellow/50 hover:shadow-xl hover:shadow-brand-yellow/10 transition-all duration-300">
                    <div className="w-14 h-14 rounded-2xl bg-brand-yellow/15 group-hover:bg-brand-yellow/25 flex items-center justify-center mb-5 transition-colors duration-300">
                      <Icon className="h-7 w-7 text-amber-700" />
                    </div>
                    <h3 className="text-xl font-nunito font-bold mb-3">{feature.title}</h3>
                    <p className="text-slate-600 leading-relaxed text-sm">{feature.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* The research-based lesson sequence */}
        <section className="py-16 md:py-20 px-6 bg-gradient-to-b from-amber-50/60 to-white">
          <div className="container mx-auto max-w-6xl">
            <SectionHeading sub={science.intro}>{science.heading}</SectionHeading>
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <ol className="grid sm:grid-cols-2 gap-4">
                {science.points.map((point, i) => (
                  <li key={i} className="bg-white rounded-2xl p-5 ring-1 ring-slate-900/5 shadow-sm">
                    <p className="flex items-center gap-2 font-nunito font-bold text-brand-navy">
                      <span className="w-7 h-7 rounded-full bg-brand-yellow text-brand-navy text-sm flex items-center justify-center flex-shrink-0">{i + 1}</span>
                      {point.title}
                    </p>
                    <p className="text-slate-600 text-sm leading-relaxed mt-2">{point.text}</p>
                  </li>
                ))}
              </ol>
              <figure className="rounded-2xl overflow-hidden shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 bg-white">
                <img
                  src={science.image}
                  alt={science.imageAlt}
                  width={1650}
                  height={900}
                  loading="lazy"
                  className="w-full h-auto"
                />
                <figcaption className="p-4 text-sm text-slate-500 border-t border-slate-100">{science.imageCaption}</figcaption>
              </figure>
            </div>
            <p className="text-center mt-10">
              <TextLink href={science.href}>{science.cta} →</TextLink>
            </p>
          </div>
        </section>

        {/* How it works: 3 steps */}
        <section className="py-16 md:py-20 px-6 bg-white">
          <div className="container mx-auto max-w-5xl text-center">
            <SectionHeading>{steps.heading}</SectionHeading>
            <div className="grid md:grid-cols-3 gap-10">
              {steps.items.map((step) => (
                <div key={step.number} className="flex flex-col items-center">
                  <div className="w-16 h-16 rounded-full bg-brand-navy text-brand-yellow flex items-center justify-center text-2xl font-nunito font-bold mb-5 shadow-lg shadow-brand-navy/20">
                    {step.number}
                  </div>
                  <h3 className="text-xl font-nunito font-bold mb-2">{step.title}</h3>
                  <p className="text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
            <div className="max-w-2xl mx-auto mt-12 rounded-2xl overflow-hidden shadow-xl shadow-amber-900/10 ring-1 ring-slate-900/5">
              <HeroVideo url={hero.videoUrl} />
            </div>
          </div>
        </section>

        {/* Founder */}
        <section className="py-16 md:py-20 px-6 bg-gradient-to-b from-amber-50/60 to-white">
          <div className="container mx-auto max-w-3xl">
            <SectionHeading>{founder.heading}</SectionHeading>
            <figure className="bg-white rounded-3xl p-8 md:p-10 ring-1 ring-slate-900/5 shadow-xl shadow-slate-900/5">
              <Quote className="h-8 w-8 text-brand-yellow mb-4" />
              <blockquote className="text-lg md:text-xl text-slate-700 leading-relaxed">{founder.quote}</blockquote>
              <figcaption className="flex items-center gap-4 mt-6">
                <span className="w-12 h-12 rounded-full bg-brand-navy text-brand-yellow flex items-center justify-center font-nunito font-bold">{founder.initials}</span>
                <span>
                  <span className="block font-nunito font-bold text-brand-navy">{founder.name}</span>
                  <span className="block text-sm text-slate-500">{founder.role}</span>
                </span>
              </figcaption>
            </figure>
            <p className="text-center mt-6">
              <TextLink href={founder.href}>{founder.linkLabel} →</TextLink>
            </p>
          </div>
        </section>

        {/* Inspect Real Proof (Zero Login) */}
        <section className="py-16 md:py-20 px-6 bg-white">
          <div className="container mx-auto max-w-5xl">
            <SectionHeading sub={verifiableProof.subheading}>{verifiableProof.heading}</SectionHeading>
            <div className="grid md:grid-cols-3 gap-6">
              {verifiableProof.items.map((item) => (
                <div
                  key={item.href}
                  className="flex flex-col justify-between bg-slate-50/70 rounded-2xl p-7 ring-1 ring-slate-900/5 shadow-sm"
                >
                  <div>
                    <span className="inline-block rounded-full bg-brand-yellow/25 text-brand-navy text-xs font-bold uppercase tracking-wider px-3 py-1 mb-4">
                      {item.badge}
                    </span>
                    <h3 className="text-xl font-nunito font-bold text-brand-navy mb-2">{item.title}</h3>
                    <p className="text-slate-600 text-sm leading-relaxed mb-5">{item.text}</p>
                  </div>
                  <Link
                    href={item.href}
                    className="inline-flex items-center gap-1.5 font-semibold text-sm text-brand-navy underline decoration-brand-yellow decoration-2 underline-offset-4 hover:text-brand-navy-light"
                  >
                    {item.linkLabel} <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing */}
        <section id="pricing" className="py-16 md:py-20 px-6 bg-gradient-to-b from-amber-50/60 to-white scroll-mt-24">
          <div className="container mx-auto max-w-4xl">
            <SectionHeading>{pricing.heading}</SectionHeading>

            {/* Interactive Tutor ROI & Prep-Time Savings Calculator */}
            <div className="mb-10 rounded-3xl bg-white p-6 md:p-8 ring-1 ring-amber-200/80 shadow-lg shadow-amber-900/5">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-amber-800">See what Unlimited saves you</p>
                  <label htmlFor="lessons-per-month" className="block font-nunito text-lg md:text-xl font-bold text-brand-navy mt-1">
                    How many classes do you teach per month? <span className="text-amber-700">{monthlyLessons}</span>
                  </label>
                </div>
                <input
                  id="lessons-per-month"
                  type="range"
                  min={5}
                  max={80}
                  step={5}
                  value={monthlyLessons}
                  onChange={(e) => setMonthlyLessons(Number(e.target.value))}
                  className="w-full md:w-64 accent-brand-navy cursor-pointer"
                />
              </div>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-100">
                  <p className="text-2xl md:text-3xl font-nunito font-bold text-brand-navy">
                    ${(19.99 / monthlyLessons).toFixed(2)}
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Cost per complete lesson</p>
                </div>
                <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-100">
                  <p className="text-2xl md:text-3xl font-nunito font-bold text-brand-navy">
                    {Math.round((monthlyLessons * 25) / 60)} hrs
                  </p>
                  <p className="text-xs text-slate-600 mt-1">Prep time saved / month</p>
                </div>
                <div className="rounded-2xl bg-amber-50/70 p-4 border border-amber-100">
                  <p className="text-2xl md:text-3xl font-nunito font-bold text-emerald-700">
                    $0
                  </p>
                  <p className="text-xs text-slate-600 mt-1">To try free for 5 days</p>
                </div>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6 items-stretch">
              {pricing.plans.map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-3xl p-8 flex flex-col ${
                    plan.highlighted
                      ? 'bg-brand-navy text-white shadow-2xl shadow-brand-navy/30 relative'
                      : 'bg-white ring-1 ring-slate-900/5'
                  }`}
                >
                  {plan.highlighted && (
                    <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-yellow text-brand-navy text-xs font-bold px-4 py-1.5 rounded-full whitespace-nowrap">
                      MOST POPULAR
                    </span>
                  )}
                  <h3 className={`font-nunito text-2xl font-bold text-center ${plan.highlighted ? 'text-brand-yellow' : ''}`}>{plan.name}</h3>
                  <p className={`text-center text-sm mt-1 mb-6 ${plan.highlighted ? 'text-white/70' : 'text-slate-500'}`}>{plan.description}</p>
                  <p className="text-4xl font-nunito font-bold text-center mb-6">
                    {plan.price}<span className={`text-lg font-normal ${plan.highlighted ? 'text-white/60' : 'text-slate-400'}`}>{plan.priceSuffix}</span>
                  </p>
                  <ul className={`space-y-3 text-sm mb-8 flex-1 ${plan.highlighted ? 'text-white/85' : 'text-slate-600'}`}>
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2.5">
                        <CheckCircle2 className={`h-4 w-4 flex-shrink-0 mt-0.5 ${plan.highlighted ? 'text-brand-yellow' : 'text-amber-600'}`} />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={plan.ctaHref} className="mt-auto" onClick={() => trackCta('pricing', plan.cta)}>
                    {plan.highlighted ? (
                      <Button variant="brand" className="w-full rounded-full shadow-lg shadow-brand-yellow/30">
                        {plan.cta}
                      </Button>
                    ) : (
                      <Button variant="outline" className="w-full rounded-full border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5">
                        {plan.cta}
                      </Button>
                    )}
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-center mt-8">
              <TextLink href="/pricing">Compare plans in detail →</TextLink>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-16 md:py-20 px-6 bg-white">
          <div className="container mx-auto max-w-4xl">
            <SectionHeading sub={faq.subheading}>{faq.heading}</SectionHeading>
            <div className="grid gap-4">
              {faq.items.map((item, i) => (
                <div key={i} className="bg-gradient-to-b from-amber-50/40 to-white rounded-2xl p-6 ring-1 ring-slate-900/5">
                  <h3 className="text-lg font-nunito font-bold text-brand-navy mb-2.5">
                    {item.question}
                  </h3>
                  <FaqAnswer parts={item.answer} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final Call to Action */}
        <section className="py-20 px-6 bg-brand-navy text-white text-center relative overflow-hidden">
          <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-yellow/10 blur-3xl" />
          <div className="container mx-auto max-w-3xl relative">
            <h2 className="text-3xl md:text-4xl font-nunito font-bold mb-6 tracking-tight">{finalCta.heading}</h2>
            <p className="text-xl mb-10 text-white/80">
              {finalCta.lead}
            </p>
            <div className="flex flex-col items-center">
              <TrialButton location="final" label={finalCta.cta} className="px-10" dark />
              <p className="text-sm mt-4 text-white/60 flex items-center justify-center">
                <LockIcon className="h-3 w-3 mr-1.5" />
                {finalTrialNote}
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-brand-navy text-white py-14 border-t border-white/10 pb-28 md:pb-14">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/PlanWise_ESL_logo.png" alt="PlanWise ESL logo" className="h-16 w-auto" />
                <span className="text-xl font-nunito font-bold">PlanWise ESL</span>
              </div>
              <p className="text-white/60 text-sm mb-5 max-w-md leading-relaxed">
                {footer.brandLine}
              </p>

              <div className="flex space-x-5">
                <a
                  href={footer.social.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-white/60 hover:text-brand-yellow transition-colors duration-200"
                  aria-label="Connect with Dave Jackson on LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  <span className="text-sm">LinkedIn</span>
                </a>

                <a
                  href={footer.social.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-white/60 hover:text-brand-yellow transition-colors duration-200"
                  aria-label="Follow Dave Jackson on X (Twitter)"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
                  </svg>
                  <span className="text-sm">X (Twitter)</span>
                </a>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-nunito font-bold uppercase tracking-wider text-brand-yellow mb-4">Quick Links</h3>
              <ul className="space-y-2.5 text-sm">
                {footer.quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="text-white/60 hover:text-white transition-colors duration-200">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h3 className="text-sm font-nunito font-bold uppercase tracking-wider text-brand-yellow mb-4">About</h3>
              <ul className="space-y-2.5 text-sm text-white/60">
                {footer.aboutItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-white/40 text-sm">
              {footer.copyright}
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="text-white/40 text-xs">{footer.tagline}</span>
            </div>
          </div>
        </div>
      </footer>

      {/* Sticky call to action on phones, once the hero has scrolled away */}
      <div
        className={`md:hidden fixed inset-x-0 bottom-0 z-40 p-3 bg-white/95 backdrop-blur border-t border-slate-200 transition-transform duration-300 ${showStickyCta ? 'translate-y-0' : 'translate-y-full'}`}
        aria-hidden={!showStickyCta}
      >
        <Link href="/auth?register=true" onClick={() => trackCta('sticky-mobile', hero.primaryCta)} tabIndex={showStickyCta ? 0 : -1}>
          <Button size="lg" variant="brand" className="w-full rounded-full font-semibold shadow-lg shadow-brand-yellow/40">
            {hero.primaryCta} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
        <p className="text-center text-xs text-slate-500 mt-1.5">{trialNote}</p>
      </div>
    </div>
  );
}
