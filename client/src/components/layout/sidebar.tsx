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
    { path: "/", label: "Dashboard", icon: <Home className="mr-3 text-xl" /> },
    { path: "/generate", label: "Generate Lesson", icon: <Wand2 className="mr-3 text-xl" /> },
    { path: "/students", label: "Students", icon: <Users className="mr-3 text-xl" /> },
    { path: "/history", label: "Lesson History", icon: <Book className="mr-3 text-xl" /> },
  ];
  
  // Function to render nav items without nested <a> tags
  const renderNavItem = (item: { path: string, label: string, icon: React.ReactNode }) => (
    <li key={item.path} className="mb-2">
      <Link href={item.path}>
        <div className={`flex items-center p-3 rounded-lg hover:bg-primary-light transition cursor-pointer ${
          location === item.path ? "bg-primary-light text-white" : "text-white"
        }`}>
          {item.icon}
          <span>{item.label}</span>
        </div>
      </Link>
    </li>
  );

  const accountItems = [
    { path: "/settings", label: "Settings", icon: <Settings className="mr-3 text-xl" /> },
    { path: "/buy-credits", label: "Buy Credits", icon: <CreditCard className="mr-3 text-xl" /> },
  ];
  
  // Admin items - only visible to admin users
  const adminItems = [
    { path: "/admin", label: "Admin Dashboard", icon: <Shield className="mr-3 text-xl" /> },
  ];

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const sidebarContent = (
    <>
      {/* Logo and brand */}
      <div className="p-5 flex items-center border-b border-primary-light">
        <img src="/PlanWise_ESL_logo.png" alt="Plan Wise ESL Logo" className="h-8 w-auto mr-2" /> 
        <span className="font-nunito font-bold text-xl text-white">PLAN WISE ESL</span>
      </div>
      
      {/* Navigation */}
      <nav className="p-4">
        <div className="mb-3 text-sm font-semibold uppercase text-blue-200 pl-3">Main</div>
        <ul>
          {navItems.map(renderNavItem)}
        </ul>
        
        {/* Admin Section - Only visible to admin users */}
        {user?.isAdmin && (
          <>
            <div className="mb-3 mt-6 text-sm font-semibold uppercase text-blue-200 pl-3">Admin</div>
            <ul>
              {adminItems.map(renderNavItem)}
            </ul>
          </>
        )}
        
        <div className="mb-3 mt-6 text-sm font-semibold uppercase text-blue-200 pl-3">Account</div>
        <ul>
          {accountItems.map(renderNavItem)}
          <li className="mb-2">
            <Button 
              variant="link" 
              className="w-full flex items-center p-3 rounded-lg text-white hover:bg-primary-light transition justify-start"
              onClick={handleLogout}
            >
              <LogOut className="mr-3 text-xl" />
              <span>Logout</span>
            </Button>
          </li>
        </ul>
      </nav>
      
      {/* Credit counter */}
      <div className="mt-auto p-4 bg-primary-light mx-4 my-4 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-blue-200">Available Credits</p>
            <p className="text-2xl font-nunito font-bold text-white">{user?.credits || 0}</p>
          </div>
          <Button 
            className="bg-accent text-text font-semibold px-3 py-2 rounded-lg text-sm hover:bg-amber-300 transition"
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
      <div className="md:hidden bg-primary text-white flex items-center justify-between p-4 border-b border-primary-light">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-md bg-white flex items-center justify-center mr-2">
            <span className="text-primary text-xl font-bold">P</span>
          </div>
          <h1 className="font-nunito font-bold text-xl">PLAN WISE ESL</h1>
        </div>
        <button onClick={toggleMobileMenu} className="text-white focus:outline-none">
          {isMobileMenuOpen ? (
            <span className="text-2xl">×</span>
          ) : (
            <span className="text-2xl">☰</span>
          )}
        </button>
      </div>
      
      {/* Sidebar for mobile (collapsible) */}
      <div className={`md:hidden bg-primary text-white absolute z-30 w-full transform ${
        isMobileMenuOpen ? "translate-y-0" : "-translate-y-full"
      } transition-transform duration-300 ease-in-out`}>
        {sidebarContent}
      </div>
      
      {/* Sidebar for desktop */}
      <div className="hidden md:block md:w-64 bg-primary text-white flex-shrink-0 h-screen sticky top-0">
        {sidebarContent}
      </div>
    </>
  );
}
