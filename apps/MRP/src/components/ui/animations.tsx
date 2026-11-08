// =============================================================================
// L-ERP MRP - ANIMATION UTILITIES
// Smooth transitions, micro-interactions, and motion components
// =============================================================================

'use client';

import React, { useEffect, useState, useRef, ReactNode } from 'react';

// =============================================================================
// ANIMATION CONFIGURATION
// =============================================================================

export const DURATIONS = {
  instant: 0,
  fast: 150,
  normal: 200,
  slow: 300,
  slower: 500,
} as const;

export const EASINGS = {
  linear: 'linear',
  ease: 'ease',
  easeIn: 'ease-in',
  easeOut: 'ease-out',
  easeInOut: 'ease-in-out',
  // Custom easings
  bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
  snappy: 'cubic-bezier(0.2, 0, 0, 1)',
  spring: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
} as const;

// =============================================================================
// FADE IN ANIMATION
// =============================================================================

interface FadeInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  distance?: number;
  className?: string;
  once?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  duration = DURATIONS.normal,
  direction = 'up',
  distance = 20,
  className = '',
  once = true,
}: FadeInProps) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (once) {
            observer.disconnect();
          }
        } else if (!once) {
          setIsVisible(false);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [once]);

  const getInitialTransform = () => {
    switch (direction) {
      case 'up': return `translateY(${distance}px)`;
      case 'down': return `translateY(-${distance}px)`;
      case 'left': return `translateX(${distance}px)`;
      case 'right': return `translateX(-${distance}px)`;
      default: return 'none';
    }
  };

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'none' : getInitialTransform(),
        transition: `opacity ${duration}ms ${EASINGS.smooth} ${delay}ms, transform ${duration}ms ${EASINGS.smooth} ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}

// =============================================================================
// SCALE IN ANIMATION
// =============================================================================

interface ScaleInProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  initialScale?: number;
  className?: string;
}

export function ScaleIn({
  children,
  delay = 0,
  duration = DURATIONS.normal,
  initialScale = 0.95,
  className = '',
}: ScaleInProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      className={className}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'scale(1)' : `scale(${initialScale})`,
        transition: `opacity ${duration}ms ${EASINGS.smooth}, transform ${duration}ms ${EASINGS.spring}`,
      }}
    >
      {children}
    </div>
  );
}

// =============================================================================
// STAGGER CHILDREN ANIMATION
// =============================================================================

interface StaggerChildrenProps {
  children: ReactNode;
  staggerDelay?: number;
  initialDelay?: number;
  className?: string;
}

export function StaggerChildren({
  children,
  staggerDelay = 50,
  initialDelay = 0,
  className = '',
}: StaggerChildrenProps) {
  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn delay={initialDelay + index * staggerDelay}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
}

// =============================================================================
// SLIDE ANIMATION
// =============================================================================

interface SlideProps {
  children: ReactNode;
  show: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  className?: string;
}

export function Slide({
  children,
  show,
  direction = 'down',
  duration = DURATIONS.normal,
  className = '',
}: SlideProps) {
  const [shouldRender, setShouldRender] = useState(show);

  useEffect(() => {
    if (show) setShouldRender(true);
  }, [show]);

  const handleTransitionEnd = () => {
    if (!show) setShouldRender(false);
  };

  if (!shouldRender) return null;

  const getTransform = () => {
    if (show) return 'translate(0, 0)';
    switch (direction) {
      case 'up': return 'translateY(-100%)';
      case 'down': return 'translateY(100%)';
      case 'left': return 'translateX(-100%)';
      case 'right': return 'translateX(100%)';
    }
  };

  return (
    <div
      className={className}
      style={{
        opacity: show ? 1 : 0,
        transform: getTransform(),
        transition: `opacity ${duration}ms ${EASINGS.smooth}, transform ${duration}ms ${EASINGS.smooth}`,
      }}
      onTransitionEnd={handleTransitionEnd}
    >
      {children}
    </div>
  );
}

// =============================================================================
// COLLAPSE ANIMATION
// =============================================================================

interface CollapseProps {
  children: ReactNode;
  isOpen: boolean;
  duration?: number;
  className?: string;
}

export function Collapse({
  children,
  isOpen,
  duration = DURATIONS.normal,
  className = '',
}: CollapseProps) {
  return (
    <div
      className="grid transition-[grid-template-rows,opacity] ease-[cubic-bezier(0.4,0,0.2,1)]"
      style={{
        gridTemplateRows: isOpen ? '1fr' : '0fr',
        opacity: isOpen ? 1 : 0,
        transitionDuration: `${duration}ms`,
      }}
    >
      <div className={`overflow-hidden ${className}`}>
        {children}
      </div>
    </div>
  );
}

// =============================================================================
// RIPPLE EFFECT
// =============================================================================

interface RippleProps {
  color?: string;
  duration?: number;
}

export function useRipple({ color = 'rgba(255, 255, 255, 0.3)', duration = 600 }: RippleProps = {}) {
  const [ripples, setRipples] = useState<Array<{ x: number; y: number; size: number; id: number }>>([]);
  const nextId = useRef(0);

  const createRipple = (event: React.MouseEvent<HTMLElement>) => {
    const button = event.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height) * 2;
    const x = event.clientX - rect.left - size / 2;
    const y = event.clientY - rect.top - size / 2;

    const newRipple = { x, y, size, id: nextId.current++ };
    setRipples(prev => [...prev, newRipple]);

    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, duration);
  };

  const RippleContainer = () => (
    <span className="absolute inset-0 overflow-hidden rounded-[inherit]">
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute rounded-full animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            backgroundColor: color,
          }}
        />
      ))}
    </span>
  );

  return { createRipple, RippleContainer };
}

// =============================================================================
// ANIMATED COUNTER
// =============================================================================

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}

export function AnimatedCounter({
  value,
  duration = 1000,
  decimals = 0,
  prefix = '',
  suffix = '',
  className = '',
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0);
  const previousValue = useRef(0);

  useEffect(() => {
    // NaN/Infinity guard
    if (!Number.isFinite(value)) {
      setDisplayValue(0);
      previousValue.current = 0;
      return;
    }

    const startValue = Number.isFinite(previousValue.current) ? previousValue.current : 0;
    const endValue = value;
    const startTime = performance.now();
    let rafId = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function (ease-out)
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const current = startValue + (endValue - startValue) * easeOut;
      setDisplayValue(Number.isFinite(current) ? current : 0);

      if (progress < 1) {
        rafId = requestAnimationFrame(animate);
      }
    };

    rafId = requestAnimationFrame(animate);
    previousValue.current = value;
    return () => cancelAnimationFrame(rafId);
  }, [value, duration]);

  const safeValue = Number.isFinite(displayValue) ? displayValue : 0;
  const formattedValue = safeValue.toFixed(decimals);

  return (
    <span className={className}>
      {prefix}{formattedValue}{suffix}
    </span>
  );
}

// =============================================================================
// SKELETON LOADER
// =============================================================================

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'full';
  className?: string;
  animate?: boolean;
}

export function Skeleton({
  width,
  height,
  rounded = 'md',
  className = '',
  animate = true,
}: SkeletonProps) {
  const roundedClasses = {
    none: 'rounded-none',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    full: 'rounded-full',
  };

  return (
    <div
      className={`
        bg-gray-200 dark:bg-neutral-700
        ${roundedClasses[rounded]}
        ${animate ? 'animate-pulse' : ''}
        ${className}
      `}
      style={{ width, height }}
    />
  );
}

// =============================================================================
// LOADING SPINNER
// =============================================================================

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  color?: 'primary' | 'white' | 'gray';
  className?: string;
}

export function Spinner({
  size = 'md',
  color = 'primary',
  className = '',
}: SpinnerProps) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  };

  const colors = {
    primary: 'text-primary-600 dark:text-primary-400',
    white: 'text-white',
    gray: 'text-gray-400 dark:text-neutral-500',
  };

  return (
    <svg
      className={`animate-spin ${sizes[size]} ${colors[color]} ${className}`}
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// =============================================================================
// PROGRESS BAR
// =============================================================================

interface ProgressBarProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  color?: 'primary' | 'success' | 'warning' | 'danger';
  showValue?: boolean;
  animated?: boolean;
  className?: string;
}

export function ProgressBar({
  value,
  max = 100,
  size = 'md',
  color = 'primary',
  showValue = false,
  animated = true,
  className = '',
}: ProgressBarProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

  const sizes = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  const colors = {
    primary: 'bg-primary-500 dark:bg-primary-400',
    success: 'bg-success-500 dark:bg-success-400',
    warning: 'bg-warning-500 dark:bg-warning-400',
    danger: 'bg-danger-500 dark:bg-danger-400',
  };

  return (
    <div className={`w-full ${className}`}>
      <div className={`
        w-full bg-gray-200 dark:bg-neutral-700 rounded-full overflow-hidden
        ${sizes[size]}
      `}>
        <div
          className={`
            w-full ${sizes[size]} ${colors[color]} rounded-full origin-left
            transition-transform duration-500 ease-out
            ${animated ? 'animate-progress-stripe' : ''}
          `}
          style={{ transform: `scaleX(${percentage / 100})` }}
        />
      </div>
      {showValue && (
        <span className="text-sm text-gray-600 dark:text-neutral-400 mt-1">
          {percentage.toFixed(0)}%
        </span>
      )}
    </div>
  );
}

// =============================================================================
// PULSE DOT (Status indicator)
// =============================================================================

interface PulseDotProps {
  color?: 'success' | 'warning' | 'danger' | 'info' | 'primary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function PulseDot({
  color = 'success',
  size = 'md',
  className = '',
}: PulseDotProps) {
  const sizes = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const colors = {
    success: 'bg-green-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    info: 'bg-cyan-500',
    primary: 'bg-blue-500',
  };

  return (
    <span className={`relative inline-flex ${className}`}>
      <span className={`${sizes[size]} ${colors[color]} rounded-full`} />
      <span className={`
        absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping
        ${colors[color]}
      `} />
    </span>
  );
}

// =============================================================================
// HOVER CARD EFFECT
// =============================================================================

interface HoverCardProps {
  children: ReactNode;
  className?: string;
  scale?: number;
  shadow?: boolean;
  lift?: boolean;
}

export function HoverCard({
  children,
  className = '',
  scale = 1.02,
  shadow = true,
  lift = true,
}: HoverCardProps) {
  return (
    <div
      className={`
        transition-all duration-200 ease-out
        hover:scale-[${scale}]
        ${lift ? 'hover:-translate-y-1' : ''}
        ${shadow ? 'hover:shadow-lg dark:hover:shadow-xl dark:hover:shadow-black/30' : ''}
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// =============================================================================
// PAGE TRANSITION WRAPPER
// =============================================================================

interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

export function PageTransition({ children, className = '' }: PageTransitionProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={`
        transition-all duration-300 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
