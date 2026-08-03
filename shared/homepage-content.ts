/**
 * Single source of truth for homepage (landing page) copy.
 * Imported by BOTH the React landing page (client/src/pages/landing-page.tsx)
 * and the server prerender (server/landing-prerender.ts) so crawler-visible
 * HTML always matches the hydrated page.
 */

export interface FaqLinkPart {
  type: 'link';
  href: string;
  text: string;
}
export interface FaqTextPart {
  type: 'text';
  text: string;
}
export type FaqAnswerPart = FaqTextPart | FaqLinkPart;

export const homepageMeta = {
  title: 'Plan Wise ESL: AI Lesson Generator for ESL Teachers',
  description:
    'Transform your lesson planning from exhausting to effortless. Go from 3-hour prep sessions to 3-minute lesson generation. CEFR-aligned, ready-to-teach ESL lessons with vocabulary, reading, grammar, and activities.',
  keywords: [
    'ESL teacher burnout solution',
    'AI ESL lesson generator',
    'lesson planning takes too long',
    'how to plan ESL lessons faster',
    'tired of ESL lesson prep',
    'save time ESL teaching',
    'ESL lesson planning software',
    'automated ESL lessons',
    'CEFR lesson planning',
    'ESL teacher productivity',
    'AI for English teachers',
  ],
  canonicalUrl: 'https://planwiseesl.com',
};

export const hero = {
  heading: 'Steal back hours of prep. Get a complete ESL lesson in 45 seconds',
  subheading:
    'Built for online ESL tutors on Preply, italki, Cambly and beyond. CEFR-based, fully editable, and ready to teach in your next class.',
  benefits: [
    'Save 20–60 minutes per lesson prep.',
    'Look more professional with structured, engaging materials.',
    'Tailor lessons to any student\u2019s level, interests, or goals instantly.',
  ],
  audienceIntro: "Who it's for:",
  audience: [
    'Online ESL tutors on Preply, italki, Cambly, and private ESL tutors.',
    'Language schools and small agencies.',
  ],
  primaryCta: 'Start Your Transformation',
  secondaryCta: 'Explore Features',
  noCardNote: 'No credit card required',
  freeLessonsNote: '5-day free trial',
  previewTitle: 'AI-Generated Lessons in Minutes',
  previewText: 'Complete lessons with reading, vocabulary, activities, and assessments.',
  videoUrl: 'https://www.youtube.com/embed/pcLlwL5sNK0',
};

export const showcase = {
  heading: 'See Real AI-Generated Lessons',
  subheading:
    'Each lesson comes with a complete suite of activities - from warm-up exercises to vocabulary practice, reading comprehension, interactive activities, and assessment tools.',
  sampleLabel: 'Sample Lesson',
  viewFullLabel: 'View Full Lesson',
  cta: 'Try It For Free',
  lessonId: 1006,
};

export const problem = {
  heading: 'Tired of Spending Hours on Lesson Prep?',
  intro:
    'Online ESL teachers face the constant challenge of creating CEFR-aligned, engaging, and individualized lessons for one-on-one sessions. Finding the right materials takes time you could be spending teaching.',
  traditional: {
    title: 'Traditional Lesson Planning',
    items: [
      '1-2 hours of hunting for materials online',
      'Piecing together activities from multiple sources',
      "Adapting content to match your student's level",
      'Less time for actual teaching or more students',
    ],
  },
  withPlanwise: {
    title: 'With Plan Wise ESL',
    items: [
      'Complete lessons generated in just 3 minutes',
      'All sections perfectly integrated and cohesive',
      'Perfect CEFR level matching for your students',
      'Teach more students and increase your income',
    ],
  },
  conclusion:
    'Plan Wise ESL is your solution \u2013 generate complete, ready-to-teach lessons in minutes.',
};

export type FeatureIcon = 'clock' | 'target' | 'monitor';

export const features = {
  heading: 'Everything You Need for Effective Online Lessons',
  items: [
    {
      icon: 'clock' as FeatureIcon,
      title: '3-Minute Lesson Generation',
      text: 'Generate a full, ready-to-go lesson \u2013 complete with warm-up, vocabulary, activities, and more \u2013 in under 3 minutes, freeing you to focus on student interaction and personalized feedback, not tedious prep.',
    },
    {
      icon: 'target' as FeatureIcon,
      title: 'CEFR Level Selection (A1-C2)',
      text: "Ensure lessons perfectly match your students' proficiency levels, ensuring every lesson perfectly targets their level and boosts their confidence.",
    },
    {
      icon: 'monitor' as FeatureIcon,
      title: 'Designed for Online Teaching',
      text: 'Lessons are structured for easy screen sharing, making screen sharing seamless and keeping your online students engaged from start to finish.',
    },
  ],
};

export const steps = {
  heading: 'Generate Lessons in 3 Simple Steps',
  items: [
    {
      number: 1,
      title: 'Select CEFR Level',
      text: 'Choose the appropriate level (A1-C2) for your student.',
    },
    {
      number: 2,
      title: 'Enter Your Topic',
      text: 'Provide the subject or theme for the lesson.',
    },
    {
      number: 3,
      title: 'Generate Lesson',
      text: 'Let our AI create a complete, ready-to-teach lesson.',
    },
  ],
};

