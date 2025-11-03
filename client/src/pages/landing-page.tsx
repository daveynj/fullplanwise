import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/SEOHead';
import { useFreeTrial } from '@/hooks/use-free-trial';
import { format } from 'date-fns';
// Import Card components
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"; 
// Import Tabs for lesson showcase
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
// Import icons
import { 
  Clock, Target, MonitorSmartphone, BookOpen, MessageSquare, 
  Lightbulb, CheckCircle, Sparkles, Layers, Puzzle, Database,
  Lock as LockIcon
} from 'lucide-react';

// Screenshots are served from public directory

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

export default function LandingPage() {
  const { isFreeTrialActive, freeTrialEndDate } = useFreeTrial();
  const endDate = freeTrialEndDate ? format(freeTrialEndDate, "MMMM do") : '';
  return (
    <div className="flex flex-col min-h-screen font-open-sans">
      <SEOHead
        title="Plan Wise ESL: AI Lesson Generator for ESL Teachers"
        description="Transform your lesson planning from exhausting to effortless. Go from 3-hour prep sessions to 3-minute lesson generation. Start your transformation today!"
        keywords={[
          "ESL teacher burnout solution",
          "AI ESL lesson generator", 
          "lesson planning takes too long",
          "how to plan ESL lessons faster",
          "tired of ESL lesson prep",
          "save time ESL teaching",
          "ESL lesson planning software",
          "automated ESL lessons",
          "CEFR lesson planning",
          "ESL teacher productivity",
          "AI for English teachers"
        ]}
        canonicalUrl="https://planwiseesl.com"
      />
      <FreeTrialBanner />
      {/* Header/Navigation */}
      <header className="bg-brand-light shadow-sm sticky top-0 z-10">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          {/* Combine logo and text */}
          <div className="flex items-center gap-2">
            <img src="/PlanWise_ESL_logo.png" alt="PlanwiseESL AI-powered ESL lesson generator logo" className="h-20 w-auto" /> 
            <span className="text-xl font-nunito font-bold text-brand-navy">PLAN WISE ESL</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/blog">
              <Button variant="ghost" className="text-brand-navy hover:bg-brand-navy/10">
                Blog
              </Button>
            </Link>
            <Link href="/auth">
              <Button variant="outline" className="mr-2 border-brand-navy text-brand-navy hover:bg-brand-navy/10">Login</Button>
            </Link>
            <Link href="/auth?register=true">
              <Button variant="brand">Sign Up Free</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section with Lesson Preview */}
      <section className="bg-brand-navy text-brand-light py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Hero Text Column */}
            <div className="text-center lg:text-left lg:w-1/2">
              <h1 className="text-4xl md:text-5xl font-nunito font-bold mb-4">
                From 3-Hour Lesson Prep to 3-Minute Freedom
              </h1>
              <p className="text-xl md:text-2xl mb-6 opacity-90">
                Transform your lesson planning from exhausting to effortless. Go from exhausted to energized—reclaim your weekends and rediscover your passion for teaching.
              </p>
              
              {/* Quick benefit list */}
              <ul className="mb-8 text-lg space-y-2 mx-auto lg:mx-0 max-w-md">
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-brand-yellow" /> 
                  <span>Create complete CEFR-aligned lessons in 3 minutes</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-brand-yellow" /> 
                  <span>Increase your teaching hours (and income)</span>
                </li>
                <li className="flex items-center">
                  <CheckCircle className="h-5 w-5 mr-2 text-brand-yellow" /> 
                  <span>No more late nights preparing materials</span>
                </li>
              </ul>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-8">
                <div className="flex flex-col items-center lg:items-start">
                  <Link href="/auth?register=true">
                    <Button size="lg" variant="brand" className="font-semibold px-8 py-3 w-full sm:w-auto">
                      Start Your Transformation
                    </Button>
                  </Link>
                  <div className="flex items-center mt-2 text-brand-light/90 text-sm">
                    <LockIcon className="h-3 w-3 mr-1" />
                    {isFreeTrialActive ? (
                      <span>No credit card required • Unlimited lessons until {endDate}</span>
                    ) : (
                      <span>No credit card required • 5 free lessons</span>
                    )}
                  </div>
                </div>
                <a href="#features"> {/* Use standard anchor for in-page scroll */}
                  <Button size="lg" variant="outline" className="bg-transparent text-brand-light border-brand-light hover:bg-brand-light/20 px-8 py-3 w-full sm:w-auto">
                    Explore Features
                  </Button>
                </a>
              </div>
              
              <div className="hidden lg:block">
                {/* Smaller YouTube video for desktop only */}
                <div className="rounded-lg overflow-hidden shadow-lg max-w-md mx-auto">
                  <iframe 
                    className="w-full aspect-video"
                    src="https://www.youtube.com/embed/pcLlwL5sNK0" 
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
            <div className="lg:w-1/2">
              <Card variant="default" className="rounded-xl overflow-hidden shadow-xl">
                <img 
                  src="/reading.PNG" 
                  alt="ESL Lesson Preview" 
                  className="w-full h-auto rounded-t-xl" 
                />
                <div className="p-4 text-gray-800">
                  <h3 className="text-xl font-semibold text-brand-navy">AI-Generated Lessons in Minutes</h3>
                  <p className="text-gray-600">Complete lessons with reading, vocabulary, activities, and assessments.</p>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Lesson Showcase Section - NEW */}
      <section className="py-16 px-6 bg-brand-light border-b border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-nunito font-bold mb-4 text-brand-navy">See Real AI-Generated Lessons</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Each lesson comes with a complete suite of activities - from warm-up exercises to vocabulary practice, 
              reading comprehension, interactive activities, and assessment tools.
            </p>
          </div>
          
          <Tabs defaultValue="reading" className="w-full">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/4">
                <div className="sticky top-24">
                  <h3 className="text-xl font-nunito font-semibold mb-4 text-brand-navy">Lesson Components</h3>
                  <p className="text-sm text-gray-600 mb-4">Click to explore each section of a complete ESL lesson</p>
                  <TabsList className="flex flex-col space-y-1 h-auto bg-transparent">
                    <TabsTrigger value="warmup" className="justify-start data-[state=active]:bg-brand-yellow/20 data-[state=active]:text-brand-navy">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Warm-up Activities
                    </TabsTrigger>
                    <TabsTrigger value="reading" className="justify-start data-[state=active]:bg-brand-yellow/20 data-[state=active]:text-brand-navy">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Reading Text
                    </TabsTrigger>
                    <TabsTrigger value="vocabulary" className="justify-start data-[state=active]:bg-brand-yellow/20 data-[state=active]:text-brand-navy">
                      <Database className="h-4 w-4 mr-2" />
                      Vocabulary Practice
                    </TabsTrigger>
                    <TabsTrigger value="comprehension" className="justify-start data-[state=active]:bg-brand-yellow/20 data-[state=active]:text-brand-navy">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Comprehension Questions
                    </TabsTrigger>
                    <TabsTrigger value="sentence" className="justify-start data-[state=active]:bg-brand-yellow/20 data-[state=active]:text-brand-navy">
                      <Layers className="h-4 w-4 mr-2" />
                      Sentence Patterns
                    </TabsTrigger>
                    <TabsTrigger value="cloze" className="justify-start data-[state=active]:bg-brand-yellow/20 data-[state=active]:text-brand-navy">
                      <Puzzle className="h-4 w-4 mr-2" />
                      Fill-in-the-Blanks
                    </TabsTrigger>
                    <TabsTrigger value="unscramble" className="justify-start data-[state=active]:bg-brand-yellow/20 data-[state=active]:text-brand-navy">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Sentence Unscramble
                    </TabsTrigger>
                    <TabsTrigger value="discussion" className="justify-start data-[state=active]:bg-brand-yellow/20 data-[state=active]:text-brand-navy">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Discussion Questions
                    </TabsTrigger>
                    <TabsTrigger value="quiz" className="justify-start data-[state=active]:bg-brand-yellow/20 data-[state=active]:text-brand-navy">
                      <Target className="h-4 w-4 mr-2" />
                      Knowledge Check Quiz
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              <div className="md:w-3/4">
                <TabsContent value="warmup" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4 text-brand-navy">Warm-up Activities</h3>
                  <p className="mb-4">Get students engaged from the very start with vocabulary previews and discussion questions to activate prior knowledge.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/warmup.PNG" alt="Warm-up Activities" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="reading" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4 text-brand-navy">Reading Text</h3>
                  <p className="mb-4">Engaging, level-appropriate reading passages on any topic you choose.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/reading.PNG" alt="Reading Text" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="vocabulary" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4 text-brand-navy">Vocabulary Practice</h3>
                  <p className="mb-4">Comprehensive vocabulary cards with definitions, pronunciations, example sentences, and word family connections.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/vocab2.PNG" alt="Vocabulary Practice" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="comprehension" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4 text-brand-navy">Comprehension Questions</h3>
                  <p className="mb-4">Multiple-choice questions that check student understanding of the reading text and reinforce key concepts.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/comprehension.PNG" alt="Comprehension Questions" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="sentence" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4 text-brand-navy">Sentence Patterns</h3>
                  <p className="mb-4">Build grammar skills with structured sentence patterns that help students understand language functions and structure.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/sentence frames.PNG" alt="Sentence Patterns" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="cloze" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4 text-brand-navy">Fill-in-the-Blanks</h3>
                  <p className="mb-4">Interactive cloze exercises that reinforce vocabulary understanding and contextual word usage.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/cloze.PNG" alt="Fill-in-the-Blanks Exercise" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="unscramble" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4 text-brand-navy">Sentence Unscramble</h3>
                  <p className="mb-4">Drag-and-drop activities that develop sentence structure understanding through word ordering exercises.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/unscrmble.PNG" alt="Sentence Unscramble Activity" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="discussion" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4 text-brand-navy">Discussion Questions</h3>
                  <p className="mb-4">Thought-provoking questions with contextual prompts that encourage critical thinking and conversational practice.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/discussion questions.PNG" alt="Discussion Questions" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="quiz" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4 text-brand-navy">Knowledge Check Quiz</h3>
                  <p className="mb-4">End-of-lesson assessments to gauge student understanding and retention of key lesson concepts.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/quiz.PNG" alt="Knowledge Check Quiz" className="w-full h-auto" />
                  </div>
                </TabsContent>
              </div>
            </div>
          </Tabs>
          
          <div className="mt-12 text-center">
            <Link href="/auth?register=true">
              <Button size="lg" className="bg-primary hover:bg-primary/90">
                Try It For Free
              </Button>
            </Link>
          </div>
        </div>
      </section>
      
      {/* Problem/Solution Section */}
      <section className="py-16 px-6 bg-gray-light">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-nunito font-bold mb-4 text-brand-navy text-center">Tired of Spending Hours on Lesson Prep?</h2>
          <p className="text-lg text-gray-600 mb-8 text-center">
            Online ESL teachers face the constant challenge of creating CEFR-aligned, engaging, and individualized lessons for one-on-one sessions. Finding the right materials takes time you could be spending teaching.
          </p>
          
          {/* Comparison */}
          <div className="grid md:grid-cols-2 gap-8 mb-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-red-100">
              <h3 className="text-xl font-semibold mb-3 text-red-600 flex items-center">
                <Clock className="h-5 w-5 mr-2" /> Traditional Lesson Planning
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>1-2 hours of hunting for materials online</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Piecing together activities from multiple sources</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Adapting content to match your student's level</span>
                </li>
                <li className="flex items-start">
                  <span className="text-red-500 mr-2">✗</span>
                  <span>Less time for actual teaching or more students</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-green-100">
              <h3 className="text-xl font-semibold mb-3 text-green-600 flex items-center">
                <Sparkles className="h-5 w-5 mr-2" /> With Plan Wise ESL
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Complete lessons generated in just 3 minutes</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>All sections perfectly integrated and cohesive</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Perfect CEFR level matching for your students</span>
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  <span>Teach more students and increase your income</span>
                </li>
              </ul>
            </div>
          </div>
          
          <p className="text-lg font-semibold text-brand-navy text-center">
            Plan Wise ESL is your solution – generate complete, ready-to-teach lessons in minutes.
          </p>
        </div>
      </section>

      {/* Features and Benefits Section */}
      <section id="features" className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-nunito font-bold text-center mb-12 text-brand-navy">Everything You Need for Effective Online Lessons</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {/* Feature 1: Time Saving */}
            <div className="feature-item">
              <Clock className="h-12 w-12 text-brand-yellow mx-auto mb-4" />
              <h3 className="text-xl font-nunito font-semibold mb-2 text-brand-navy">3-Minute Lesson Generation</h3>
              <p className="text-gray-600">Generate a full, ready-to-go lesson – complete with warm-up, vocabulary, activities, and more – in under 3 minutes, freeing you to focus on student interaction and personalized feedback, not tedious prep.</p>
            </div>
            {/* Feature 2: CEFR Alignment */}
            <div className="feature-item">
              <Target className="h-12 w-12 text-brand-yellow mx-auto mb-4" />
              <h3 className="text-xl font-nunito font-semibold mb-2 text-brand-navy">CEFR Level Selection (A1-C2)</h3>
              <p className="text-gray-600">Ensure lessons perfectly match your students' proficiency levels, ensuring every lesson perfectly targets their level and boosts their confidence.</p>
            </div>
            {/* Feature 3: One-on-One Focus */}
            <div className="feature-item">
              <MonitorSmartphone className="h-12 w-12 text-brand-yellow mx-auto mb-4" />
              <h3 className="text-xl font-nunito font-semibold mb-2 text-brand-navy">Designed for Online Teaching</h3>
              <p className="text-gray-600">Lessons are structured for easy screen sharing, making screen sharing seamless and keeping your online students engaged from start to finish.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 bg-gray-light">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-nunito font-bold mb-12 text-brand-navy">Generate Lessons in 3 Simple Steps</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="step">
              <div className="text-4xl font-bold text-brand-yellow mb-2">1</div>
              <h3 className="text-xl font-nunito font-semibold mb-2 text-brand-navy">Select CEFR Level</h3>
              <p className="text-gray-600">Choose the appropriate level (A1-C2) for your student.</p>
            </div>
            <div className="step">
              <div className="text-4xl font-bold text-brand-yellow mb-2">2</div>
              <h3 className="text-xl font-nunito font-semibold mb-2 text-brand-navy">Enter Your Topic</h3>
              <p className="text-gray-600">Provide the subject or theme for the lesson.</p>
            </div>
            <div className="step">
              <div className="text-4xl font-bold text-brand-yellow mb-2">3</div>
              <h3 className="text-xl font-nunito font-semibold mb-2 text-brand-navy">Generate Lesson</h3>
              <p className="text-gray-600">Let our AI create a complete, ready-to-teach lesson.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-6 bg-gray-light">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-3xl font-nunito font-bold text-center mb-12 text-brand-navy">
            Simple, Transparent Pricing
          </h2>
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Free Plan */}
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="font-nunito text-2xl text-center text-brand-navy">Free</CardTitle>
                <CardDescription className="text-center">For exploring and occasional use.</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-4xl font-bold text-brand-navy">$0</p>
                <ul className="text-left text-sm space-y-2 text-gray-600 list-disc list-inside">
                  <li>Access your saved lessons</li>
                  <li>Explore the public lesson library</li>
                  <li>Full access during the limited-time free trial</li>
                </ul>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/auth?register=true">
                  <Button variant="outline" className="w-full border-brand-navy text-brand-navy hover:bg-brand-navy/5">
                    Get Started
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Unlimited Plan */}
            <Card className="border-brand-yellow border-2 shadow-lg">
              <CardHeader>
                <CardTitle className="font-nunito text-2xl text-center text-brand-navy">Unlimited</CardTitle>
                <CardDescription className="text-center">For active and professional teachers.</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-4xl font-bold text-brand-navy">$19<span className="text-lg font-normal text-gray-500">/month</span></p>
                <ul className="text-left text-sm space-y-2 text-gray-600 list-disc list-inside">
                  <li><strong>Unlimited</strong> AI lesson generations</li>
                  <li>Access to all lesson components</li>
                  <li>Save and manage all your lessons</li>
                  <li>Cancel anytime</li>
                </ul>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/buy-credits">
                  <Button variant="brand" className="w-full">
                    Go Unlimited
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Social Proof/Testimonials Section */}
      <section className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-nunito font-bold mb-12 text-gray-800">Loved by Online ESL Teachers</h2>
          <div className="space-y-8">
            <blockquote className="p-6 bg-gray-100 rounded-lg shadow-sm">
              <p className="text-gray-700 italic mb-4">"As an online ESL teacher, time is my most valuable asset. This software has been a game-changer! I can now create engaging, ready-to-teach lessons in minutes, freeing up hours that I can spend focusing on my students."</p>
              <footer className="text-gray-600 font-semibold">– Sarah K., Online ESL Tutor</footer>
            </blockquote>
            <blockquote className="p-6 bg-gray-100 rounded-lg shadow-sm">
              <p className="text-gray-700 italic mb-4">"Finally, a lesson planning tool that truly understands the needs of online ESL teachers! The CEFR level alignment is fantastic, ensuring my students are always learning at the right level. It's incredibly easy to use for my one-on-one classes."</p>
              <footer className="text-gray-600 font-semibold">– David L., Independent ESL Teacher</footer>
            </blockquote>
          </div>
        </div>
      </section>

      {/* Final Call to Action Section with Stats */}
      <section className="py-20 px-6 bg-brand-navy text-brand-light text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-nunito font-bold mb-6">Ready to Revolutionize Your Lesson Planning?</h2>
          
          {/* Value proposition stats */}
          <div className="grid grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
            <div className="stat">
              <p className="text-3xl md:text-4xl font-bold text-brand-yellow">3</p>
              <p className="text-sm md:text-base">Minutes to Create Complete Lessons</p>
            </div>
            <div className="stat">
              <p className="text-3xl md:text-4xl font-bold text-brand-yellow">6+</p>
              <p className="text-sm md:text-base">Hours Saved Weekly</p>
            </div>
            <div className="stat">
              <p className="text-3xl md:text-4xl font-bold text-brand-yellow">A1-C2</p>
              <p className="text-sm md:text-base">CEFR Levels Supported</p>
            </div>
          </div>
          
          <p className="text-xl mb-8 opacity-90">
            Stop spending <span className="font-bold">3+ hours per lesson</span> on preparation. Start teaching more and planning less.
          </p>
          
          <div className="flex flex-col items-center">
            <Link href="/auth?register=true">
              <Button size="lg" variant="brand" className="font-semibold px-10 py-4">
                Get Started for Free
              </Button>
            </Link>
            <p className="text-sm mt-3 opacity-90 flex items-center justify-center">
              <LockIcon className="h-3 w-3 mr-1" />
              {isFreeTrialActive ? (
                <span>No credit card required • Unlimited lessons until {endDate}</span>
              ) : (
                <span>No credit card required • 5 free lessons included</span>
              )}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section with Schema Markup */}
      <section className="py-20 px-6 bg-white">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-nunito font-bold text-brand-navy mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Everything you need to know about PlanwiseESL and AI-powered lesson planning
            </p>
          </div>

          <div className="grid gap-6">
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-brand-navy mb-3">
                How does AI lesson planning save me time?
              </h3>
              <p className="text-gray-700">
                Our AI generates complete CEFR-leveled lessons in under 2 minutes, including vocabulary cards, reading texts, comprehension questions, and discussion activities. What used to take 3+ hours now takes minutes, saving you 15+ hours weekly.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-brand-navy mb-3">
                Are the lessons really CEFR-aligned?
              </h3>
              <p className="text-gray-700">
                Yes! Our AI is specifically trained on CEFR standards (A1-C2) and creates content appropriate for each level. Vocabulary, grammar structures, and reading complexity are automatically adjusted to match your students' proficiency level.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-brand-navy mb-3">
                Can I specify what vocabulary to target?
              </h3>
              <p className="text-gray-700">
                Yes! Before generating a lesson, you can specify particular vocabulary words you want the AI to focus on. This ensures the lesson targets exactly the language points your students need to practice.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-brand-navy mb-3">
                What topics can I create lessons about?
              </h3>
              <p className="text-gray-700">
                Any topic! From business English and travel to current events and specialized subjects. Our AI draws from extensive knowledge to create engaging, relevant content for any subject your students need to learn. <Link href="/blog/19" className="text-brand-navy hover:underline">Discover specialized niche ESL content generation</Link>.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-brand-navy mb-3">
                Is there a free trial?
              </h3>
              <p className="text-gray-700">
                Yes! Every new account includes 5 free lesson generations. No credit card required. This lets you experience how PlanwiseESL can transform your teaching before making any commitment.
              </p>
            </div>

            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-xl font-semibold text-brand-navy mb-3">
                How much does it cost after the free trial?
              </h3>
              <p className="text-gray-700">
                You can buy credits as needed or choose a subscription. Monthly plans start at just 20 credits for basic users, or you can save with our annual plan at $199/year for 250 credits (about $0.80 per lesson). Since most teachers save 15+ hours weekly, it pays for itself immediately. <Link href="/blog/16" className="text-brand-navy hover:underline">Read how teachers cut prep time by 90%</Link>.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Brand Section */}
            <div className="md:col-span-2">
              <div className="flex items-center space-x-3 mb-4">
                <img src="/PlanWise_ESL_logo.png" alt="PlanwiseESL Logo" className="h-20 w-auto" />
                <span className="text-xl font-bold">PlanwiseESL</span>
              </div>
              <p className="text-gray-300 text-sm mb-4 max-w-md">
                AI-powered ESL lesson generator created by ESL teacher Dave Jackson. 
                Transform your teaching with lessons that engage students and save you 15+ hours weekly.
              </p>
              
              {/* Social Links */}
              <div className="flex space-x-4">
                <a 
                  href="https://www.linkedin.com/in/davidjackson113" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors duration-200"
                  aria-label="Connect with Dave Jackson on LinkedIn"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                  </svg>
                  <span className="text-sm">LinkedIn</span>
                </a>
                
                <a 
                  href="https://x.com/DaveTeacher1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 text-gray-300 hover:text-blue-400 transition-colors duration-200"
                  aria-label="Follow Dave Jackson on X (Twitter)"
                >
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>
                  </svg>
                  <span className="text-sm">X (Twitter)</span>
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link href="/auth" className="text-gray-300 hover:text-white transition-colors duration-200">
                    Start Free Trial
                  </Link>
                </li>
                <li>
                  <Link href="/blog" className="text-gray-300 hover:text-white transition-colors duration-200">
                    ESL Teaching Blog
                  </Link>
                </li>
                <li>
                  <Link href="/blog/14" className="text-gray-300 hover:text-white transition-colors duration-200">
                    Dave's Story
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-semibold mb-4">About</h3>
              <ul className="space-y-2 text-sm text-gray-300">
                <li>Created by ESL Teacher</li>
                <li>CEFR-Aligned Content</li>
                <li>15+ Hours Saved Weekly</li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2025 PlanwiseESL. Created by Dave Jackson, ESL Teacher.
            </p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <span className="text-gray-400 text-xs">Built for ESL Teachers, by an ESL Teacher</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
} 