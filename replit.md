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
- **AI Service Integration**: Primary AI (xAI Grok-4 Fast via OpenRouter) for lesson generation with trusted output (no post-generation validation), dynamic loading.
- **Lesson Generation**: Supports CEFR levels A1-C2, various component types (warm-ups, vocabulary, reading, questions, discussion), Grammar Spotlight visualizations, and Semantic Maps.
- **Vocabulary Tracking**: System tracks vocabulary learned by each student and prevents AI from teaching duplicate words in subsequent lessons. When a lesson is assigned to a student, vocabulary is automatically extracted and saved to their profile. When generating a new lesson for that student, the AI receives the list of learned words and is instructed to avoid teaching them again while using them naturally in reading texts. This ensures progressive vocabulary building without repetition.
- **Enhanced Image Generation**: Contextual, detailed image prompts (40-80 words for vocabulary, 50-80 words for discussion) that include specific settings, characters in context, environmental details, visual style guidance, and pedagogical alignment with lesson objectives.
- **Performance Optimization**: Streamlined generation pipeline trusting Grok-4 Fast quality, eliminating validation overhead for faster lesson delivery (~2 minutes vs. previous 4+ minutes).
- **User Management**: Role-based access (Teacher, Admin), credit system, subscription support (Stripe integration), password reset.
- **Content Enhancement**: Vocabulary downloads (HTML), PDF generation, interactive elements.
- **Lesson Sharing**: Teachers can share lessons via public URLs without student registration.
- **SEO**: Comprehensive on-page SEO, structured data, sitemaps, and optimized content for discoverability.

### System Design Choices
- **Data Flow**: User authentication, AI-powered lesson creation, grammar analysis, content storage, interactive display, and export options.
- **Vocabulary Management**: Lessons stored in library with full content; student-lesson associations track assignments without duplicating lesson data. Vocabulary automatically extracted when lessons are assigned and removed when unassigned. Student profile displays assigned lessons (metadata only) and cumulative vocabulary learned.
- **Deployment**: Frontend builds to `dist/public`, backend bundles to `dist/index.js`, static file serving.
- **Environment**: Replit Secrets for sensitive data, separate configs for dev/prod, secure API key storage.
- **Scaling**: Autoscale deployment, connection pooling, lazy loading of AI services.
- **Performance Optimization**: Response-first pattern for lesson generation, pre-caching lesson data, selective field queries to avoid loading massive content fields.

## Recent Changes (November 15, 2025)

### Image Generation Rate Limit Fix
**Problem**: When Replicate API hit rate limits (429 errors), vocabulary images failed to generate but the system logged success anyway and saved null images to the database, causing missing vocabulary images in newly created lessons.

**Root Causes**:
1. No retry logic for 429/503 rate limit errors
2. All images generating in parallel, causing burst rate limit violations
3. Success logging showed "Generated image" even when imageBase64 was null
4. No validation before saving lessons to detect null images

**Solution Implemented**:
1. **Retry Logic** (replicate-flux.service.ts):
   - Added exponential backoff with jitter for 429/503 errors
   - Up to 5 retry attempts per image
   - Respects `retry_after` header from Replicate API
   - Clear error logging when all retries exhausted

