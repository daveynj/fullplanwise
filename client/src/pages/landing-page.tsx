import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
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
  Lightbulb, CheckCircle, Sparkles, Layers, Puzzle, Database 
} from 'lucide-react';

// Screenshots are served from public directory

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen font-open-sans">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          {/* Combine logo and text */}
          <div className="flex items-center gap-2">
            <img src="/PlanWise_ESL_logo.png" alt="Plan Wise ESL Logo" className="h-8 w-auto" /> {/* Slightly reduced height */} 
            <span className="text-xl font-nunito font-bold text-primary">PLAN WISE ESL</span>
          </div>
          <div>
            <Link href="/auth">
              <Button variant="outline" className="mr-2">Login</Button>
            </Link>
            <Link href="/auth?register=true">
              <Button className="bg-primary hover:bg-primary/90">Sign Up Free</Button>
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section with Lesson Preview */}
      <section className="bg-primary text-white py-16 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-8">
            {/* Hero Text Column */}
            <div className="text-center lg:text-left lg:w-1/2">
              <h1 className="text-4xl md:text-5xl font-nunito font-bold mb-4">
                Instantly Create Engaging ESL Lessons with AI
              </h1>
              <p className="text-xl md:text-2xl mb-8 opacity-90">
                Save Hours on Lesson Planning and Focus on Teaching Your Online ESL Students More Effectively.
              </p>
              <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 mb-8">
                <Link href="/auth?register=true">
                  <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-semibold px-8 py-3 w-full sm:w-auto">
                    Start Your Free Trial
                  </Button>
                </Link>
                <a href="#features"> {/* Use standard anchor for in-page scroll */}
                  <Button size="lg" variant="outline" className="bg-transparent text-white border-white hover:bg-white/20 px-8 py-3 w-full sm:w-auto">
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
              <div className="bg-white rounded-xl overflow-hidden shadow-xl">
                <img 
                  src="/reading.PNG" 
                  alt="ESL Lesson Preview" 
                  className="w-full h-auto rounded-t-xl" 
                />
                <div className="p-4 text-gray-800">
                  <h3 className="text-xl font-semibold text-primary">AI-Generated Lessons in Minutes</h3>
                  <p className="text-gray-600">Complete lessons with reading, vocabulary, activities, and assessments.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lesson Showcase Section - NEW */}
      <section className="py-16 px-6 bg-white border-b border-gray-200">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-nunito font-bold mb-4 text-gray-800">See Real AI-Generated Lessons</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Each lesson comes with a complete suite of activities - from warm-up exercises to vocabulary practice, 
              reading comprehension, interactive activities, and assessment tools.
            </p>
          </div>
          
          <Tabs defaultValue="reading" className="w-full">
            <div className="flex flex-col md:flex-row gap-6">
              <div className="md:w-1/4">
                <div className="sticky top-24">
                  <h3 className="text-xl font-nunito font-semibold mb-4 text-gray-800">Lesson Components</h3>
                  <p className="text-sm text-gray-600 mb-4">Click to explore each section of a complete ESL lesson</p>
                  <TabsList className="flex flex-col space-y-1 h-auto bg-transparent">
                    <TabsTrigger value="warmup" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Warm-up Activities
                    </TabsTrigger>
                    <TabsTrigger value="reading" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <BookOpen className="h-4 w-4 mr-2" />
                      Reading Text
                    </TabsTrigger>
                    <TabsTrigger value="vocabulary" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <Database className="h-4 w-4 mr-2" />
                      Vocabulary Practice
                    </TabsTrigger>
                    <TabsTrigger value="comprehension" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Comprehension Questions
                    </TabsTrigger>
                    <TabsTrigger value="sentence" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <Layers className="h-4 w-4 mr-2" />
                      Sentence Patterns
                    </TabsTrigger>
                    <TabsTrigger value="cloze" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <Puzzle className="h-4 w-4 mr-2" />
                      Fill-in-the-Blanks
                    </TabsTrigger>
                    <TabsTrigger value="unscramble" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <Sparkles className="h-4 w-4 mr-2" />
                      Sentence Unscramble
                    </TabsTrigger>
                    <TabsTrigger value="discussion" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Discussion Questions
                    </TabsTrigger>
                    <TabsTrigger value="quiz" className="justify-start data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
                      <Target className="h-4 w-4 mr-2" />
                      Knowledge Check Quiz
                    </TabsTrigger>
                  </TabsList>
                </div>
              </div>
              
              <div className="md:w-3/4">
                <TabsContent value="warmup" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4">Warm-up Activities</h3>
                  <p className="mb-4">Get students engaged from the very start with vocabulary previews and discussion questions to activate prior knowledge.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/warmup.PNG" alt="Warm-up Activities" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="reading" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4">Reading Text</h3>
                  <p className="mb-4">Engaging, level-appropriate content on interesting topics that captures student interest while introducing key vocabulary.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/reading.PNG" alt="Reading Text" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="vocabulary" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4">Vocabulary Practice</h3>
                  <p className="mb-4">Comprehensive vocabulary cards with definitions, pronunciations, example sentences, and word family connections.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/vocab2.PNG" alt="Vocabulary Practice" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="comprehension" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4">Comprehension Questions</h3>
                  <p className="mb-4">Multiple-choice questions that check student understanding of the reading text and reinforce key concepts.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/comprehension.PNG" alt="Comprehension Questions" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="sentence" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4">Sentence Patterns</h3>
                  <p className="mb-4">Build grammar skills with structured sentence patterns that help students understand language functions and structure.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/sentence frames.PNG" alt="Sentence Patterns" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="cloze" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4">Fill-in-the-Blanks</h3>
                  <p className="mb-4">Interactive cloze exercises that reinforce vocabulary understanding and contextual word usage.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/cloze.PNG" alt="Fill-in-the-Blanks Exercise" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="unscramble" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4">Sentence Unscramble</h3>
                  <p className="mb-4">Drag-and-drop activities that develop sentence structure understanding through word ordering exercises.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/images/unscrmble.PNG" alt="Sentence Unscramble Activity" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="discussion" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4">Discussion Questions</h3>
                  <p className="mb-4">Thought-provoking questions with contextual prompts that encourage critical thinking and conversational practice.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/images/discussion questions.PNG" alt="Discussion Questions" className="w-full h-auto" />
                  </div>
                </TabsContent>
                
                <TabsContent value="quiz" className="mt-0 border rounded-lg shadow-sm p-4 bg-gray-50">
                  <h3 className="text-xl font-semibold mb-4">Knowledge Check Quiz</h3>
                  <p className="mb-4">End-of-lesson assessments to gauge student understanding and retention of key lesson concepts.</p>
                  <div className="rounded-lg overflow-hidden border shadow-md">
                    <img src="/images/quiz.PNG" alt="Knowledge Check Quiz" className="w-full h-auto" />
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
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-nunito font-bold mb-4 text-gray-800">Tired of Spending Hours on Lesson Prep?</h2>
          <p className="text-lg text-gray-600 mb-8">
            Online ESL teachers face the constant challenge of creating CEFR-aligned, engaging, and individualized lessons for one-on-one sessions. Finding the right materials takes time you could be spending teaching.
          </p>
          <p className="text-lg font-semibold text-primary">
            Plan Wise ESL is your solution – generate complete, ready-to-teach lessons in minutes.
          </p>
        </div>
      </section>

      {/* Features and Benefits Section */}
      <section id="features" className="py-16 px-6 bg-white">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-nunito font-bold text-center mb-12 text-gray-800">Everything You Need for Effective Online Lessons</h2>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {/* Feature 1: Time Saving */}
            <div className="feature-item">
              <Clock className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-nunito font-semibold mb-2">3-Minute Lesson Generation</h3>
              <p className="text-gray-600">Generate a full, ready-to-go lesson – complete with warm-up, vocabulary, activities, and more – in under 3 minutes, freeing you to focus on student interaction and personalized feedback, not tedious prep.</p>
            </div>
            {/* Feature 2: CEFR Alignment */}
            <div className="feature-item">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-nunito font-semibold mb-2">CEFR Level Selection (A1-C2)</h3>
              <p className="text-gray-600">Ensure lessons perfectly match your students' proficiency levels, ensuring every lesson perfectly targets their level and boosts their confidence.</p>
            </div>
            {/* Feature 3: One-on-One Focus */}
            <div className="feature-item">
              <MonitorSmartphone className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-nunito font-semibold mb-2">Designed for Online Teaching</h3>
              <p className="text-gray-600">Lessons are structured for easy screen sharing, making screen sharing seamless and keeping your online students engaged from start to finish.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-6 bg-gray-light">
        <div className="container mx-auto max-w-4xl text-center">
          <h2 className="text-3xl font-nunito font-bold mb-12 text-gray-800">Generate Lessons in 3 Simple Steps</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="step">
              <div className="text-4xl font-bold text-primary mb-2">1</div>
              <h3 className="text-xl font-nunito font-semibold mb-2">Select CEFR Level</h3>
              <p className="text-gray-600">Choose the appropriate level (A1-C2) for your student.</p>
            </div>
            <div className="step">
              <div className="text-4xl font-bold text-primary mb-2">2</div>
              <h3 className="text-xl font-nunito font-semibold mb-2">Enter Your Topic</h3>
              <p className="text-gray-600">Provide the subject or theme for the lesson.</p>
            </div>
            <div className="step">
              <div className="text-4xl font-bold text-primary mb-2">3</div>
              <h3 className="text-xl font-nunito font-semibold mb-2">Generate Lesson</h3>
              <p className="text-gray-600">Let our AI create a complete, ready-to-teach lesson.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-16 px-6 bg-gray-light">
        <div className="container mx-auto max-w-5xl">
          <h2 className="text-3xl font-nunito font-bold text-center mb-12 text-gray-800">
            Simple, Flexible Pricing
          </h2>
          <p className="text-lg text-gray-600 text-center mb-12 max-w-3xl mx-auto">
            Try Plan Wise ESL completely free with 5 credits (that's 5 full lessons!). See the time-saving power for yourself. 
            After your trial, choose a flexible plan or buy credits as you go – purchased credits never expire.
          </p>
          
          <div className="grid md:grid-cols-1 lg:grid-cols-3 gap-8 items-start"> 
            {/* Card 1: Free Trial */}
            <Card className="border-primary border-2 shadow-lg"> 
              <CardHeader>
                <CardTitle className="font-nunito text-center">Try Us For Free</CardTitle>
                <CardDescription className="text-center">Get started without any commitment.</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-4xl font-bold text-primary">5 Free Credits</p>
                <p className="text-gray-600">Generate your first few lessons on us!</p>
                 <ul className="text-left text-sm space-y-1 text-gray-600 list-disc list-inside">
                    <li>Access all generation features</li>
                    <li>No credit card required</li>
                    <li>See how much time you save</li>
                 </ul>
              </CardContent>
              <CardFooter className="flex justify-center">
                <Link href="/auth?register=true">
                  <Button className="bg-primary hover:bg-primary/90 w-full">Start Free Trial</Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Card 2: Pay As You Go Highlight */}
            <Card className="shadow-sm">
              <div className="bg-secondary text-secondary-foreground text-center py-1 text-sm font-semibold rounded-t-lg">PAY AS YOU GO</div>
              <CardHeader>
                <CardTitle className="font-nunito text-center">Standard Pack</CardTitle>
                <CardDescription className="text-center">Our most popular flexible option.</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                 <p className="text-4xl font-bold">$60</p>
                 <p className="text-xl font-semibold">50 Credits</p>
                 <p className="text-gray-500 text-sm">($1.20 per lesson)</p>
                 <p className="text-gray-600 text-sm">Perfect for occasional use. Credits never expire.</p>
              </CardContent>
              <CardFooter className="flex justify-center">
                 <Link href="/buy-credits">
                   <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">See All Packs</Button>
                </Link>
              </CardFooter>
            </Card>

            {/* Card 3: Subscription Highlight */}
            <Card className="shadow-sm">
               <div className="bg-accent text-accent-foreground text-center py-1 text-sm font-semibold rounded-t-lg">SUBSCRIPTION</div>
              <CardHeader>
                <CardTitle className="font-nunito text-center">Annual Plan</CardTitle>
                <CardDescription className="text-center">Best value for regular users.</CardDescription>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                 <p className="text-4xl font-bold">$199<span className="text-lg font-normal text-gray-500">/year</span></p>
                 <p className="text-xl font-semibold">250 Credits</p>
                 <p className="text-gray-500 text-sm">(~$0.80 per lesson)</p>
                 <p className="text-gray-600 text-sm">Save 32%! Incl. priority support & advanced features.</p>
              </CardContent>
              <CardFooter className="flex justify-center">
                 <Link href="/buy-credits?tab=subscription"> 
                   <Button variant="outline" className="w-full border-primary text-primary hover:bg-primary/5">See All Plans</Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
          
          {/* Link to full pricing */}
          <p className="text-center text-gray-500 mt-8 text-sm">
             Need more options or monthly plans? <Link href="/buy-credits" className="text-primary hover:underline font-semibold">View full pricing details</Link>.
          </p>
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

      {/* Final Call to Action Section */}
      <section className="py-20 px-6 bg-primary text-white text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-nunito font-bold mb-6">Ready to Revolutionize Your Lesson Planning?</h2>
          <p className="text-xl mb-8 opacity-90">
            Sign up today and get your first few lesson credits free! Start creating amazing ESL lessons in minutes.
          </p>
          <Link href="/auth?register=true">
            <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-semibold px-10 py-4">
              Get Started for Free
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-gray-400 py-8 px-6 text-center">
        <div className="container mx-auto">
          <p>&copy; {new Date().getFullYear()} Plan Wise ESL. All rights reserved.</p>
          <div className="mt-4">
            <a href="mailto:dave@planwiseesl.com" className="hover:text-white">Contact Me</a>
            {/* Add other links as needed */}
          </div>
        </div>
      </footer>
    </div>
  );
} 