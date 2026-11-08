/**
 * L-ERP HRM - Loading Skeletons
 * Reusable skeleton components for loading states
 * 
 * @module components/skeletons
 */

import { cn } from '@/lib/utils'

interface SkeletonProps {
    className?: string
}

/**
 * Base skeleton component with animation
 */
export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-md bg-zinc-800/50',
                className
            )}
        />
    )
}

/**
 * Table skeleton with configurable rows and columns
 */
export function TableSkeleton({
    rows = 5,
    columns = 5,
    showHeader = true,
    className,
}: {
    rows?: number
    columns?: number
    showHeader?: boolean
    className?: string
}) {
    return (
        <div className={cn('rounded-lg border border-zinc-800 overflow-hidden', className)}>
            {/* Header */}
            {showHeader && (
                <div className="bg-zinc-900/50 border-b border-zinc-800 px-4 py-3">
                    <div className="flex gap-4">
                        {Array.from({ length: columns }).map((_, i) => (
                            <Skeleton
                                key={i}
                                className={cn('h-4', i === 0 ? 'w-32' : 'w-24')}
                            />
                        ))}
                    </div>
                </div>
            )}

            {/* Body */}
            <div className="divide-y divide-zinc-800">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="px-4 py-4 flex gap-4 items-center">
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <Skeleton
                                key={colIndex}
                                className={cn(
                                    'h-4',
                                    colIndex === 0 ? 'w-40' : colIndex === columns - 1 ? 'w-20' : 'w-28'
                                )}
                            />
                        ))}
                    </div>
                ))}
            </div>
        </div>
    )
}

/**
 * Card skeleton for dashboard metrics
 */
export function CardSkeleton({
    variant = 'default',
    className,
}: {
    variant?: 'default' | 'stats' | 'chart'
    className?: string
}) {
    if (variant === 'stats') {
        return (
            <div className={cn('bg-zinc-900 border border-zinc-800 rounded-lg p-4', className)}>
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-lg" />
                </div>
                <Skeleton className="h-3 w-32 mt-3" />
            </div>
        )
    }

    if (variant === 'chart') {
        return (
            <div className={cn('bg-zinc-900 border border-zinc-800 rounded-lg p-4', className)}>
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-8 w-24 rounded" />
                </div>
                <Skeleton className="h-48 w-full rounded" />
            </div>
        )
    }

    return (
        <div className={cn('bg-zinc-900 border border-zinc-800 rounded-lg p-4', className)}>
            <Skeleton className="h-5 w-32 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-3/4 mb-2" />
            <Skeleton className="h-4 w-1/2" />
        </div>
    )
}

/**
 * Form skeleton
 */
export function FormSkeleton({
    fields = 4,
    className,
}: {
    fields?: number
    className?: string
}) {
    return (
        <div className={cn('space-y-6', className)}>
            {Array.from({ length: fields }).map((_, i) => (
                <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-10 w-full rounded-md" />
                </div>
            ))}

            {/* Action buttons */}
            <div className="flex gap-3 pt-4">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-20 rounded-md" />
            </div>
        </div>
    )
}

/**
 * List item skeleton
 */
export function ListSkeleton({
    items = 5,
    showAvatar = true,
    className,
}: {
    items?: number
    showAvatar?: boolean
    className?: string
}) {
    return (
        <div className={cn('space-y-3', className)}>
            {Array.from({ length: items }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 p-3 bg-zinc-900 rounded-lg border border-zinc-800">
                    {showAvatar && <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />}
                    <div className="flex-1 min-w-0 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-8 w-20 rounded" />
                </div>
            ))}
        </div>
    )
}

/**
 * Profile skeleton
 */
export function ProfileSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('p-6', className)}>
            <div className="flex items-start gap-6 mb-6">
                <Skeleton className="h-24 w-24 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3">
                    <Skeleton className="h-6 w-48" />
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-40" />
                </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="space-y-1">
                        <Skeleton className="h-3 w-20" />
                        <Skeleton className="h-5 w-32" />
                    </div>
                ))}
            </div>
        </div>
    )
}

/**
 * Dashboard skeleton with stats and chart
 */
export function DashboardSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('space-y-6', className)}>
            {/* Stats row */}
            <div className="grid grid-cols-4 gap-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <CardSkeleton key={i} variant="stats" />
                ))}
            </div>

            {/* Charts row */}
            <div className="grid grid-cols-2 gap-4">
                <CardSkeleton variant="chart" />
                <CardSkeleton variant="chart" />
            </div>

            {/* Table */}
            <TableSkeleton rows={5} columns={5} />
        </div>
    )
}

/**
 * Page header skeleton
 */
export function PageHeaderSkeleton({ className }: { className?: string }) {
    return (
        <div className={cn('flex items-center justify-between mb-6', className)}>
            <div className="space-y-2">
                <Skeleton className="h-7 w-48" />
                <Skeleton className="h-4 w-64" />
            </div>
            <div className="flex gap-3">
                <Skeleton className="h-10 w-32 rounded-md" />
                <Skeleton className="h-10 w-28 rounded-md" />
            </div>
        </div>
    )
}
