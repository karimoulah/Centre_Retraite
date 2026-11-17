import { Skeleton } from '@/components/ui/skeleton';

/** Loading state of every list page. */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div aria-busy="true" className="flex flex-col gap-4">
      <span className="sr-only" role="status">
        Chargement…
      </span>
      <Skeleton className="h-10 w-64 rounded-full" />
      <div className="flex gap-3">
        <Skeleton className="h-11 w-72 rounded-xl" />
        <Skeleton className="h-11 w-48 rounded-xl" />
      </div>
      <div className="rounded-2xl border border-border">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="m-3 h-8 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
