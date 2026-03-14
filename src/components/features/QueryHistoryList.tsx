'use client';

import QueryHistoryItem from './QueryHistoryItem';
import type { QueryDocument } from '@/types';

interface QueryHistoryListProps {
  queries: QueryDocument[];
  continuationToken: string | null;
  onLoadMore: () => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  loadingMore: boolean;
}

export default function QueryHistoryList({
  queries,
  continuationToken,
  onLoadMore,
  onDelete,
  loadingMore,
}: QueryHistoryListProps) {
  if (queries.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No query history yet. Go to the Query page to ask about food!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {queries.map((query) => (
        <QueryHistoryItem key={query.id} query={query} onDelete={onDelete} />
      ))}

      {continuationToken && (
        <div className="text-center pt-4">
          <button
            onClick={onLoadMore}
            disabled={loadingMore}
            className="rounded-md bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200 disabled:bg-gray-50 disabled:text-gray-400 transition-colors"
          >
            {loadingMore ? 'Loading...' : 'Load More'}
          </button>
        </div>
      )}
    </div>
  );
}
