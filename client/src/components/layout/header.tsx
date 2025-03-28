import { useAuth } from "@/hooks/use-auth";
import { CreditBadge } from "@/components/shared/credit-badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuLabel, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Link } from "wouter";
import { Search, Bell, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";

export function Header() {
  const { user, logoutMutation } = useAuth();
  
  const handleLogout = () => {
    logoutMutation.mutate();
  };
  
  const getInitials = (name: string) => {
    if (!name) return "";
    return name
      .split(" ")
      .map(part => part[0])
      .join("")
      .toUpperCase();
  };

  return (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between px-6 py-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <Input 
              type="text" 
              placeholder="Search..." 
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400 h-5 w-5" />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <CreditBadge credits={user?.credits || 0} />
          
          {user?.subscriptionTier === "premium" && (
            <div className="bg-[#28A745] text-white px-3 py-1 rounded-full text-sm flex items-center">
              <Bell className="mr-1 h-4 w-4" />
              <span>Premium</span>
            </div>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center focus:outline-none">
              <Avatar className="w-8 h-8 rounded-full">
                <AvatarFallback className="bg-primary text-white">
                  {getInitials(user?.fullName || "")}
                </AvatarFallback>
              </Avatar>
              <span className="ml-2 font-semibold hidden md:block">
                {user?.fullName}
              </span>
              <ChevronDown className="ml-1 h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Link href="/settings">
                <DropdownMenuItem className="cursor-pointer">
                  Profile Settings
                </DropdownMenuItem>
              </Link>
              <Link href="/buy-credits">
                <DropdownMenuItem className="cursor-pointer">
                  Buy Credits
                </DropdownMenuItem>
              </Link>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="cursor-pointer" onClick={handleLogout}>
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
