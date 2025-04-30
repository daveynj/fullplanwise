import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { CreditBadge } from "@/components/shared/credit-badge";
import { LogOut, Home, Wand2, Users, Book, Settings, CreditCard, Shield } from "lucide-react";

export function Sidebar() {
  const [location, setLocation] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: <Home className="mr-3 text-2xl" /> },
    { path: "/generate", label: "Generate Lesson", icon: <Wand2 className="mr-3 text-2xl" /> },
    { path: "/students", label: "Students", icon: <Users className="mr-3 text-2xl" /> },
    { path: "/history", label: "Lesson Library", icon: <Book className="mr-3 text-2xl" /> },
  ];
  
  // Function to render nav items without nested <a> tags
  const renderNavItem = (item: { path: string, label: string, icon: React.ReactNode }) => (
    <li key={item.path} className="mb-3">
      <Link href={item.path}>
        <div className={`flex items-center p-4 rounded-lg transition cursor-pointer ${
          location === item.path 
          ? "bg-brand-yellow/20 text-brand-yellow" 
          : "text-brand-light hover:bg-brand-navy-light"
        }`}>
          {item.icon}
          <span className="text-lg font-medium">{item.label}</span>
        </div>
      </Link>
    </li>
  );

  const accountItems = [
    { path: "/settings", label: "Settings", icon: <Settings className="mr-3 text-2xl" /> },
    { path: "/buy-credits", label: "Buy Credits", icon: <CreditCard className="mr-3 text-2xl" /> },
  ];
  
  // Admin items - only visible to admin users
  const adminItems = [
    { path: "/admin", label: "Admin Dashboard", icon: <Shield className="mr-3 text-2xl" /> },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const sidebarContent = (
    <>
      {/* Logo and brand */}
      <div className="p-5 flex items-center border-b border-brand-navy-light">
        <img src="/PlanWise_ESL_logo.png" alt="Plan Wise ESL Logo" className="h-10 w-auto mr-3" /> 
        <span className="font-nunito font-bold text-2xl text-brand-yellow">PLAN WISE ESL</span>
      </div>
      
      {/* Navigation */}
      <nav className="p-4">
        <div className="mb-4 text-base font-semibold uppercase text-brand-light/70 pl-3">Main</div>
        <ul>
          {navItems.map(renderNavItem)}
        </ul>
        
        {/* Admin Section - Only visible to admin users */}
        {user?.isAdmin && (
          <>
            <div className="mb-4 mt-6 text-base font-semibold uppercase text-brand-light/70 pl-3">Admin</div>
            <ul>
              {adminItems.map(renderNavItem)}
            </ul>
          </>
        )}
        
        <div className="mb-4 mt-6 text-base font-semibold uppercase text-brand-light/70 pl-3">Account</div>
        <ul>
          {accountItems.map(renderNavItem)}
          <li className="mb-3">
            <Button 
              variant="link" 
              className="w-full flex items-center p-4 rounded-lg text-brand-light hover:bg-brand-navy-light transition justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 text-2xl" />
              <span className="text-lg font-medium">Logout</span>
            </Button>
          </li>
        </ul>
      </nav>
      
      {/* Credit counter */}
      <div className="mt-auto p-5 bg-brand-navy-light mx-4 my-4 rounded-lg shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-base font-medium text-brand-light/80">Available Credits</p>
            <p className="text-3xl font-nunito font-bold text-brand-light">{user?.credits || 0}</p>
          </div>
          <Button 
            variant="brand"
            className="font-bold px-4 py-3 rounded-lg text-base shadow-sm"
            onClick={() => setLocation('/buy-credits')}
          >
            Buy More
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Mobile nav toggle */}
      <div className="md:hidden bg-brand-navy text-brand-light flex items-center justify-between p-4 border-b border-brand-navy-light">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-md bg-brand-light flex items-center justify-center mr-2">
            <span className="text-brand-navy text-xl font-bold">P</span>
          </div>
          <h1 className="font-nunito font-bold text-xl">PLAN WISE ESL</h1>
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
      <div className={`md:hidden bg-brand-navy text-brand-light absolute z-30 w-full transform ${
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