2. **Concurrency Limiting** (gemini.ts):
   - Changed from parallel Promise.all to batched execution
   - Images generate in batches of 3 (stays within Replicate's 5-request burst limit)
   - 2-second delay between batches
   - Deferred function execution prevents all promises from starting at once
   - Progress logging for each batch

3. **Accurate Success Logging** (gemini.ts):
   - Only logs "✓ Generated image" when imageBase64 is not null
   - Logs "✗ Failed to generate" when null returned
   - Applied to both vocabulary and discussion images

4. **Pre-Save Validation** (routes.ts):
   - Checks all vocabulary and discussion images before database save
   - Logs detailed warnings listing all missing images by term/question
   - Doesn't block save (allows partial success for user visibility)

**Impact**: Images now generate reliably without hitting rate limits. Teachers can see warnings if any images fail and regenerate if needed.

### Natural Vocabulary Reinforcement Enhancement (November 1, 2025)
**Problem**: AI was forcing previously learned vocabulary into reading texts in unnatural, contrived ways that made the content sound awkward.

**Root Cause**: The prompt instruction told the AI to "Use these words FREELY throughout the lesson," which was being interpreted as a directive to incorporate as many learned words as possible, rather than an optional permission.

**Solution**: Revised the vocabulary instruction section in `server/services/gemini.ts` to:
1. Change "Use FREELY" → "You MAY use naturally" (making it optional, not mandatory)
2. Add explicit prohibition: "Never force these words into the lesson just because they're available"
3. Add clear priority: "Prioritize creating natural, authentic, and engaging reading texts over vocabulary reinforcement"
4. Emphasize that natural content quality is MORE IMPORTANT than vocabulary reinforcement
5. Maintain existing prohibition on using learned words as focus vocabulary

**Impact**: Reading texts now sound natural and authentic while still allowing organic incorporation of previously learned vocabulary when contextually appropriate.

### Prompt Optimization and Quality Control Enhancement
**Changes**: Optimized the lesson generation prompt and added comprehensive quality control mechanisms.

**Implementations**:
1. **Prompt Restructuring** (29.3% reduction from 1,776 to 1,255 lines):
   - Reorganized into sequential Steps 1-7 (Foundation Analysis → Vocabulary Selection → Reading Text → Comprehension → Sentence Frames → Discussion → Integration & Validation)
   - Reduced emphasis markers from 40+ to 5 strategic uses
   - Consolidated duplicate instructions and simplified language
   - Added clear transitions between workflow steps

2. **Self-Verification Checkpoints** (9 total):
   - Step 2: EVP vocabulary verification before proceeding
   - Step 3: Reading text validation (word count, vocabulary integration, sentence complexity)
   - Step 4: Comprehension questions quality check
   - Step 5: Sentence frames structure verification
   - Step 6: Discussion questions compliance check
   - Cloze Activity: Gap appropriateness and format validation
   - Sentence Unscramble: Grammar correctness verification
   - Grammar Spotlight: Content and visual element validation
   - Quiz Section: Question quality and variety check
   - Step 7: Enhanced comprehensive final validation (4 categories: Content Quality, Structural Requirements, JSON Format, Cross-Section Consistency)

3. **Definition Writing Enhancement**:
   - Added "Definition Writing Principle" emphasizing clarity and accessibility
   - Instructs AI to write definitions students can easily understand at first reading
   - Prioritizes simple, conversational language over technical precision
   - Maintains existing Definition Standards (word limits, vocabulary levels) as technical constraints

**Impact**: Faster generation (~2 minutes), improved quality control, better vocabulary definition clarity.

### Interactive Lesson Deletion with Vocabulary Control
**Feature**: Added intelligent lesson deletion system that gives teachers control over student vocabulary when removing lessons from their library.

**Implementation**:
1. **Schema Updates**: Extended `student_vocabulary` table to support standalone vocabulary:
   - `lessonId` now nullable (allows vocabulary to exist independently)
   - `source` field tracks origin ("lesson" or "manual")
   - `originLessonTitle` preserves the original lesson name for reference

2. **Deletion Strategies**:
   - **No Assignments**: Simple deletion (lesson removed immediately)
   - **With Assignments**: Teacher chooses between:
     - **Delete All**: Removes lesson + all vocabulary from student profiles (complete cleanup)
     - **Keep Vocabulary**: Removes lesson but preserves vocabulary as standalone words (students retain their progress)

3. **Technical Details**:
   - Transaction-based deletion ensures data consistency
   - Vocabulary updates only affect words with `source='lesson'` to preserve manually added words
   - Uses SQL COALESCE to protect existing `originLessonTitle` if lesson already migrated
   - Server returns strategy-specific success messages to avoid stale UI state
   - Frontend clears deletion info on each dialog open to prevent stale assignment counts

4. **User Experience**:
   - Interactive modal shows assignment count and affected students
   - Radio button selection with clear descriptions of each option
   - Loading states during assignment checks and deletion
   - Toast notifications with strategy-specific feedback

### Vocabulary Tracking Bug Fix
**Problem**: AI was generating duplicate vocabulary words for students despite having a vocabulary tracking system.

**Root Cause**: The lesson generation form (`client/src/components/lesson/lesson-form.tsx`) had `useStudentHistory` hardcoded to `false`, which prevented the backend from fetching and passing the student's learned vocabulary to the AI.

**Solution**: Changed `useStudentHistory: true` to enable vocabulary history tracking. Now when generating lessons for assigned students, the system:
1. Fetches the student's learned vocabulary (up to 50 words)
2. Passes the word list to the AI with instructions to avoid teaching those words
3. AI uses learned words naturally in reading texts while focusing on NEW vocabulary
4. Deduplication on save ensures no duplicate words are stored even if AI generates them

### Student Lesson Display Bug Fix
**Problem**: Student profiles showed vocabulary but no assigned lessons (500 error: "response too large").

**Root Cause**: The `getStudentLessons` query was fetching full lesson content including massive base64-encoded images (~67MB for 11 lessons), exceeding Neon database response limits.

**Solution**: Modified the query to select only lesson metadata fields (id, title, cefrLevel, createdAt, etc.) while explicitly excluding the `content` field. Response size reduced from 67MB to a few KB. Also added proper null checking for LEFT JOIN results to handle orphaned lesson assignments gracefully.

## Recent Changes (November 19, 2025)

### AI Model and Image Generation Migration
**Changes**: Migrated from Grok-4-Fast to DeepSeek Chat v3.1 for lesson generation and from Replicate to Runware.ai for image generation.

**Implementations**:
1. **AI Model Update**:
   - Changed model from `x-ai/grok-4-fast` to `deepseek/deepseek-chat-v3.1` in OpenRouter service
   - Updated both lesson generation and test connection endpoints
   - Maintained existing prompt structure and parameters

2. **Image Generation Service Migration**:
   - Created new `RunwareService` (server/services/runware.service.ts) to replace Replicate
   - Uses Runware.ai HTTP REST API with Flux Schnell model (`runware:100@1`)
   - Generates 256x256 PNG images with base64 output
   - Supports batch generation in single API request for efficiency
   - Updated OpenRouter service to use `runwareService` instead of `replicateFluxService`

3. **Batch Processing Configuration**:
   - Set batch size to 10 images per batch (optimal for typical lessons with ~10 images)
   - Most lessons now complete in a single batch with no inter-batch delays
   - Maintained parallel execution with Promise.all for fast generation

**Impact**: Faster lesson generation with DeepSeek Chat v3.1, more cost-effective image generation with Runware.ai, and optimized batch processing for typical lesson size.

## External Dependencies

- **AI Services**:
    - DeepSeek Chat v3.1 (via OpenRouter) - Lesson content generation
    - Runware.ai (Flux Schnell model) - Image generation
- **Payment & Communication**:
    - Stripe (Subscription and payment processing)
- **Infrastructure**:
    - Neon Database (Serverless PostgreSQL hosting)
    - @neondatabase/serverless (WebSocket support for database connections)
