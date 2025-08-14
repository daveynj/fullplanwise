# PlanwiseESL

An advanced AI-powered ESL teaching platform that delivers personalized, intelligent language learning experiences through adaptive multi-provider AI technology.

## Overview

PlanwiseESL is a comprehensive English as a Second Language (ESL) teaching platform designed to help teachers create engaging, CEFR-aligned lessons (A1-C2) with AI assistance. The platform combines modern web technologies with multiple AI providers to generate high-quality educational content.

## Features

### 🎓 Intelligent Lesson Generation
- **CEFR-Aligned Content**: Automatically generates lessons appropriate for A1-C2 levels
- **Multi-Provider AI**: Supports OpenAI, Google Gemini, and other AI services
- **Enhanced Vocabulary System**: Progressive definitions with multiple learning layers
- **Grammar Spotlights**: Interactive grammar visualizations and explanations

### 📚 Comprehensive Content Types
- **Warm-up Activities**: Engaging topic introductions with discussion questions
- **Reading Texts**: Context-rich passages with integrated vocabulary
- **Vocabulary Cards**: Multi-layered definitions with pronunciation guides
- **Comprehension Questions**: Reading comprehension with varied question types
- **Discussion Activities**: Structured conversation prompts
- **Sentence Frames**: Language patterns for authentic communication

### 👥 User Management
- **Role-Based Access**: Teacher and admin roles with appropriate permissions
- **Credit System**: Usage tracking for lesson generation
- **Lesson Library**: Personal and public lesson collections
- **Sharing System**: Easy lesson sharing with students via clean URLs

### 🎨 Modern Interface
- **Responsive Design**: Mobile-friendly interface with Tailwind CSS
- **Interactive Components**: Drag-and-drop activities and visual elements
- **Export Options**: PDF and HTML lesson downloads
- **Real-time Updates**: Live lesson generation with progress indicators

## Technology Stack

### Frontend
- **React** with TypeScript for robust component development
- **Tailwind CSS** with shadcn/ui for modern, accessible design
- **Vite** for fast development and optimized builds
- **Framer Motion** for smooth animations and interactions

### Backend
- **Express.js** with TypeScript for API development
- **Drizzle ORM** for type-safe database operations
- **Passport.js** for authentication and session management
- **PostgreSQL** via Neon serverless for data persistence

### AI Integration
- **Google Gemini 2.0 Flash** for primary lesson generation
- **OpenAI GPT** for alternative content creation
- **Stability AI** for educational image generation

### Deployment
- **Replit Deployments** for hosting and scaling
- **Neon Database** for serverless PostgreSQL
- **Environment-based configuration** for development and production

## Getting Started

### Prerequisites
- Node.js 20 or higher
- PostgreSQL database
- API keys for AI services (Gemini, OpenAI, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/planwiseesl.git
cd planwiseesl
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
# Edit .env with your database credentials and API keys
```

4. Set up the database:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

The application will be available at `http://localhost:5000`

## Environment Variables

Create a `.env` file with the following variables:

```env
# Database
DATABASE_URL=your_postgresql_connection_string

# AI Services
GEMINI_API_KEY=your_gemini_api_key
OPENAI_API_KEY=your_openai_api_key
STABILITY_API_KEY=your_stability_api_key

# Authentication
SESSION_SECRET=your_session_secret

# Email (optional)
MAILCHIMP_API_KEY=your_mailchimp_key
MAILCHIMP_SERVER_PREFIX=your_server_prefix

# Payment (optional)
STRIPE_SECRET_KEY=your_stripe_secret_key
```

## Project Structure

```
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/        # Page components
│   │   └── lib/          # Utilities and configurations
├── server/                # Backend Express application
│   ├── routes.ts         # API route definitions
│   ├── storage.ts        # Database operations
│   └── services/         # AI service integrations
├── shared/               # Shared types and schemas
│   └── schema.ts        # Database schema definitions
├── public/              # Static assets
└── docs/               # Documentation
```

## Key Features in Detail

### Enhanced Vocabulary System
- **Progressive Definitions**: Multi-layered explanations with CEFR-appropriate language
- **Contextual Integration**: Words appear naturally 2-3 times in reading texts
- **Usage Examples**: Formal, informal, and personal context demonstrations
- **Word Families**: Related terms and collocations for deeper understanding

### Reading Text Enhancement
- **Vocabulary Integration**: Natural word usage with sufficient context clues
- **Structural Requirements**: Logical progression through connected ideas
- **Engagement Factors**: Storytelling elements and relatable scenarios
- **Quality Validation**: Comprehensive checks for authenticity and effectiveness

### AI-Powered Content Generation
- **Multi-Provider Support**: Fallback systems ensure reliable generation
- **Optimized Prompts**: Streamlined for speed while maintaining quality
- **Response-First Pattern**: Immediate user feedback with background processing
- **Quality Assurance**: Built-in validation for educational effectiveness

## Contributing

We welcome contributions to PlanwiseESL! Please see our contributing guidelines for more information.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions, please contact:
- **Email**: support@planwiseesl.com
- **Website**: [planwiseesl.com](https://planwiseesl.com)
- **LinkedIn**: [Dave Jackson](https://www.linkedin.com/in/davidjackson113)
- **Twitter**: [@DaveTeacher1](https://twitter.com/DaveTeacher1)

## Acknowledgments

- Built with modern web technologies and AI services
- Designed for ESL teachers worldwide
- Continuously improved based on educator feedback

---

**PlanwiseESL** - Empowering ESL teachers with AI-driven lesson creation tools.