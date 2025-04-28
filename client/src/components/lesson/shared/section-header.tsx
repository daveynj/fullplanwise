import React, { ReactNode } from 'react';
import { LucideIcon, Info } from 'lucide-react';

interface SectionHeaderProps {
  title: string;
  description?: string;
  instructions?: string | ReactNode;
  icon: LucideIcon | ReactNode;
  color: 'blue' | 'purple' | 'cyan' | 'green' | 'amber' | 'red' | 'pink' | 'indigo';
  className?: string;
  rightContent?: ReactNode;
  showInstructions?: boolean; // Controls whether to show instructions initially
}

// Mapping of color names to TailwindCSS color classes
const colorMap = {
  blue: {
    bg: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-500',
    lightBg: 'bg-blue-50/50',
    lightBorder: 'border-blue-100',
  },
  indigo: {
    bg: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    icon: 'text-indigo-500',
    lightBg: 'bg-indigo-50/50',
    lightBorder: 'border-indigo-100',
  },
  purple: {
    bg: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: 'text-purple-500',
    lightBg: 'bg-purple-50/50',
    lightBorder: 'border-purple-100',
  },
  cyan: {
    bg: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    icon: 'text-cyan-500',
    lightBg: 'bg-cyan-50/50',
    lightBorder: 'border-cyan-100',
  },
  green: {
    bg: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-500',
    lightBg: 'bg-green-50/50',
    lightBorder: 'border-green-100',
  },
  amber: {
    bg: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-500',
    lightBg: 'bg-amber-50/50',
    lightBorder: 'border-amber-100',
  },
  red: {
    bg: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-500',
    lightBg: 'bg-red-50/50',
    lightBorder: 'border-red-100',
  },
  pink: {
    bg: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-700',
    icon: 'text-pink-500',
    lightBg: 'bg-pink-50/50',
    lightBorder: 'border-pink-100',
  }
};

export function SectionHeader({ 
  title, 
  description, 
  instructions,
  icon, 
  color,
  className = '',
  rightContent,
  showInstructions = true
}: SectionHeaderProps) {
  const colors = colorMap[color];
  
  // Render icon based on its type
  const renderIcon = () => {
    if (React.isValidElement(icon)) {
      // If it's already a React element, return it
      return React.cloneElement(icon as React.ReactElement, {
        className: `h-6 w-6 ${colors.icon} flex-shrink-0`
      });
    } else if (typeof icon === 'function') {
      // If it's a Lucide icon component
      const IconComponent = icon as LucideIcon;
      return <IconComponent className={`h-6 w-6 ${colors.icon} flex-shrink-0`} />;
    }
    return null;
  };
  
  return (
    <div className={`mb-5 ${className}`}>
      {/* Main header */}
      <div className={`${colors.bg} rounded-lg p-4 flex items-center gap-3 border ${colors.border} shadow-sm`}>
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow-sm border border-gray-100">
          {renderIcon()}
        </div>
        <div className="flex-1">
          <h2 className={`${colors.text} font-semibold text-xl leading-tight`}>{title}</h2>
          {description && (
            <p className="text-gray-600 mt-1 text-base">
              {description}
            </p>
          )}
        </div>
        {rightContent && (
          <div className="flex-shrink-0">
            {rightContent}
          </div>
        )}
      </div>

      {/* Optional instructions box */}
      {instructions && showInstructions && (
        <div className={`mt-2 p-3 ${colors.lightBg} border ${colors.lightBorder} rounded-md`}>
          <div className="flex gap-2">
            <Info className={`h-5 w-5 ${colors.icon} flex-shrink-0 mt-0.5`} />
            <div className="text-gray-700">
              {typeof instructions === 'string' ? (
                <p className="text-base">{instructions}</p>
              ) : (
                instructions
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}