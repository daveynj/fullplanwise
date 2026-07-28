import React, { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { useFreeTrial } from '@/hooks/use-free-trial';
import { LessonContent } from '@/components/lesson/lesson-content';
import { format } from 'date-fns';
import {
  Clock, Target, MonitorSmartphone,
  CheckCircle2, Sparkles, XCircle, Menu, X, Lock as LockIcon, ArrowRight
} from 'lucide-react';
import {
  homepageMeta, hero, showcase, problem, features, steps,
  pricing, testimonials, finalCta, faq, footer, FeatureIcon, FaqAnswerPart,
} from '@shared/homepage-content';

const featureIcons: Record<FeatureIcon, React.ComponentType<{ className?: string }>> = {
  clock: Clock,
  target: Target,
  monitor: MonitorSmartphone,
};

const FreeTrialBanner = () => {
  const { isFreeTrialActive, freeTrialEndDate } = useFreeTrial();

  if (!isFreeTrialActive || !freeTrialEndDate) {
    return null;
  }

  const endDate = format(freeTrialEndDate, "MMMM do, yyyy");

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

export default function LandingPage() {
  const { isFreeTrialActive, freeTrialEndDate } = useFreeTrial();
  const endDate = freeTrialEndDate ? format(freeTrialEndDate, "MMMM do") : '';
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [parsedLessonContent, setParsedLessonContent] = useState<any>(null);

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
        description={homepageMeta.description}
        keywords={homepageMeta.keywords}
        canonicalUrl={homepageMeta.canonicalUrl}
      />
      <FreeTrialBanner />

      {/* Header/Navigation */}
      <header className="bg-white/90 backdrop-blur border-b border-slate-100 sticky top-0 z-50">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src="/PlanWise_ESL_logo.png" alt="PlanwiseESL AI-powered ESL lesson generator logo" className="h-14 sm:h-16 w-auto" />
            <span className="text-lg sm:text-xl font-nunito font-bold text-brand-navy tracking-tight">PLAN WISE ESL</span>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-2">
            <Link href="/blog">
              <Button variant="ghost" className="text-brand-navy/80 hover:text-brand-navy hover:bg-amber-50 rounded-full px-5">
                Blog
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="ghost" className="text-brand-navy/80 hover:text-brand-navy hover:bg-amber-50 rounded-full px-5">
                Login
              </Button>
            </Link>
            <Link href="/auth?register=true">
              <Button variant="brand" className="rounded-full px-6 shadow-md shadow-brand-yellow/30">Sign Up Free</Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-brand-navy hover:bg-amber-50 rounded-full"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </nav>

        {/* Mobile Navigation Menu */}
        <div className={`md:hidden bg-white border-t border-slate-100 px-6 space-y-3 transition-all duration-300 ease-in-out overflow-hidden ${mobileMenuOpen ? 'max-h-96 opacity-100 py-4' : 'max-h-0 opacity-0 py-0'}`}>
          <Link href="/blog" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-brand-navy hover:bg-amber-50 rounded-full">
              Blog
            </Button>
          </Link>
          <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="ghost" className="w-full justify-start text-brand-navy hover:bg-amber-50 rounded-full">
              Login
            </Button>
          </Link>
          <Link href="/auth?register=true" onClick={() => setMobileMenuOpen(false)}>
            <Button variant="brand" className="w-full rounded-full">
              Sign Up Free
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-amber-50/80 via-orange-50/40 to-white py-16 md:py-24 px-6">
        {/* Soft decorative blobs */}
        <div aria-hidden="true" className="pointer-events-none absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-yellow/10 blur-3xl" />
        <div aria-hidden="true" className="pointer-events-none absolute top-1/2 -left-32 w-80 h-80 rounded-full bg-amber-200/20 blur-3xl" />

        <div className="container mx-auto max-w-6xl relative">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Hero Text Column */}
            <div className="text-center lg:text-left lg:w-1/2">
              <span className="inline-block bg-white border border-amber-200 text-amber-800 text-sm font-semibold px-4 py-1.5 rounded-full mb-6 shadow-sm">
                For Preply, italki, Cambly & independent tutors
              </span>
              <h1 className="text-4xl md:text-5xl font-nunito font-bold mb-5 leading-tight tracking-tight">
                {hero.heading}
              </h1>
              <p className="text-lg md:text-xl mb-8 text-slate-600 leading-relaxed">
                {hero.subheading}
              </p>

              {/* Quick benefit list */}
              <ul className="mb-8 space-y-3 mx-auto lg:mx-0 max-w-md text-left">
                {hero.benefits.map((benefit, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <span className="mt-0.5 flex-shrink-0 w-6 h-6 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                      <CheckCircle2 className="h-4 w-4 text-amber-700" />
                    </span>
                    <span className="text-slate-700">{benefit}</span>
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-3">
                <Link href="/auth?register=true">
                  <Button size="lg" variant="brand" className="font-semibold px-8 rounded-full shadow-lg shadow-brand-yellow/40 w-full sm:w-auto">
                    {hero.primaryCta} <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
                <a href="#features">
                  <Button size="lg" variant="outline" className="border-brand-navy/20 text-brand-navy hover:bg-brand-navy/5 px-8 rounded-full w-full sm:w-auto">
                    {hero.secondaryCta}
                  </Button>
                </a>
              </div>
              <p className="flex items-center justify-center lg:justify-start text-slate-500 text-sm mb-8">
                <LockIcon className="h-3 w-3 mr-1.5" />
                {trialNote}
              </p>

              <div className="hidden lg:block max-w-md">
                <div className="rounded-2xl overflow-hidden shadow-xl shadow-amber-900/10 ring-1 ring-slate-900/5">
                  <iframe
                    className="w-full aspect-video"
                    src={hero.videoUrl}
                    title="YouTube video player"
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                    referrerPolicy="strict-origin-when-cross-origin"
                    allowFullScreen
                  ></iframe>
                </div>
              </div>
            </div>

            {/* Hero Image/Preview Column */}
            <div className="lg:w-1/2 w-full max-w-xl">
              <div className="rounded-2xl overflow-hidden shadow-2xl shadow-amber-900/15 ring-1 ring-slate-900/5 bg-white">
                <img
                  src="/reading.PNG"
                  alt="ESL Lesson Preview"
                  className="w-full h-auto"
                />
                <div className="p-5 border-t border-slate-100">
                  <h3 className="text-lg font-nunito font-bold text-brand-navy">{hero.previewTitle}</h3>
                  <p className="text-slate-500 text-sm mt-1">{hero.previewText}</p>
                </div>
              </div>

              {/* Who it's for */}
              <div className="mt-6 bg-white/70 backdrop-blur rounded-2xl border border-amber-100 p-5">
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

      {/* Lesson Showcase Section */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-nunito font-bold mb-4 tracking-tight">{showcase.heading}</h2>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto leading-relaxed">
              {showcase.subheading}
            </p>
          </div>

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
                      <Button variant="outline" size="sm" className="border-white/40 text-white hover:bg-white/10 rounded-full">
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
                <LessonContent content={parsedLessonContent} />
              ) : (
                <div className="text-center py-12">
                  <p className="text-slate-500">Unable to load lesson preview. <Link href={`/lessons/${showcase.lessonId}`} className="text-brand-navy font-medium underline">Click here to view the full lesson.</Link></p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-12 text-center">
            <Link href="/auth?register=true">
              <Button size="lg" variant="brand" className="rounded-full px-10 shadow-lg shadow-brand-yellow/40">
                {showcase.cta}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Problem/Solution Section */}
      <section className="py-16 md:py-20 px-6 bg-gradient-to-b from-amber-50/60 to-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-nunito font-bold mb-4 text-center tracking-tight">{problem.heading}</h2>
          <p className="text-lg text-slate-600 mb-12 text-center leading-relaxed max-w-3xl mx-auto">
            {problem.intro}
          </p>

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
              <span className="absolute -top-3 right-6 bg-brand-yellow text-brand-navy text-xs font-bold px-3 py-1 rounded-full">THE EASY WAY</span>
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
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-16 md:py-20 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl md:text-4xl font-nunito font-bold text-center mb-14 tracking-tight">{features.heading}</h2>
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

      {/* How It Works Section */}
      <section className="py-16 md:py-20 px-6 bg-gradient-to-b from-amber-50/60 to-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl md:text-4xl font-nunito font-bold mb-14 tracking-tight">{steps.heading}</h2>
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
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 md:py-20 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-nunito font-bold text-center mb-14 tracking-tight">
            {pricing.heading}
          </h2>
          <div className="grid md:grid-cols-2 gap-6 items-stretch">
            {pricing.plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-3xl p-8 flex flex-col ${
                  plan.highlighted
                    ? 'bg-brand-navy text-white shadow-2xl shadow-brand-navy/30 relative'
                    : 'bg-gradient-to-b from-amber-50/50 to-white ring-1 ring-slate-900/5'
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
                <Link href={plan.ctaHref} className="mt-auto">
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
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-20 px-6 bg-gradient-to-b from-amber-50/60 to-white">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl md:text-4xl font-nunito font-bold text-center mb-14 tracking-tight">{testimonials.heading}</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {testimonials.items.map((t, i) => (
              <figure key={i} className="bg-white rounded-2xl p-7 ring-1 ring-slate-900/5 shadow-lg shadow-slate-900/5">
                <div className="text-brand-yellow text-4xl font-serif leading-none mb-3">"</div>
                <blockquote className="text-slate-700 italic leading-relaxed mb-5">{t.quote}</blockquote>
                <figcaption className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-full bg-brand-navy text-brand-yellow flex items-center justify-center font-nunito font-bold text-sm">
                    {t.initials}
                  </span>
                  <span className="text-slate-600 font-semibold text-sm">{t.author}</span>
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>

      {/* Final Call to Action Section */}
      <section className="py-20 px-6 bg-brand-navy text-white text-center relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-yellow/10 blur-3xl" />
        <div className="container mx-auto max-w-3xl relative">
          <h2 className="text-3xl md:text-4xl font-nunito font-bold mb-10 tracking-tight">{finalCta.heading}</h2>

          <div className="grid grid-cols-3 gap-4 mb-10 max-w-2xl mx-auto">
            {finalCta.stats.map((stat, i) => (
              <div key={i} className="bg-white/5 rounded-2xl py-5 px-2 ring-1 ring-white/10">
                <p className="text-3xl md:text-4xl font-nunito font-bold text-brand-yellow">{stat.value}</p>
                <p className="text-xs md:text-sm text-white/70 mt-1">{stat.label}</p>
              </div>
            ))}
          </div>

          <p className="text-xl mb-10 text-white/80">
            {finalCta.lead}
          </p>

          <div className="flex flex-col items-center">
            <Link href="/auth?register=true">
              <Button size="lg" variant="brand" className="font-semibold px-10 rounded-full shadow-xl shadow-brand-yellow/30">
                {finalCta.cta} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <p className="text-sm mt-4 text-white/60 flex items-center justify-center">
              <LockIcon className="h-3 w-3 mr-1.5" />
              {finalTrialNote}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-20 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-nunito font-bold mb-4 tracking-tight">
              {faq.heading}
            </h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">
              {faq.subheading}
            </p>
          </div>

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

      {/* Footer */}
      <footer className="bg-brand-navy text-white py-14">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/PlanWise_ESL_logo.png" alt="PlanwiseESL Logo" className="h-16 w-auto" />
                <span className="text-xl font-nunito font-bold">PlanwiseESL</span>
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

            {/* Quick Links */}
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

            {/* About */}
            <div>
              <h3 className="text-sm font-nunito font-bold uppercase tracking-wider text-brand-yellow mb-4">About</h3>
              <ul className="space-y-2.5 text-sm text-white/60">
                {footer.aboutItems.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
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
    </div>
  );
}
