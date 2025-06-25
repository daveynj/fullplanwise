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

## User Preferences

Preferred communication style: Simple, everyday language.