import Image from 'next/image';
import { cn } from '@/lib/utils';

interface LogoProps {
  className?: string;
  height?: number;
  width?: number;
  priority?: boolean;
}

/**
 * L-ERP Logo - auto-switches between dark and light versions.
 * - Light theme (white bg): shows dark logo
 * - Dark theme (dark bg): shows white logo
 * - For explicit dark backgrounds (e.g. login panel): use variant="light"
 */
export function Logo({ className, height = 32, width = 120, priority = false }: LogoProps) {
  return (
    <>
      <Image
        src="/logo-lerp-dark.png"
        alt="L-ERP"
        width={width}
        height={height}
        className={cn('dark:hidden', className)}
        priority={priority}
      />
      <Image
        src="/logo-lerp.png"
        alt="L-ERP"
        width={width}
        height={height}
        className={cn('hidden dark:block', className)}
        priority={priority}
      />
    </>
  );
}

/** Logo variant that always shows white (for dark backgrounds regardless of theme) */
export function LogoLight({ className, height = 32, width = 120, priority = false }: LogoProps) {
  return (
    <Image
      src="/logo-lerp.png"
      alt="L-ERP"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}

/** Logo variant that always shows dark (for light backgrounds regardless of theme) */
export function LogoDark({ className, height = 32, width = 120, priority = false }: LogoProps) {
  return (
    <Image
      src="/logo-lerp-dark.png"
      alt="L-ERP"
      width={width}
      height={height}
      className={className}
      priority={priority}
    />
  );
}
