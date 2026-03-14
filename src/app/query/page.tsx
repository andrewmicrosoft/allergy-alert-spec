'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import Link from 'next/link';
import FoodQueryForm from '@/components/features/FoodQueryForm';
import GuidanceDisplay from '@/components/features/GuidanceDisplay';
import type { Allergen } from '@/types';

interface QueryResult {
  guidance: string;
  disclaimer: string;
}

export default function QueryPage() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [allergens, setAllergens] = useState<Allergen[] | null>(null);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(true);
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

  // Fetch allergens to check if profile has entries
  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const token = await getToken();
        const res = await fetch('/api/allergens', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load profile');
        const data = await res.json();
        setAllergens(data.allergens);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    })();
  }, [isAuthenticated, getToken]);

  const handleQuery = async (queryText: string) => {
    setResult(null);
    setError(null);

    const token = await getToken();
    const res = await fetch('/api/queries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ queryText }),
    });

    if (res.status === 422) {
      const data = await res.json();
      throw new Error(data.error);
    }
    if (res.status === 503) {
      throw new Error(
        'The AI guidance service is temporarily unavailable. Please try again later.',
      );
    }
    if (!res.ok) throw new Error('Failed to get guidance');

    const data = await res.json();
    setResult({
      guidance: data.query.guidance,
      disclaimer: data.query.disclaimer,
    });
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Please sign in to ask about food.</p>
      </div>
    );
  }

  if (loading) {
    return <p className="text-sm text-gray-500 py-8">Loading...</p>;
  }

  if (allergens !== null && allergens.length === 0) {
    return (
      <div className="mx-auto max-w-2xl text-center py-16">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">No Allergens Found</h1>
        <p className="text-gray-600 mb-6">
          You need to add at least one allergen to your profile before asking about food.
        </p>
        <Link
          href="/profile"
          className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 transition-colors"
        >
          Set Up Your Profile
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Ask About Food</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 mb-8">
        <FoodQueryForm onSubmit={handleQuery} />
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4" role="alert">
          {error}
        </p>
      )}

      {result && <GuidanceDisplay guidance={result.guidance} disclaimer={result.disclaimer} />}
    </div>
  );
}
