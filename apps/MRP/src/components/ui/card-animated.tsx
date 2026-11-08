// =============================================================================
// L-ERP MRP - ANIMATED CARD
// Card with hover effects and animations
// =============================================================================

'use client';

import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

// =============================================================================
// TYPES
// =============================================================================

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'bordered' | 'elevated' | 'ghost';
  hover?: 'none' | 'lift' | 'glow' | 'scale' | 'border';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  interactive?: boolean;
}

// =============================================================================
// CARD COMPONENT
// =============================================================================

export const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      variant = 'default',
      hover = 'lift',
      padding = 'md',
      rounded = 'xl',
      interactive = false,
      className,
      children,
      ...props
    },
    ref
  ) => {
    const variants = {
      default: 'bg-white dark:bg-neutral-800 border border-gray-200 dark:border-neutral-700',
      bordered: 'bg-transparent border-2 border-gray-200 dark:border-neutral-700',
      elevated: 'bg-white dark:bg-neutral-800 shadow-lg dark:shadow-neutral-900/30',
      ghost: 'bg-transparent',
    };

    const hoverEffects = {
      none: '',
      lift: cn(
        'transition-all duration-300 ease-smooth',
        'hover:-translate-y-1 hover:shadow-xl dark:hover:shadow-neutral-900/40'
      ),
      glow: cn(
        'transition-all duration-300 ease-smooth',
        'hover:shadow-lg hover:shadow-blue-500/20 dark:hover:shadow-blue-400/20',
        'hover:border-blue-200 dark:hover:border-blue-800'
      ),
      scale: cn(
        'transition-all duration-200 ease-smooth',
        'hover:scale-[1.02] active:scale-[0.98]'
      ),
      border: cn(
        'transition-all duration-200 ease-smooth',
        'hover:border-blue-500 dark:hover:border-blue-400'
      ),
    };

    const paddings = {
      none: '',
      sm: 'p-3',
      md: 'p-4 sm:p-6',
      lg: 'p-6 sm:p-8',
    };

    const roundings = {
      none: 'rounded-none',
      sm: 'rounded-sm',
      md: 'rounded-md',
      lg: 'rounded-lg',
      xl: 'rounded-xl',
      '2xl': 'rounded-2xl',
    };

    return (
      <div
        ref={ref}
        className={cn(
          // Base
          'relative overflow-hidden',

          // Variant
          variants[variant],

          // Hover effect
          hoverEffects[hover],

          // Padding
          paddings[padding],

          // Rounded
          roundings[rounded],

          // Interactive
          interactive && 'cursor-pointer',

          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// =============================================================================
// CARD HEADER
// =============================================================================

interface CardHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
}

export const CardHeader = forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ title, subtitle, action, className, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn('flex items-start justify-between mb-4', className)}
        {...props}
      >
        {(title || subtitle || children) && (
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                {title}
              </h3>
            )}
            {subtitle && (
              <p className="text-sm text-gray-500 dark:text-neutral-400 mt-0.5">
                {subtitle}
              </p>
            )}
            {children}
          </div>
        )}
        {action && <div className="flex-shrink-0 ml-4">{action}</div>}
      </div>
    );
  }
);

CardHeader.displayName = 'CardHeader';

// =============================================================================
// CARD CONTENT
// =============================================================================

export const CardContent = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return <div ref={ref} className={cn('', className)} {...props} />;
  }
);

CardContent.displayName = 'CardContent';

// =============================================================================
// CARD FOOTER
// =============================================================================

export const CardFooter = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'flex items-center justify-between mt-4 pt-4',
          'border-t border-gray-100 dark:border-neutral-700',
          className
        )}
        {...props}
      />
    );
  }
);

CardFooter.displayName = 'CardFooter';

// =============================================================================
// STAT CARD
// =============================================================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  className?: string;
}

