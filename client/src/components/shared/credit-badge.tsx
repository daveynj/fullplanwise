import { useState } from "react";
import { Coins } from "lucide-react";
import { Link } from "wouter";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CreditBadgeProps {
  credits: number;
}

export function CreditBadge({ credits }: CreditBadgeProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="bg-gray-light px-3 py-1 rounded-full flex items-center cursor-help">
            <Coins className="text-[#FFB400] mr-1 h-4 w-4" />
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
