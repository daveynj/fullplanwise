import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { LogOut, Home, Wand2, Users, Book, Settings, CreditCard, Shield, Library, Sparkles } from "lucide-react";
import { useFreeTrial } from "@/hooks/use-free-trial";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isFreeTrialActive } = useFreeTrial();

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <Home className="mr-3 text-2xl" /> },
    { path: "/generate", label: "Generate Lesson", icon: <Wand2 className="mr-3 text-2xl" /> },
    { path: "/history", label: "My Lessons", icon: <Book className="mr-3 text-2xl" /> },
    { path: "/public-library", label: "Public Library", icon: <Library className="mr-3 text-2xl" /> },
    { path: "/students", label: "Students", icon: <Users className="mr-3 text-2xl" /> },
  ];
  
  // Function to render nav items without nested <a> tags
  const renderNavItem = (item: { path: string, label: string, icon: React.ReactNode }) => (
    <li key={item.path}>
      <Link href={item.path}>
        <div className={`flex items-center p-3 rounded-lg transition cursor-pointer ${
          location === item.path 
          ? "bg-brand-yellow/20 text-brand-yellow" 
          : "text-brand-light hover:bg-brand-navy-light"
        }`}>
          {item.icon}
          <span className="text-base font-medium">{item.label}</span>
        </div>
      </Link>
    </li>
  );

  const accountItems = [
    { path: "/settings", label: "Settings", icon: <Settings className="mr-3 text-2xl" /> },
    { path: "/buy-credits", label: "Subscription", icon: <CreditCard className="mr-3 text-2xl" /> },
  ];
  
  // Admin items - only visible to admin users
  const adminItems = [
    { path: "/admin", label: "Admin Dashboard", icon: <Shield className="mr-3 text-2xl" /> },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo and brand */}
      <div className="p-4 flex items-center border-b border-brand-navy-light">
        <img src="/PlanWise_ESL_logo.png" alt="Plan Wise ESL Logo" className="h-8 w-auto mr-2" /> 
        <span className="font-nunito font-bold text-xl text-brand-yellow">PLAN WISE ESL</span>
      </div>
      
      {/* Navigation - Now with overflow handling */}
      <nav className="flex-1 overflow-y-auto py-2">
        <div className="px-4">
          <div className="mb-2 text-sm font-semibold uppercase text-brand-light/70 pl-2">Main</div>
          <ul className="space-y-1 mb-4">
            {navItems.map(renderNavItem)}
          </ul>
          
          {/* Admin Section - Only visible to admin users */}
          {user?.isAdmin && (
            <>
              <div className="mb-2 mt-4 text-sm font-semibold uppercase text-brand-light/70 pl-2">Admin</div>
              <ul className="space-y-1 mb-4">
                {adminItems.map(renderNavItem)}
              </ul>
            </>
          )}
          
          <div className="mb-2 mt-4 text-sm font-semibold uppercase text-brand-light/70 pl-2">Account</div>
          <ul className="space-y-1 mb-4">
            {accountItems.map(renderNavItem)}
            <li>
              <Button 
                variant="link" 
                className="w-full flex items-center p-3 rounded-lg text-brand-light hover:bg-brand-navy-light transition justify-start"
                onClick={handleLogout}
              >
                <LogOut className="mr-3 text-2xl" />
                <span className="text-base font-medium">Logout</span>
              </Button>
            </li>
          </ul>
        </div>
      </nav>
      
      {/* Subscription status - fixed at bottom */}
      <div className="p-4 mt-auto">
        <div className="bg-brand-navy-light p-4 rounded-lg shadow-md text-center">
          <Sparkles className="mx-auto text-brand-yellow h-6 w-6 mb-2" />
          <p className="text-sm font-medium text-brand-light/80">Subscription Status</p>
          <p className="text-lg font-nunito font-bold text-brand-light">
            {isFreeTrialActive ? "Free Trial" : (user?.subscriptionTier === 'unlimited' ? 'Unlimited' : 'Free Tier')}
          </p>
          {!isFreeTrialActive && user?.subscriptionTier !== 'unlimited' && (
             <Button 
              variant="brand"
              className="font-bold px-3 py-2 rounded-lg text-sm shadow-sm mt-3 w-full"
              onClick={() => setLocation('/buy-credits')}
            >
              Upgrade to Unlimited
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile nav toggle */}
      <div className="md:hidden bg-brand-navy text-brand-light flex items-center justify-between p-4 border-b border-brand-navy-light">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-md bg-brand-light flex items-center justify-center mr-2">
            <span className="text-brand-navy text-lg font-bold">P</span>
          </div>
          <h1 className="font-nunito font-bold text-lg">PLAN WISE ESL</h1>
        </div>
        <button onClick={toggleMobileMenu} className="text-brand-light focus:outline-none">
          {isMobileMenuOpen ? (
            <span className="text-2xl">×</span>
          ) : (
            <span className="text-2xl">☰</span>
          )}
        </button>
      </div>
      
      {/* Sidebar for mobile (collapsible) */}
      <div className={`md:hidden bg-brand-navy text-brand-light fixed top-0 left-0 z-30 w-full h-full transform ${
        isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
      } transition-transform duration-300 ease-in-out`}>
        {sidebarContent}
      </div>
      
      {/* Sidebar for desktop */}
      <div className="hidden md:block md:w-64 bg-brand-navy text-brand-light flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>
    </>
  );
}
