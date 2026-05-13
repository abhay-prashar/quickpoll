export default function LoadingSpinner({ size = 32, className = '' }) {
  return (
    <div className={`flex items-center justify-center ${className}`} aria-label="Loading">
      <div
        style={{ width: size, height: size }}
        className="rounded-full border-2 border-ink-200 dark:border-ink-700 border-t-brand-500 animate-spin"
      />
    </div>
  )
}

// Skeleton block for loading states
export function Skeleton({ className = '' }) {
  return (
    <div className={`animate-pulse bg-ink-200 dark:bg-ink-800 rounded-lg ${className}`} />
  )
}

// Full card skeleton
export function PollCardSkeleton() {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16 rounded-full" />
        <Skeleton className="h-5 w-12 rounded-full" />
      </div>
    </div>
  )
}
