import { useState } from 'react';
import { Link } from 'wouter';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export function BlogHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-brand-light shadow-sm sticky top-0 z-50">
      <nav className="container mx-auto px-6 py-3 flex justify-between items-center">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <img src="/PlanWise_ESL_logo.png" alt="PlanwiseESL AI-powered ESL lesson generator logo" className="h-16 sm:h-20 w-auto" /> 
            <span className="text-lg sm:text-xl font-nunito font-bold text-brand-navy">PLAN WISE ESL</span>
          </div>
        </Link>
        
        <div className="hidden md:flex items-center gap-4">
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

        <button
          className="md:hidden p-2 text-brand-navy hover:bg-brand-navy/10 rounded"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </nav>

      <div className={`md:hidden bg-brand-light border-t border-gray-200 py-4 px-6 space-y-3 transition-all duration-300 ease-in-out overflow-hidden ${
        mobileMenuOpen ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0 py-0'
      }`}>
        <Link href="/blog" onClick={() => setMobileMenuOpen(false)}>
          <Button variant="ghost" className="w-full justify-start text-brand-navy hover:bg-brand-navy/10">
            Blog
          </Button>
        </Link>
        <Link href="/auth" onClick={() => setMobileMenuOpen(false)}>
          <Button variant="outline" className="w-full border-brand-navy text-brand-navy hover:bg-brand-navy/10">
            Login
          </Button>
        </Link>
        <Link href="/auth?register=true" onClick={() => setMobileMenuOpen(false)}>
          <Button variant="brand" className="w-full">
            Sign Up Free
          </Button>
        </Link>
      </div>
    </header>
  );
}
