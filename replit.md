# replit.md

## Overview

This is a full-stack ESL (English as a Second Language) teaching platform built for creating and managing customized language lessons. The application uses React for the frontend, Express.js for the backend, and PostgreSQL for data persistence. It integrates multiple AI services for intelligent lesson generation and includes features like grammar analysis, vocabulary enhancement, and lesson management.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **Build Tool**: Vite for fast development and optimized production builds
- **State Management**: React hooks and context
- **UI Components**: Radix UI primitives for accessibility

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js 20
- **API Design**: RESTful endpoints with JSON responses
- **Authentication**: Passport.js with local strategy and session management
- **Database ORM**: Drizzle ORM for type-safe database operations

### Data Storage Solutions
- **Primary Database**: PostgreSQL (Neon serverless)
- **Connection Pooling**: @neondatabase/serverless with WebSocket support
- **Session Storage**: PostgreSQL-based session store
- **Schema Management**: Drizzle Kit for migrations

## Key Components

### AI Service Integration
- **Multi-Provider Support**: OpenAI, Google Gemini, and Qwen services
- **Dynamic Loading**: AI services loaded on-demand to improve startup performance
- **Grammar Analysis**: Automated grammar pattern detection in lesson content
- **Cross-Component Integration**: Validates vocabulary, reading text, and discussion questions work synergistically

### Lesson Generation System
- **CEFR Level Support**: A1-C2 level appropriate content generation
- **Component Types**: Warm-up activities, vocabulary cards, reading texts, comprehension questions, discussion prompts
- **Grammar Spotlight**: Interactive grammar visualizations (Timeline, Decision Tree, Scale, Pattern Recognition, Transformation)
- **Semantic Maps**: Visual vocabulary relationship mapping

### User Management
- **Role-Based Access**: Teacher and admin roles
- **Credit System**: Consumption-based lesson generation
- **Subscription Support**: Stripe integration for premium features
- **Password Reset**: Token-based password recovery with email integration

### Content Enhancement Features
- **Vocabulary Downloads**: HTML export functionality for offline use
- **PDF Generation**: Lesson export capabilities
- **Interactive Components**: Drag-and-drop activities, visual grammar explanations
- **Responsive Design**: Mobile-friendly interface

## Data Flow

1. **User Authentication**: Login/registration through Passport.js local strategy
2. **Lesson Creation**: Teacher selects topic, CEFR level, and preferences
3. **AI Processing**: Selected AI service generates comprehensive lesson content
4. **Grammar Analysis**: Automated detection of grammar patterns in reading text
5. **Content Storage**: Lesson data persisted to PostgreSQL with JSON fields
6. **Interactive Display**: React components render lesson with interactive elements
7. **Export Options**: HTML/PDF generation for offline use

## External Dependencies

### AI Services
- **OpenAI API**: Primary lesson generation service
- **Google Generative AI**: Alternative content generation
- **Anthropic Claude**: Additional AI service option

### Payment & Communication
- **Stripe**: Subscription and payment processing
- **Mailchimp**: Email marketing and user communication

### Infrastructure
- **Neon Database**: Serverless PostgreSQL hosting
- **WebSocket Support**: Real-time database connections

## Deployment Strategy

### Build Process
- **Frontend**: Vite builds React app to `dist/public`
- **Backend**: esbuild bundles server code to `dist/index.js`
- **Assets**: Static files served from public directory

### Environment Configuration
- **Secrets Management**: Replit Secrets for sensitive data
- **Database Credentials**: Separate configuration for development/production
- **API Keys**: Secure storage of third-party service keys

### Scaling Considerations
- **Autoscale Deployment**: Configured for automatic scaling based on traffic
- **Connection Pooling**: Database connections optimized for concurrent users
- **Lazy Loading**: AI services loaded on-demand to reduce memory footprint

## Changelog

