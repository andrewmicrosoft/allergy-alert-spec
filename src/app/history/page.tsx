'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import QueryHistoryList from '@/components/features/QueryHistoryList';
import { CardSkeleton } from '@/components/ui/Skeleton';
import type { QueryDocument } from '@/types';

export default function HistoryPage() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [queries, setQueries] = useState<QueryDocument[]>([]);
  const [continuationToken, setContinuationToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(async (): Promise<string> => {
    const account = instance.getActiveAccount();
    if (!account) throw new Error('Not authenticated');
    const response = await instance.acquireTokenSilent({
      scopes: ['openid', 'profile'],
      account,
    });
    return response.idToken;
  }, [instance]);

  const fetchQueries = useCallback(
    async (token?: string) => {
      const authToken = await getToken();
      const params = new URLSearchParams();
      if (token) params.set('continuationToken', token);

      const res = await fetch(`/api/queries?${params.toString()}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (!res.ok) throw new Error('Failed to load query history');
      return res.json();
    },
    [getToken],
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const data = await fetchQueries();
        setQueries(data.queries);
        setContinuationToken(data.continuationToken);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load history');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, fetchQueries]);

  const handleLoadMore = async () => {
    if (!continuationToken) return;
    setLoadingMore(true);
    try {
      const data = await fetchQueries(continuationToken);
      setQueries((prev) => [...prev, ...data.queries]);
      setContinuationToken(data.continuationToken);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more');
    } finally {
      setLoadingMore(false);
    }
  };

  const handleDelete = async (id: string) => {
    const authToken = await getToken();
    const res = await fetch(`/api/queries/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${authToken}` },
    });

    if (res.status === 404) throw new Error('Query not found');
    if (!res.ok) throw new Error('Failed to delete query');

    setQueries((prev) => prev.filter((q) => q.id !== id));
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Please sign in to view your query history.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Query History</h1>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : error ? (
        <p className="text-sm text-red-600 py-4" role="alert">
          {error}
        </p>
      ) : (
        <QueryHistoryList
          queries={queries}
          continuationToken={continuationToken}
          onLoadMore={handleLoadMore}
          onDelete={handleDelete}
          loadingMore={loadingMore}
        />
      )}
    </div>
  );
}