export function StatCard({ title, value, change, icon, trend, className }: StatCardProps) {
  const trendColors = {
    up: 'text-green-600 dark:text-green-400',
    down: 'text-red-600 dark:text-red-400',
    neutral: 'text-gray-600 dark:text-neutral-400',
  };

  return (
    <Card hover="lift" className={cn('group', className)}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-500 dark:text-neutral-400">
            {title}
          </p>
          <p className="mt-2 text-3xl font-bold text-gray-900 dark:text-white tabular-nums">
            {value}
          </p>
          {change && (
            <p className={cn(
              'mt-2 text-sm font-medium flex items-center gap-1',
              change.type === 'increase' ? trendColors.up : trendColors.down
            )}>
              <span className={cn(
                'transition-transform duration-300',
                change.type === 'increase' ? 'rotate-0' : 'rotate-180'
              )}>
                ↑
              </span>
              {Math.abs(change.value)}%
              <span className="text-gray-500 dark:text-neutral-400 font-normal">
                vs last month
              </span>
            </p>
          )}
        </div>
        {icon && (
          <div className={cn(
            'p-3 rounded-xl',
            'bg-blue-50 text-blue-600',
            'dark:bg-blue-900/30 dark:text-blue-400',
            'transition-all duration-300',
            'group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-blue-500/20'
          )}>
            {icon}
          </div>
        )}
      </div>
    </Card>
  );
}

// =============================================================================
// FEATURE CARD
// =============================================================================

interface FeatureCardProps {
  title: string;
  description: string;
  icon?: React.ReactNode;
  color?: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'gray';
  className?: string;
  onClick?: () => void;
}

export function FeatureCard({
  title,
  description,
  icon,
  color = 'blue',
  className,
  onClick,
}: FeatureCardProps) {
  const colors = {
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-900/30',
      text: 'text-blue-600 dark:text-blue-400',
      shadow: 'group-hover:shadow-blue-500/20',
    },
    green: {
      bg: 'bg-green-50 dark:bg-green-900/30',
      text: 'text-green-600 dark:text-green-400',
      shadow: 'group-hover:shadow-green-500/20',
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-900/30',
      text: 'text-purple-600 dark:text-purple-400',
      shadow: 'group-hover:shadow-purple-500/20',
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-900/30',
      text: 'text-amber-600 dark:text-amber-400',
      shadow: 'group-hover:shadow-amber-500/20',
    },
    red: {
      bg: 'bg-red-50 dark:bg-red-900/30',
      text: 'text-red-600 dark:text-red-400',
      shadow: 'group-hover:shadow-red-500/20',
    },
    gray: {
      bg: 'bg-gray-50 dark:bg-neutral-800',
      text: 'text-gray-600 dark:text-neutral-400',
      shadow: 'group-hover:shadow-gray-500/20',
    },
  };

  const colorClasses = colors[color];

  return (
    <Card
      hover="lift"
      interactive={!!onClick}
      onClick={onClick}
      className={cn('group', className)}
    >
      {icon && (
        <div className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center mb-4',
          colorClasses.bg,
          colorClasses.text,
          'transition-all duration-300',
          'group-hover:scale-110 group-hover:shadow-lg',
          colorClasses.shadow
        )}>
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-gray-600 dark:text-neutral-400 text-sm leading-relaxed">
        {description}
      </p>
    </Card>
  );
}

// =============================================================================
// GLASS CARD (Special effect)
// =============================================================================

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  blur?: 'sm' | 'md' | 'lg';
}

export const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ blur = 'md', className, children, ...props }, ref) => {
    const blurs = {
      sm: 'backdrop-blur-sm',
      md: 'backdrop-blur-md',
      lg: 'backdrop-blur-lg',
    };

    return (
      <div
        ref={ref}
        className={cn(
          'bg-white/70 dark:bg-neutral-900/70',
          blurs[blur],
          'border border-white/20 dark:border-neutral-700/30',
          'rounded-2xl p-6',
          'shadow-xl shadow-black/5 dark:shadow-black/20',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = 'GlassCard';
