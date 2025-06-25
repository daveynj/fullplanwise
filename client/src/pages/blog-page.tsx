import { useState } from "react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  BookOpen, 
  Search, 
  Calendar, 
  Clock, 
  ArrowRight, 
  Lightbulb,
  Globe,
  Users,
  Brain,
  Sparkles,
  Target,
  TrendingUp
} from "lucide-react";

// Blog post data - optimized for SEO and AI discoverability
const blogPosts = [
  {
    id: 1,
    title: "How AI is Revolutionizing ESL Teaching: The Complete Guide for 2025",
    excerpt: "Discover how artificial intelligence is transforming English as a Second Language education. From personalized lesson plans to CEFR-aligned content generation, explore the future of ESL teaching with AI-powered tools.",
    content: `Artificial Intelligence is fundamentally changing how we approach English as a Second Language (ESL) teaching. Modern AI tools can generate comprehensive, CEFR-aligned lesson plans in seconds, creating personalized content for students at every proficiency level from A1 beginner to C2 advanced.

**Key Benefits of AI in ESL Teaching:**

1. **Instant Lesson Generation**: Create complete lessons with vocabulary, reading passages, comprehension questions, and discussion activities in under 2 minutes
2. **CEFR Alignment**: Automatically adjust content complexity to match Common European Framework levels
3. **Grammar Spotlight Integration**: AI identifies key grammar patterns and creates interactive visualizations
4. **Personalized Content**: Tailor lessons to specific student interests, cultural backgrounds, and learning objectives
5. **Semantic Vocabulary Maps**: Visual representations help students understand word relationships and context

**Real-World Applications:**

- **Business English**: Generate industry-specific lessons for professionals
- **Academic Preparation**: Create IELTS and TOEFL preparation materials
- **Conversational Practice**: Develop discussion topics with cultural sensitivity
- **Grammar Instruction**: Transform complex grammar rules into engaging, visual learning experiences

**The Future of ESL Education:**

AI-powered platforms like LinguaBoost are leading this transformation, offering teachers tools that were unimaginable just years ago. With natural language processing and advanced content generation, these platforms understand pedagogical principles and create educationally sound materials that engage students and accelerate learning.

Whether you're teaching in a traditional classroom, online environment, or hybrid setting, AI tools are becoming essential for modern ESL instruction. The ability to generate unlimited, high-quality content means teachers can focus on what they do best: inspiring and guiding students on their language learning journey.`,
    category: "AI Technology",
    readTime: "8 min",
    publishDate: "2025-01-15",
    tags: ["AI", "ESL Teaching", "Education Technology", "CEFR", "Language Learning"],
    featured: true
  },
  {
    id: 2,
    title: "CEFR Levels Explained: A Complete Guide for ESL Teachers",
    excerpt: "Master the Common European Framework of Reference (CEFR) with our comprehensive guide. Learn how to create appropriate content for A1-C2 levels and improve student outcomes.",
    content: `The Common European Framework of Reference for Languages (CEFR) provides a standardized system for describing language proficiency. Understanding CEFR levels is crucial for ESL teachers to create appropriate, effective lessons.

**CEFR Level Breakdown:**

**A1 (Beginner):**
- Vocabulary: 500-1000 words
- Grammar: Present simple, basic pronouns, simple questions
- Skills: Basic greetings, personal information, simple descriptions
- Lesson Focus: Survival English, everyday situations

**A2 (Elementary):**
- Vocabulary: 1000-2000 words
- Grammar: Past simple, comparatives, modal verbs (can, must)
- Skills: Shopping, directions, simple conversations
- Lesson Focus: Practical communication, routine activities

**B1 (Intermediate):**
- Vocabulary: 2000-3000 words
- Grammar: Present perfect, conditionals, passive voice
- Skills: Express opinions, describe experiences, handle problems
- Lesson Focus: Personal topics, work situations, travel

**B2 (Upper-Intermediate):**
- Vocabulary: 3000-4000 words
- Grammar: Complex tenses, reported speech, advanced conditionals
- Skills: Argue points, understand abstract concepts, negotiate
- Lesson Focus: Current affairs, academic topics, professional communication

**C1 (Advanced):**
- Vocabulary: 4000-8000 words
- Grammar: Sophisticated structures, nuanced expressions
- Skills: Express ideas fluently, understand implicit meaning
- Lesson Focus: Literature, complex academic topics, specialized fields

**C2 (Proficient):**
- Vocabulary: 8000+ words
- Grammar: Native-like complexity and accuracy
- Skills: Understand everything, express subtle distinctions
- Lesson Focus: Advanced academic/professional contexts, cultural nuances

**Creating CEFR-Appropriate Content:**

Modern AI tools can automatically adjust content complexity to match CEFR levels, ensuring students receive appropriately challenging material. This includes:
- Vocabulary selection based on frequency and complexity
- Grammar structures aligned with level expectations
- Text complexity analysis for reading materials
- Question types appropriate for cognitive load

**Assessment and Progression:**

Understanding CEFR levels helps teachers:
- Set realistic learning objectives
- Track student progress effectively
- Prepare students for standardized tests
- Communicate proficiency to employers and institutions

The CEFR framework, combined with AI-powered content generation, enables teachers to create precisely targeted lessons that move students systematically through proficiency levels.`,
    category: "Teaching Methods",
    readTime: "12 min",
    publishDate: "2025-01-10",
    tags: ["CEFR", "Assessment", "Curriculum Design", "Language Proficiency", "Teaching Standards"]
  },
  {
    id: 3,
    title: "10 Proven Strategies for Engaging ESL Students in 2025",
    excerpt: "Transform your ESL classroom with these evidence-based engagement strategies. From interactive grammar visualizations to culturally responsive teaching methods.",
    content: `Student engagement is the cornerstone of effective ESL instruction. Here are ten proven strategies that modern ESL teachers use to create dynamic, interactive learning environments:

**1. Interactive Grammar Visualizations**
Transform abstract grammar concepts into visual, interactive experiences. Use timeline visualizations for tenses, decision trees for conditionals, and pattern recognition activities for irregular verbs.

**2. Culturally Responsive Content**
Create lessons that reflect students' cultural backgrounds and experiences. AI-powered platforms can generate content incorporating diverse cultural perspectives while maintaining pedagogical effectiveness.

**3. Real-World Application Focus**
Connect every lesson to practical, real-world scenarios. Whether it's ordering food, job interviews, or academic presentations, students engage more when they see immediate relevance.

**4. Collaborative Learning Activities**
Design group activities that require meaningful communication. Peer teaching, problem-solving tasks, and project-based learning increase engagement and language production.

**5. Technology Integration**
Use AI tools for instant lesson generation, interactive exercises, and personalized feedback. Modern students expect digital integration in their learning experience.

**6. Multimodal Learning Approaches**
Incorporate visual, auditory, kinesthetic, and digital elements. Different students learn through different modalities, and variety maintains interest.

**7. Regular Formative Assessment**
Use quick, low-stakes assessments to gauge understanding and adjust instruction. This keeps students engaged and provides immediate feedback.

**8. Scaffolded Challenge Levels**
Provide appropriate challenge through CEFR-aligned content. Too easy is boring; too difficult is discouraging. AI tools can help find the perfect balance.

**9. Student Choice and Agency**
Allow students to choose topics, formats, and learning paths when possible. Ownership increases engagement and motivation.

**10. Celebration of Progress**
Regularly acknowledge and celebrate language learning milestones. Positive reinforcement builds confidence and maintains motivation.

**Implementation with Modern Tools:**

AI-powered platforms make implementing these strategies easier than ever. Teachers can:
- Generate culturally diverse content instantly
- Create appropriately challenging materials for each CEFR level
- Develop interactive grammar activities with visual components
- Access unlimited real-world scenarios for practice

The key is combining pedagogical best practices with modern technology to create learning experiences that are both effective and engaging.`,
    category: "Teaching Strategies",
    readTime: "10 min",
    publishDate: "2025-01-08",
    tags: ["Student Engagement", "Classroom Management", "Teaching Techniques", "ESL Strategies", "Interactive Learning"]
  },
  {
    id: 4,
    title: "The Science Behind Effective Vocabulary Acquisition in ESL Learning",
    excerpt: "Explore research-backed methods for teaching vocabulary to ESL students. Learn about semantic mapping, spaced repetition, and context-based learning approaches.",
    content: `Vocabulary acquisition is fundamental to language learning success. Research in cognitive science and applied linguistics has revealed optimal methods for helping ESL students build robust vocabulary knowledge.

**The Dual Coding Theory:**
Allan Paivio's research shows that information processed both verbally and visually is better retained. This supports using:
- Visual vocabulary cards with images
- Semantic maps showing word relationships
- Infographic-style presentations of new terms

**Spaced Repetition and Memory Consolidation:**
Hermann Ebbinghaus's forgetting curve demonstrates that spaced review significantly improves retention. Effective vocabulary instruction includes:
- Initial introduction with multiple exposures
- Review after 1 day, 3 days, 1 week, 2 weeks, and 1 month
- Integration into multiple contexts over time

**Context-Rich Learning:**
Research by Nagy and Herman shows that students learn vocabulary best when words are encountered in meaningful contexts. This includes:
- Rich reading passages with target vocabulary
- Multiple sentence examples showing different uses
- Real-world applications and situations

**Semantic Mapping and Word Relationships:**
Students understand and remember vocabulary better when they see connections between words. Effective techniques include:
- Synonym and antonym relationships
- Word families and morphological connections
- Conceptual categories and themes
- Visual maps showing word relationships

**The Keyword Method:**
Research by Atkinson and Raugh demonstrates that creating memorable associations helps vocabulary retention:
- Link new words to familiar concepts
- Create visual or phonetic associations
- Use mnemonic devices for difficult terms

**Productive vs. Receptive Vocabulary:**
Understanding the difference is crucial for instruction:
- **Receptive vocabulary**: Words students can understand when reading or listening
- **Productive vocabulary**: Words students can use accurately in speaking and writing
- Students need multiple exposures before moving from receptive to productive use

**Technology-Enhanced Vocabulary Learning:**
Modern AI tools can optimize vocabulary instruction by:
- Selecting frequency-appropriate words for each CEFR level
- Generating multiple contexts for each target word
- Creating semantic maps automatically
- Providing spaced repetition schedules
- Adapting to individual learning patterns

**Assessment of Vocabulary Knowledge:**
Effective vocabulary assessment includes:
- Multiple-choice for recognition
- Gap-fill exercises for production
- Semantic mapping activities
- Real-world application tasks

The most effective vocabulary instruction combines these research-backed principles with engaging, contextually rich activities that help students build both breadth and depth of vocabulary knowledge.`,
    category: "Research & Methods",
    readTime: "15 min",
    publishDate: "2025-01-05",
    tags: ["Vocabulary Learning", "Cognitive Science", "Memory Research", "Language Acquisition", "Evidence-Based Teaching"]
  },
  {
    id: 5,
    title: "Creating Inclusive ESL Classrooms: Best Practices for Diverse Learners",
    excerpt: "Build welcoming, effective learning environments for students from diverse backgrounds. Practical strategies for cultural sensitivity and inclusive teaching practices.",
    content: `Creating inclusive ESL classrooms requires intentional design that welcomes learners from diverse cultural, linguistic, and educational backgrounds. Here's how to build learning environments where all students can thrive.

**Understanding Cultural Diversity in ESL Contexts:**

ESL classrooms often include students from vastly different backgrounds:
- Varying educational systems and learning styles
- Different cultural attitudes toward authority and participation
- Diverse socioeconomic circumstances
- Multiple native languages and writing systems
- Varying levels of digital literacy

**Culturally Responsive Teaching Strategies:**

**1. Validate Home Languages and Cultures**
- Acknowledge and celebrate linguistic diversity
- Allow strategic use of native languages for clarification
- Incorporate multicultural content and perspectives
- Create opportunities for students to share their cultures

**2. Adapt Communication Styles**
- Understand cultural differences in eye contact, personal space, and formality
- Provide multiple ways for students to participate (written, oral, visual)
- Be aware of cultural taboos and sensitive topics
- Adjust feedback styles to match cultural expectations

**3. Scaffold Learning Appropriately**
- Assess prior knowledge without assumptions
- Provide visual and contextual support
- Use graphic organizers and concept maps
- Break complex tasks into manageable steps

**Inclusive Curriculum Design:**

**Content Selection:**
- Choose topics relevant to diverse experiences
- Avoid stereotypes and overgeneralizations
- Include global perspectives on universal themes
- Balance Western and non-Western viewpoints

**Material Adaptation:**
- Ensure reading materials reflect diverse characters and settings
- Use images and examples from various cultures
- Adapt complexity appropriately for different proficiency levels
- Provide materials in multiple formats (audio, visual, kinesthetic)

**Assessment Considerations:**

**Multiple Assessment Methods:**
- Oral assessments for students with limited writing skills
- Portfolio-based assessment showing progress over time
- Peer assessment and self-reflection opportunities
- Project-based assessments allowing creative expression

**Cultural Bias Awareness:**
- Review assessment materials for cultural assumptions
- Provide context for culturally specific references
- Allow alternative ways to demonstrate knowledge
- Consider time pressures and test anxiety factors

**Technology and Accessibility:**

**Digital Inclusion:**
- Ensure equal access to technology and internet
- Provide training on digital tools and platforms
- Offer offline alternatives when necessary
- Use translation tools judiciously as learning supports

**Universal Design for Learning:**
- Multiple means of representation (visual, auditory, textual)
- Multiple means of engagement (choice, relevance, collaboration)
- Multiple means of expression (oral, written, creative, digital)

**Building Community and Belonging:**

**Classroom Environment:**
- Display materials reflecting diverse cultures and languages
- Create spaces for both individual and collaborative work
- Establish clear, fair expectations and procedures
- Celebrate multicultural holidays and traditions

**Peer Relationships:**
- Structure activities promoting cross-cultural interaction
- Address bias and stereotypes directly but sensitively
- Encourage peer mentoring and support systems
- Create opportunities for authentic communication

**Professional Development and Self-Reflection:**

**Ongoing Learning:**
- Continuously educate yourself about students' cultures
- Reflect on your own cultural biases and assumptions
- Seek feedback from students and colleagues
- Adapt practices based on student needs and responses

Modern AI-powered tools can support inclusive teaching by:
- Generating culturally diverse content and scenarios
- Creating materials at appropriate complexity levels
- Providing multiple formats and modalities
- Adapting to individual learning preferences and needs

The goal is creating learning environments where every student feels valued, supported, and empowered to succeed in their English language journey.`,
    category: "Inclusive Education",
    readTime: "18 min",
    publishDate: "2025-01-03",
    tags: ["Inclusive Teaching", "Cultural Diversity", "Classroom Environment", "Equity", "Social Justice Education"]
  }
];

