// =============================================================================
// L-ERP MRP - ANIMATED BUTTON
// Button with ripple effect and micro-interactions
// =============================================================================

'use client';

import React, { useState, useRef, forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Spinner } from './animations';

// =============================================================================
// TYPES
// =============================================================================

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'outline';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  ripple?: boolean;
  fullWidth?: boolean;
}

// =============================================================================
// STYLES
// =============================================================================

const variants: Record<ButtonVariant, string> = {
  primary: cn(
    'bg-blue-600 text-white',
    'hover:bg-blue-700',
    'active:bg-blue-800',
    'dark:bg-blue-500 dark:hover:bg-blue-600 dark:active:bg-blue-700',
    'shadow-md shadow-blue-500/25 hover:shadow-lg hover:shadow-blue-500/30',
    'focus:ring-blue-500'
  ),
  secondary: cn(
    'bg-gray-100 text-gray-900',
    'hover:bg-gray-200',
    'active:bg-gray-300',
    'dark:bg-neutral-700 dark:text-white dark:hover:bg-neutral-600 dark:active:bg-neutral-500',
    'focus:ring-gray-500'
  ),
  ghost: cn(
    'bg-transparent text-gray-700',
    'hover:bg-gray-100',
    'active:bg-gray-200',
    'dark:text-neutral-300 dark:hover:bg-neutral-800 dark:active:bg-neutral-700',
    'focus:ring-gray-500'
  ),
  danger: cn(
    'bg-red-600 text-white',
    'hover:bg-red-700',
    'active:bg-red-800',
    'dark:bg-red-500 dark:hover:bg-red-600',
    'shadow-md shadow-red-500/25 hover:shadow-lg hover:shadow-red-500/30',
    'focus:ring-red-500'
  ),
  success: cn(
    'bg-green-600 text-white',
    'hover:bg-green-700',
    'active:bg-green-800',
    'dark:bg-green-500 dark:hover:bg-green-600',
    'shadow-md shadow-green-500/25 hover:shadow-lg hover:shadow-green-500/30',
    'focus:ring-green-500'
  ),
  outline: cn(
    'bg-transparent text-blue-600 border-2 border-blue-600',
    'hover:bg-blue-50',
    'active:bg-blue-100',
    'dark:text-blue-400 dark:border-blue-400 dark:hover:bg-blue-950 dark:active:bg-blue-900',
    'focus:ring-blue-500'
  ),
};

const sizes: Record<ButtonSize, string> = {
  xs: 'h-7 px-2.5 text-xs gap-1',
  sm: 'h-8 px-3 text-sm gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-12 px-6 text-base gap-2',
  xl: 'h-14 px-8 text-lg gap-3',
};

const iconSizes: Record<ButtonSize, string> = {
  xs: 'w-3 h-3',
  sm: 'w-4 h-4',
  md: 'w-4 h-4',
  lg: 'w-5 h-5',
  xl: 'w-6 h-6',
};

// =============================================================================
// RIPPLE HOOK
// =============================================================================

interface Ripple {
  x: number;
  y: number;
  size: number;
  id: number;
}

function useRipple(enabled: boolean = true) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);

  const createRipple = (event: React.MouseEvent<HTMLButtonElement>) => {
    if (!enabled) return;

    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple = { x, y, size, id: nextId.current++ };
    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);
  };

  return { ripples, createRipple };
}

// =============================================================================
// BUTTON COMPONENT
// =============================================================================

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      isLoading = false,
      loadingText,
      leftIcon,
      rightIcon,
      ripple = true,
      fullWidth = false,
      className,
      disabled,
      children,
      onClick,
      ...props
    },
    ref
  ) => {
    const { ripples, createRipple } = useRipple(ripple && !disabled && !isLoading);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      createRipple(e);
      onClick?.(e);
    };

    const isDisabled = disabled || isLoading;

    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          'relative inline-flex items-center justify-center',
          'font-medium rounded-lg',
          'transition-all duration-200 ease-smooth',
          'focus:outline-none focus:ring-2 focus:ring-offset-2',
          'dark:focus:ring-offset-gray-900',
          'overflow-hidden',

          // Active/hover transforms
          'hover:scale-[1.02] active:scale-[0.98]',

          // Variant & size
          variants[variant],
          sizes[size],

          // Full width
          fullWidth && 'w-full',

          // Disabled state
          isDisabled && 'opacity-50 cursor-not-allowed hover:scale-100 active:scale-100',

          className
        )}
        disabled={isDisabled}
        onClick={handleClick}
        {...props}
      >
        {/* Ripple effects */}
        {ripples.map(r => (
          <span
            key={r.id}
            className="absolute rounded-full bg-white/30 animate-ripple pointer-events-none"
            style={{
              left: r.x,
              top: r.y,
              width: r.size,
              height: r.size,
            }}
          />
        ))}

        {/* Loading spinner */}
        {isLoading && (
          <Spinner
            size={size === 'xs' ? 'sm' : 'sm'}
            color={variant === 'secondary' || variant === 'ghost' ? 'gray' : 'white'}
          />
        )}

        {/* Left icon */}
        {!isLoading && leftIcon && (
          <span className={iconSizes[size]}>{leftIcon}</span>
        )}

        {/* Text */}
        <span>{isLoading && loadingText ? loadingText : children}</span>

        {/* Right icon */}
        {!isLoading && rightIcon && (
          <span className={iconSizes[size]}>{rightIcon}</span>
        )}
      </button>
    );
  }
);

Button.displayName = 'Button';

// =============================================================================
// ICON BUTTON
// =============================================================================

interface IconButtonProps extends Omit<ButtonProps, 'leftIcon' | 'rightIcon' | 'loadingText'> {
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ size = 'md', className, children, ...props }, ref) => {
    const iconSizeClasses: Record<ButtonSize, string> = {
      xs: 'w-7 h-7 p-0',
      sm: 'w-8 h-8 p-0',
      md: 'w-10 h-10 p-0',
      lg: 'w-12 h-12 p-0',
      xl: 'w-14 h-14 p-0',
    };

    return (
      <Button
        ref={ref}
        size={size}
        className={cn(iconSizeClasses[size], className)}
        {...props}
      >
        {children}
      </Button>
    );
  }
);

IconButton.displayName = 'IconButton';

// =============================================================================
// BUTTON GROUP
// =============================================================================

interface ButtonGroupProps {
  children: React.ReactNode;
  className?: string;
  attached?: boolean;
}

export function ButtonGroup({ children, className, attached = false }: ButtonGroupProps) {
  return (
    <div
      className={cn(
        'inline-flex',
        attached && '[&>button]:rounded-none [&>button:first-child]:rounded-l-lg [&>button:last-child]:rounded-r-lg [&>button:not(:last-child)]:border-r-0',
        !attached && 'gap-2',
        className
      )}
    >
      {children}
    </div>
  );
}
