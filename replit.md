# ESL Teaching Platform

## Overview

This is a full-stack ESL (English as a Second Language) teaching platform designed for creating and managing customized language lessons. The platform integrates multiple AI services for intelligent lesson generation, grammar analysis, vocabulary enhancement, and comprehensive lesson management, targeting both teachers and administrators. The business vision is to provide an efficient and intelligent tool to streamline lesson planning and improve the quality of ESL education.

## User Preferences

Preferred communication style: Simple, everyday language.
User name: Dave Jackson (prefers Dave, not David).
Social media: LinkedIn - www.linkedin.com/in/davidjackson113, X (Twitter) - @DaveTeacher1

## System Architecture

### UI/UX Decisions
- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS with shadcn/ui components
- **UI Components**: Radix UI primitives for accessibility
- **Responsive Design**: Mobile-friendly interface
- **Interactive Components**: Drag-and-drop activities, visual grammar explanations

### Technical Implementations
- **Backend**: Express.js with TypeScript on Node.js 20
- **API Design**: RESTful endpoints with JSON responses
- **Authentication**: Passport.js with local strategy and session management
- **Database ORM**: Drizzle ORM for type-safe PostgreSQL operations
- **Build Tools**: Vite (frontend), esbuild (backend)

### Feature Specifications
- **AI Service Integration**: Primary AI (xAI Grok-4 Fast via OpenRouter) for lesson generation, AI-powered grammar validation for reading texts, dynamic loading.
- **Lesson Generation**: Supports CEFR levels A1-C2, various component types (warm-ups, vocabulary, reading, questions, discussion), Grammar Spotlight visualizations, and Semantic Maps.
- **Enhanced Image Generation**: Contextual, detailed image prompts (40-80 words for vocabulary, 50-80 words for discussion) that include specific settings, diverse characters, environmental context, visual style guidance, and pedagogical alignment with lesson objectives.
- **User Management**: Role-based access (Teacher, Admin), credit system, subscription support (Stripe integration), password reset.
- **Content Enhancement**: Vocabulary downloads (HTML), PDF generation, interactive elements.
- **Lesson Sharing**: Teachers can share lessons via public URLs without student registration.
- **SEO**: Comprehensive on-page SEO, structured data, sitemaps, and optimized content for discoverability.

### System Design Choices
- **Data Flow**: User authentication, AI-powered lesson creation, grammar analysis, content storage, interactive display, and export options.
- **Deployment**: Frontend builds to `dist/public`, backend bundles to `dist/index.js`, static file serving.
- **Environment**: Replit Secrets for sensitive data, separate configs for dev/prod, secure API key storage.
- **Scaling**: Autoscale deployment, connection pooling, lazy loading of AI services.
- **Performance Optimization**: Response-first pattern for lesson generation, pre-caching lesson data.

## External Dependencies

- **AI Services**:
    - xAI Grok-4 Fast (via OpenRouter)
- **Payment & Communication**:
    - Stripe (Subscription and payment processing)
- **Infrastructure**:
    - Neon Database (Serverless PostgreSQL hosting)
    - @neondatabase/serverless (WebSocket support for database connections)