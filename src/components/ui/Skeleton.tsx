export function CardSkeleton() {
  return (
    <div className="animate-pulse rounded-lg border border-gray-200 bg-white p-6">
      <div className="h-4 w-1/3 rounded bg-gray-200 mb-4" />
      <div className="space-y-3">
        <div className="h-3 w-full rounded bg-gray-200" />
        <div className="h-3 w-5/6 rounded bg-gray-200" />
        <div className="h-3 w-2/3 rounded bg-gray-200" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse flex items-center justify-between py-3 border-b border-gray-100"
        >
          <div className="flex items-center gap-3">
            <div className="h-4 w-24 rounded bg-gray-200" />
            <div className="h-5 w-16 rounded-full bg-gray-200" />
          </div>
          <div className="flex gap-2">
            <div className="h-4 w-8 rounded bg-gray-200" />
            <div className="h-4 w-12 rounded bg-gray-200" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="animate-pulse mx-auto max-w-2xl">
      <div className="h-8 w-48 rounded bg-gray-200 mb-6" />
      <CardSkeleton />
    </div>
  );
}
