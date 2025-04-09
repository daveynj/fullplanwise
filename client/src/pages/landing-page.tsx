import React from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
// Import icons as needed, e.g., from lucide-react
import { Clock, Target, MonitorSmartphone } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen font-open-sans">
      {/* Header/Navigation */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
          <div className="text-xl font-nunito font-bold text-primary">Plan Wise ESL</div>
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

      {/* Hero Section */}
      <section className="bg-primary text-white py-20 px-6 text-center">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-4xl md:text-5xl font-nunito font-bold mb-4">
            Instantly Create Engaging ESL Lessons with AI
          </h1>
          <p className="text-xl md:text-2xl mb-8 opacity-90">
            Save Hours on Lesson Planning and Focus on Teaching Your Online ESL Students More Effectively.
          </p>
          {/* YouTube Video Embed */}
          <div className="aspect-video mb-8 rounded-lg overflow-hidden shadow-lg max-w-3xl mx-auto">
            <iframe 
              className="w-full h-full"
              src="https://www.youtube.com/embed/pcLlwL5sNK0" 
              title="YouTube video player" 
              frameBorder="0" 
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
              referrerPolicy="strict-origin-when-cross-origin" 
              allowFullScreen
            ></iframe>
          </div>
          <div>
            <Link href="/auth?register=true">
              <Button size="lg" className="bg-accent hover:bg-accent/90 text-primary font-semibold mr-4 px-8 py-3">
                Start Your Free Trial
              </Button>
            </Link>
            <Link href="#features"> {/* Link to features section */}
              <Button size="lg" variant="outline" className="text-white border-white hover:bg-white hover:text-primary px-8 py-3">
                Explore Features
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
            ESL Lesson AI is your solution – generate complete, ready-to-teach lessons in minutes.
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
              <p className="text-gray-600">Generate a full, ready-to-go lesson – complete with warm-up, vocabulary, activities, and more – in under 3 minutes. Reclaim your valuable time.</p>
            </div>
            {/* Feature 2: CEFR Alignment */}
            <div className="feature-item">
              <Target className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-nunito font-semibold mb-2">CEFR Level Selection (A1-C2)</h3>
              <p className="text-gray-600">Ensure lessons perfectly match your students' proficiency levels for optimal learning and engagement.</p>
            </div>
            {/* Feature 3: One-on-One Focus */}
            <div className="feature-item">
              <MonitorSmartphone className="h-12 w-12 text-primary mx-auto mb-4" />
              <h3 className="text-xl font-nunito font-semibold mb-2">Designed for Online Teaching</h3>
              <p className="text-gray-600">Lessons are structured for easy screen sharing and adaptable for individual student needs in a virtual setting.</p>
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