const categories = ["All", "AI Technology", "Teaching Methods", "Teaching Strategies", "Research & Methods", "Inclusive Education"];

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedPost, setSelectedPost] = useState<number | null>(null);

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         post.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = blogPosts.find(post => post.featured);

  if (selectedPost) {
    const post = blogPosts.find(p => p.id === selectedPost);
    if (!post) return <div>Post not found</div>;

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b border-gray-200">
          <div className="container mx-auto px-4 py-6">
            <div className="flex items-center justify-between">
              <Link href="/">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                    <Sparkles className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">LinguaBoost</h1>
                    <p className="text-sm text-gray-500">AI-Powered ESL Lessons</p>
                  </div>
                </div>
              </Link>
              <Button 
                variant="outline" 
                onClick={() => setSelectedPost(null)}
                className="flex items-center gap-2"
              >
                <ArrowRight className="h-4 w-4 rotate-180" />
                Back to Blog
              </Button>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <article className="container mx-auto px-4 py-12 max-w-4xl">
          <div className="bg-white rounded-lg shadow-sm p-8">
            {/* Article Header */}
            <div className="mb-8">
              <Badge variant="secondary" className="mb-4">
                {post.category}
              </Badge>
              <h1 className="text-4xl font-bold text-gray-900 mb-4 leading-tight">
                {post.title}
              </h1>
              <div className="flex items-center gap-6 text-gray-500 mb-6">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>{new Date(post.publishDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{post.readTime} read</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2 mb-8">
                {post.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Article Body */}
            <div className="prose prose-lg max-w-none">
              {post.content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('**') && paragraph.endsWith('**')) {
                  return (
                    <h3 key={index} className="text-xl font-semibold text-gray-900 mt-8 mb-4">
                      {paragraph.replace(/\*\*/g, '')}
                    </h3>
                  );
                }
                if (paragraph.startsWith('- ')) {
                  const listItems = paragraph.split('\n').filter(item => item.startsWith('- '));
                  return (
                    <ul key={index} className="list-disc pl-6 mb-6 space-y-2">
                      {listItems.map((item, itemIndex) => (
                        <li key={itemIndex} className="text-gray-700">
                          {item.substring(2)}
                        </li>
                      ))}
                    </ul>
                  );
                }
                return (
                  <p key={index} className="text-gray-700 leading-relaxed mb-6">
                    {paragraph}
                  </p>
                );
              })}
            </div>

            {/* Call to Action */}
            <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-100">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Ready to Transform Your ESL Teaching?
              </h3>
              <p className="text-gray-600 mb-4">
                Join thousands of teachers using AI-powered tools to create engaging, CEFR-aligned lessons in seconds.
              </p>
              <Link href="/auth">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium">
                  Start Creating Lessons
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </article>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-4 py-6">
          <Link href="/">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">LinguaBoost Blog</h1>
                <p className="text-sm text-gray-500">Insights on AI-Powered ESL Teaching</p>
              </div>
            </div>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            The Future of ESL Teaching
          </h1>
          <p className="text-xl md:text-2xl text-blue-100 mb-8 max-w-3xl mx-auto">
            Discover how AI is revolutionizing English language education with evidence-based insights, 
            practical strategies, and innovative teaching methods.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2">
              <Brain className="h-4 w-4 mr-2" />
              AI-Powered Learning
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2">
              <Globe className="h-4 w-4 mr-2" />
              CEFR Aligned
            </Badge>
            <Badge variant="secondary" className="bg-white/20 text-white border-white/30 px-4 py-2">
              <Users className="h-4 w-4 mr-2" />
              Evidence-Based
            </Badge>
          </div>
        </div>
      </section>

      {/* Search and Filter */}
      <section className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className="text-sm"
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

        {/* Featured Article */}
        {featuredPost && selectedCategory === "All" && !searchTerm && (
          <Card className="mb-12 overflow-hidden bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
            <CardContent className="p-8">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-blue-200">
                  Featured Article
                </Badge>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                {featuredPost.title}
              </h2>
              <p className="text-gray-600 text-lg mb-6 leading-relaxed">
                {featuredPost.excerpt}
              </p>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 text-gray-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{new Date(featuredPost.publishDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span className="text-sm">{featuredPost.readTime}</span>
                  </div>
                </div>
                <Button 
                  onClick={() => setSelectedPost(featuredPost.id)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                >
                  Read Article
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Articles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPosts.filter(post => !post.featured || selectedCategory !== "All" || searchTerm).map(post => (
            <Card key={post.id} className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="outline" className="text-xs">
                    {post.category}
                  </Badge>
                  <div className="flex items-center gap-1 text-gray-400">
                    <Clock className="h-3 w-3" />
                    <span className="text-xs">{post.readTime}</span>
                  </div>
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 leading-tight">
                  {post.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4 leading-relaxed">
                  {post.excerpt}
                </p>
                <div className="flex flex-wrap gap-1 mb-4">
                  {post.tags.slice(0, 3).map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-gray-400">
                    <Calendar className="h-3 w-3" />
                    <span className="text-xs">{new Date(post.publishDate).toLocaleDateString()}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setSelectedPost(post.id)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Read More
                    <ArrowRight className="ml-1 h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredPosts.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500">Try adjusting your search terms or filters.</p>
          </div>
        )}
      </section>

      {/* Newsletter CTA */}
      <section className="bg-white border-t border-gray-200 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <Lightbulb className="h-12 w-12 text-blue-600 mx-auto mb-6" />
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Start Creating AI-Powered ESL Lessons Today
            </h2>
            <p className="text-gray-600 text-lg mb-8">
              Join thousands of teachers who are already using AI to create engaging, 
              CEFR-aligned lessons that inspire and educate students worldwide.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth">
                <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}