# ESL Teaching Platform

## Overview

This is a full-stack ESL (English as a Second Language) teaching platform designed for creating and managing customized language lessons. It integrates multiple AI services for intelligent lesson generation, grammar analysis, vocabulary enhancement, and comprehensive lesson management. The platform targets both teachers and administrators, aiming to provide an efficient and intelligent tool to streamline lesson planning and improve the quality of ESL education.

## User Preferences

Preferred communication style: Simple, everyday language.
User name: Dave Jackson (prefers Dave, not David).
Lesson sentence frames: Dave is happy with them as they are (October 2026), so don't rework them unless he asks.
Social media: LinkedIn - www.linkedin.com/in/davidjackson113, X (Twitter) - @DaveTeacher1

## System Architecture

### UI/UX Decisions
- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components, utilizing Radix UI primitives for accessibility.
- **Design**: Responsive design with interactive components like drag-and-drop activities and visual grammar explanations.

### Technical Implementations
- **Backend**: Express.js with TypeScript on Node.js 20.
- **API**: RESTful endpoints with JSON responses.
- **Authentication**: Passport.js with local strategy and session management.
- **Database ORM**: Drizzle ORM for type-safe PostgreSQL operations.
- **Build Tools**: Vite (frontend), esbuild (backend).

### Feature Specifications
- **AI Service Integration**: Primary AI (GLM-5.2 via OpenRouter) for intelligent lesson generation, with dynamically loaded services.
- **Lesson Check**: Each new lesson is checked section by section before it is saved (server/services/lesson-check.ts and lesson-repair.ts). Slips with one clear fix are fixed in place; a missing, broken or incomplete section (fewer than 5 words, 3 sentence frames, 5 discussion or quiz questions, or 5 usable fill-in-the-blank gaps) is requested again on its own, once. A section that is still broken is left out and the failure is logged with "Lesson repair FAILED".
- **Lesson Generation**: Supports CEFR levels A1-C2, various component types (warm-ups, vocabulary, reading, questions, discussion), and Semantic Maps. Lessons are generated rapidly (~2 minutes) due to optimized prompts and streamlined processes. Grammar Spotlight is retired: new lessons don't get one, and old lessons that have one still show it.
- **Idioms & Phrasal Verbs**: An optional section, turned on by a switch on the lesson form (on by default from B1, off at A2, never offered at A1). It is written by its own AI request after the lesson check, using the finished reading (server/services/lesson-expressions.ts; level rules in shared/lesson-expressions.ts). Its tab sits between Comprehension and Sentence Frames and only appears in lessons that contain the section, so lessons made without it are unchanged.
- **Vocabulary Tracking**: Tracks student vocabulary to prevent AI from teaching duplicate words, ensuring progressive vocabulary building. Learned words are used naturally in reading texts without forced inclusion.
- **Enhanced Image Generation**: Generates contextual and pedagogically aligned images with detailed prompts (40-80 words for vocabulary, 50-80 words for discussion).
- **User Management**: Role-based access (Teacher, Admin), credit system, subscription support, and password reset.
- **Content Enhancement**: Includes vocabulary downloads (HTML), PDF generation, and interactive elements.
- **Lesson Sharing**: Teachers can share lessons via public URLs.
- **Blog System**: SEO-optimized blog with two distinct layouts:
  - **Blog Index**: 3-column responsive grid (mobile-first design), semantic HTML5 with <article> tags, standard pagination (not infinite scroll), and integrated search
  - **Single Post**: 70/30 sidebar-right layout with breadcrumbs, Table of Contents (auto-generated from headings), related posts, popular posts sidebar, and search functionality
  - **Admin Management**: Rich text editor (Tiptap) for content creation with XSS protection via DOMPurify
  - **URL Structure**: Slug-based URLs (/blog/post-slug) instead of numeric IDs for better SEO
  - **SEO Metadata**: Dedicated metaTitle and metaDescription fields in CMS with character counters (60/160 chars)
  - **Sitemap**: Dynamic sitemap.xml generation listing all blog posts and static pages for search engine crawling
- **SEO**: Comprehensive on-page SEO including breadcrumb navigation, proper heading hierarchy (h1-h3), meta descriptions, canonical URLs, semantic HTML5 tags (main, nav, aside, article), slug-based URLs, and dynamic sitemap generation.
  - **404 Handling**: Server-side 404 status codes for deleted/non-existent blog posts and private lessons (fixes Google Search Console "soft 404" errors)
  - **Canonical URLs**: Self-referencing absolute canonical URLs (https://planwiseesl.com/...) with query parameter stripping (fixes "duplicate without canonical" errors)
  - **Sitemap Filtering**: Dynamic sitemap only includes published blog posts and public pages (excludes admin pages and unpublished content)

### System Design Choices
- **Data Flow**: Manages user authentication, AI-powered lesson creation, grammar analysis, content storage, interactive display, and export options.
- **Vocabulary Management**: Lessons stored in a library; student-lesson associations track assignments without duplicating data. Vocabulary is automatically extracted and managed upon lesson assignment and removal.
- **Lesson content format**: `lessons.content` is a `text` column holding single-encoded lesson JSON (`shared/lesson-content.ts`). The Drizzle column type decodes older double-encoded rows on read and always writes the canonical format — pass content to Drizzle as an object, never pre-`JSON.stringify` it. Raw SQL scripts must use the shared decode/encode helpers.
- **Deployment**: Frontend builds to `dist/public`, backend bundles to `dist/index.js`, with static file serving.
- **Environment**: Utilizes Replit Secrets for sensitive data and separate configurations for development/production.
- **Database cutover safety**: Runtime, Stripe sync, and Drizzle use the shared database selector. Keep `PLANWISE_DATABASE_SOURCE=legacy` until the managed copy is verified. Managed mode also requires the matching `PLANWISE_MANAGED_DATABASE_SIGNATURE`; do not run legacy root-level database helper scripts during cutover.
- **Scaling**: Designed for autoscale deployment, connection pooling, and lazy loading of AI services.
- **Performance Optimization**: Employs a response-first pattern for lesson generation, pre-caching, and selective field queries to manage large content efficiently.

## External Dependencies

- **AI Services**:
    - GLM-5.2 by Z-AI (via OpenRouter) - Lesson content generation.
    - Replicate (FLUX Schnell model by Black Forest Labs) - Image generation.
- **Payment & Communication**:
    - Stripe - Subscription and payment processing.
- **Infrastructure**:
    - Neon Database - Serverless PostgreSQL hosting.
    - @neondatabase/serverless - WebSocket support for database connections.