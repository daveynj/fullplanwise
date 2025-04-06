import { useState } from "react";
import { Coins } from "lucide-react";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export interface CreditBadgeProps {
  credits: number;
  size?: 'small' | 'medium' | 'large';
}

export function CreditBadge({ credits, size = 'medium' }: CreditBadgeProps) {
  // Determine size classes
  const sizeClasses = {
    small: "px-2 py-0.5 text-xs",
    medium: "px-3 py-1 text-sm",
    large: "px-4 py-2 text-base"
  };
  
  const iconClasses = {
    small: "h-3 w-3 mr-1",
    medium: "h-4 w-4 mr-1",
    large: "h-6 w-6 mr-2"
  };
  
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={`bg-gray-light rounded-full flex items-center cursor-help ${sizeClasses[size]}`}>
            <Coins className={`text-[#FFB400] ${iconClasses[size]}`} />
            <span className="font-semibold">{credits} Credits</span>
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-white shadow-lg rounded-lg p-3 w-56 text-sm z-50">
          <p className="font-semibold mb-1">Credit Balance: {credits}</p>
          <p className="text-xs text-gray-600 mb-2">Each lesson generation uses 1 credit</p>
          <Link href="/buy-credits">
            <a className="text-primary text-xs hover:underline">Buy more credits</a>
          </Link>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