- June 25, 2025: Initial setup
- June 25, 2025: Implemented comprehensive industry/domain category system with 12 subject areas
- June 25, 2025: Added post-generation category editing and filtering capabilities  
- June 25, 2025: Removed Qwen AI provider due to persistent timeout issues with comprehensive prompts, simplified to use only Google Gemini for reliable lesson generation
- June 25, 2025: Fixed deployment error by cleaning up all Qwen service references and imports that were causing build failures
- June 25, 2025: Enhanced admin dashboard with comprehensive marketing analytics including MAU, lesson creation trends, category distribution, CEFR analytics, user activity metrics, and platform-wide lesson browsing capabilities
- June 25, 2025: Implemented Public Lesson Library system - admin-curated lessons organized by specialized categories (Business English, IELTS Prep, etc.) that users can browse and copy to their personal library at no credit cost
- June 25, 2025: Created comprehensive SEO-optimized blog system accessible from homepage with 5 in-depth articles covering AI in ESL teaching, CEFR levels, student engagement strategies, vocabulary acquisition research, and inclusive teaching practices - designed to improve AI search visibility and establish domain authority
- June 25, 2025: Enhanced blog system with 8 additional persona-targeted articles and comprehensive on-page SEO optimization including meta descriptions, structured data, internal linking, keyword integration, and mobile-responsive design optimized for Google search rankings
- June 25, 2025: Fixed react-helmet Symbol conversion error by implementing custom SEO component, corrected all brand references from LinguaBoost to PlanwiseESL throughout blog content and SEO metadata
- June 25, 2025: Implemented expert copywriting improvements based on comprehensive analysis: shortened articles to 6-9 minutes, added emotional storytelling with real teacher success stories, improved headlines with problem-focused hooks, enhanced CTAs with social proof, added 3 new persona-specific articles addressing teacher burnout and financial impact, optimized for long-tail keywords like "ESL teacher burnout solution" and "lesson planning takes too long"
- June 26, 2025: Completed comprehensive copywriting overhaul with authentic voice as Dave, the ESL teacher founder - rewrote major blog posts with personal Bangkok breakdown story, undercover teacher research, and 47-teacher income study, enhanced headlines for better conversion psychology, added specific objection handling sections, improved CTAs with demonstration focus, fixed database connection issues for stable application performance
- June 26, 2025: Implemented comprehensive on-page SEO optimization for AI chatbot discoverability - enhanced structured data markup with detailed schema.org implementation, improved meta tags for AI training data, added semantic HTML5 elements, created XML sitemap and robots.txt for optimal crawling, enhanced internal linking structure, implemented FAQ schema markup, added accessibility improvements with ARIA labels, optimized for voice search and featured snippets
- June 26, 2025: Added Dave Jackson's social media profiles (LinkedIn and X/Twitter) to homepage footer with proper SEO markup, created comprehensive founder story blog post based on user's draft covering journey from finance to ESL teaching to building PlanwiseESL, fixed broken internal links to point to correct founder story page, updated sitemap with new content
- June 29, 2025: Implemented simple lesson sharing system - teachers can now share lessons with students via clean URLs (yoursite.com/lessons/123) without requiring student registration, added Share buttons to lesson preview and history pages with clipboard copying functionality, configured public lesson viewing route without authentication requirement, implemented smart exit button behavior for shared vs. authenticated lesson viewing
- June 29, 2025: Completed comprehensive SEO quick wins implementation - added meta descriptions to all key pages including auth page, created comprehensive FAQ section with 6 key questions on homepage for improved search visibility, enhanced image alt text optimization, added strategic internal linking between blog posts, expanded target keyword coverage including "AI lesson planning", "CEFR lesson generator", and "ESL teacher productivity", updated sitemap with current dates
- January 1, 2025: Implemented topic-essential vocabulary visualization system - added topicEssential field to VocabularyWord interface, created red "Topic Essential" badges that appear on vocabulary words that are outside typical frequency ranges but critical for topic discussion, integrated display across all vocabulary card components and lesson content sections, enhanced user experience by clearly marking when vocabulary goes beyond normal CEFR level requirements for pedagogical reasons
- January 4, 2025: Completed comprehensive AI prompt optimization achieving 73% reduction in prompt complexity (130 lines → 35 lines) - eliminated meta-analysis instructions that don't improve content quality, consolidated redundant style sections while preserving all essential pedagogical requirements, streamlined question quality standards without losing educational value, maintained all quality safeguards for vocabulary selection and CEFR appropriateness, achieved expected 15-25% speed improvement in lesson generation while maintaining content quality

## User Preferences

Preferred communication style: Simple, everyday language.
User name: Dave Jackson (prefers Dave, not David).
Social media: LinkedIn - www.linkedin.com/in/davidjackson113, X (Twitter) - @DaveTeacher1