export const pricing = {
  heading: 'Simple, Transparent Pricing',
  plans: [
    {
      name: 'Free',
      description: 'For exploring and occasional use.',
      price: '$0',
      priceSuffix: '',
      features: [
        'Access your saved lessons',
        'Explore the public lesson library',
        'Full access during your 5-day free trial',
      ],
      cta: 'Get Started',
      ctaHref: '/auth?register=true',
      highlighted: false,
    },
    {
      name: 'Unlimited',
      description: 'For active and professional teachers.',
      price: '$19.99',
      priceSuffix: '/month',
      features: [
        'Unlimited AI lesson generations',
        'Access to all lesson components',
        'Save and manage all your lessons',
        'Cancel anytime',
      ],
      cta: 'Go Unlimited',
      ctaHref: '/buy-credits',
      highlighted: true,
    },
  ],
};

export const testimonials = {
  heading: 'Loved by Online ESL Teachers',
  items: [
    {
      quote:
        'As an online ESL teacher, time is my most valuable asset. This software has been a game-changer! I can now create engaging, ready-to-teach lessons in minutes, freeing up hours that I can spend focusing on my students.',
      author: 'Sarah K., Online ESL Tutor',
      initials: 'SK',
    },
    {
      quote:
        "Finally, a lesson planning tool that truly understands the needs of online ESL teachers! The CEFR level alignment is fantastic, ensuring my students are always learning at the right level. It's incredibly easy to use for my one-on-one classes.",
      author: 'David L., Independent ESL Teacher',
      initials: 'DL',
    },
  ],
};

export const finalCta = {
  heading: 'Ready to Revolutionize Your Lesson Planning?',
  stats: [
    { value: '3', label: 'Minutes to Create Complete Lessons' },
    { value: '6+', label: 'Hours Saved Weekly' },
    { value: 'A1-C2', label: 'CEFR Levels Supported' },
  ],
  lead: 'Stop spending 3+ hours per lesson on preparation. Start teaching more and planning less.',
  leadEmphasis: '3+ hours per lesson',
  cta: 'Get Started for Free',
  freeLessonsNote: '5-day free trial included',
};

export const faq = {
  heading: 'Frequently Asked Questions',
  subheading: 'Everything you need to know about PlanwiseESL and AI-powered lesson planning',
  items: [
    {
      question: 'How does AI lesson planning save me time?',
      answer: [
        {
          type: 'text',
          text: 'Our AI generates complete CEFR-leveled lessons in under 2 minutes, including vocabulary cards, reading texts, comprehension questions, and discussion activities. What used to take 3+ hours now takes minutes, saving you 15+ hours weekly.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: 'Are the lessons really CEFR-aligned?',
      answer: [
        {
          type: 'text',
          text: "Yes! Our AI is specifically trained on CEFR standards (A1-C2) and creates content appropriate for each level. Vocabulary, grammar structures, and reading complexity are automatically adjusted to match your students' proficiency level.",
        },
      ] as FaqAnswerPart[],
    },
    {
      question: 'Can I specify what vocabulary to target?',
      answer: [
        {
          type: 'text',
          text: 'Yes! Before generating a lesson, you can specify particular vocabulary words you want the AI to focus on. This ensures the lesson targets exactly the language points your students need to practice.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: 'What topics can I create lessons about?',
      answer: [
        {
          type: 'text',
          text: 'Any topic! From business English and travel to current events and specialized subjects. Our AI draws from extensive knowledge to create engaging, relevant content for any subject your students need to learn. ',
        },
        {
          type: 'link',
          href: '/blog/19',
          text: 'Discover specialized niche ESL content generation',
        },
        { type: 'text', text: '.' },
      ] as FaqAnswerPart[],
    },
    {
      question: 'Is there a free trial?',
      answer: [
        {
          type: 'text',
          text: 'Yes! Every new account includes 5 days of unlimited lesson generation. No credit card required. This lets you experience how PlanwiseESL can transform your teaching before making any commitment. Once your trial ends, simply subscribe to keep generating lessons.',
        },
      ] as FaqAnswerPart[],
    },
    {
      question: 'How much does it cost after the free trial?',
      answer: [
        {
          type: 'text',
          text: 'After your 5-day free trial, the Unlimited plan is $19.99/month for unlimited AI lesson generations, and you can cancel anytime. Since most teachers save 15+ hours weekly, it pays for itself immediately.',
        },
      ] as FaqAnswerPart[],
    },
  ],
};

export const footer = {
  brandLine:
    'AI-powered ESL lesson generator created by ESL teacher Dave Jackson. Transform your teaching with lessons that engage students and save you 15+ hours weekly.',
  quickLinks: [
    { label: 'Start Free Trial', href: '/auth' },
    { label: 'ESL Teaching Blog', href: '/blog' },
    { label: "Dave's Story", href: '/blog/14' },
  ],
  aboutItems: ['Created by ESL Teacher', 'CEFR-Aligned Content', '15+ Hours Saved Weekly'],
  social: {
    linkedin: 'https://www.linkedin.com/in/davidjackson113',
    twitter: 'https://x.com/DaveTeacher1',
  },
  copyright: '\u00a9 2025 PlanwiseESL. Created by Dave Jackson, ESL Teacher.',
  tagline: 'Built for ESL Teachers, by an ESL Teacher',
};
