import React, { ReactNode } from 'react';
import { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface SectionCardProps {
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: LucideIcon | ReactNode;
  color?: 'blue' | 'purple' | 'cyan' | 'green' | 'amber' | 'red' | 'pink' | 'indigo' | 'default';
  className?: string;
  children: ReactNode;
  headerRight?: ReactNode;
  noPadding?: boolean;
}

// Mapping of color names to TailwindCSS color classes
const colorMap = {
  default: {
    header: 'bg-gray-50',
    border: 'border-gray-200',
    text: 'text-gray-700',
    icon: 'text-gray-500',
  },
  blue: {
    header: 'bg-blue-50',
    border: 'border-blue-200',
    text: 'text-blue-700',
    icon: 'text-blue-500',
  },
  indigo: {
    header: 'bg-indigo-50',
    border: 'border-indigo-200',
    text: 'text-indigo-700',
    icon: 'text-indigo-500',
  },
  purple: {
    header: 'bg-purple-50',
    border: 'border-purple-200',
    text: 'text-purple-700',
    icon: 'text-purple-500',
  },
  cyan: {
    header: 'bg-cyan-50',
    border: 'border-cyan-200',
    text: 'text-cyan-700',
    icon: 'text-cyan-500',
  },
  green: {
    header: 'bg-green-50',
    border: 'border-green-200',
    text: 'text-green-700',
    icon: 'text-green-500',
  },
  amber: {
    header: 'bg-amber-50',
    border: 'border-amber-200',
    text: 'text-amber-700',
    icon: 'text-amber-500',
  },
  red: {
    header: 'bg-red-50',
    border: 'border-red-200',
    text: 'text-red-700',
    icon: 'text-red-500',
  },
  pink: {
    header: 'bg-pink-50',
    border: 'border-pink-200',
    text: 'text-pink-700',
    icon: 'text-pink-500',
  },
};

export function SectionCard({ 
  title, 
  subtitle,
  description, 
  icon, 
  color = 'default',
  className = '',
  children,
  headerRight,
  noPadding = false
}: SectionCardProps) {
  const colors = colorMap[color];
  
  // Render icon based on its type
  const renderIcon = () => {
    if (!icon) return null;
    
    if (React.isValidElement(icon)) {
      // If it's already a React element, return it with the color class
      return React.cloneElement(icon as React.ReactElement, {
        className: `h-5 w-5 ${colors.icon} flex-shrink-0`
      });
    } else if (typeof icon === 'function') {
      // If it's a Lucide icon component
      const IconComponent = icon as LucideIcon;
      return <IconComponent className={`h-5 w-5 ${colors.icon} flex-shrink-0`} />;
    }
    return null;
  };
  
  return (
    <Card className={`border ${colors.border} shadow-sm mb-4 overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <CardHeader className={`${colors.header} ${title && subtitle ? 'pb-3' : 'pb-4'} pt-4 px-4 border-b ${colors.border}`}>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              {title && (
                <CardTitle className={`text-base font-semibold ${colors.text} flex items-center gap-2`}>
                  {icon && renderIcon()}
                  {title}
                </CardTitle>
              )}
              {subtitle && (
                <CardDescription className={`${title ? 'mt-1' : ''} text-gray-600`}>
                  {subtitle}
                </CardDescription>
              )}
              {description && (
                <p className="text-sm text-gray-500 mt-1">{description}</p>
              )}
            </div>
            {headerRight && (
              <div className="ml-4 flex-shrink-0">
                {headerRight}
              </div>
            )}
          </div>
        </CardHeader>
      )}
      
      <CardContent className={noPadding ? 'p-0' : 'p-4'}>
        {children}
      </CardContent>
    </Card>
  );
} 