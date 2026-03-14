'use client';

import { useState, useEffect, useCallback } from 'react';
import { useMsal, useIsAuthenticated } from '@azure/msal-react';
import AllergenForm from '@/components/features/AllergenForm';
import AllergenList from '@/components/features/AllergenList';
import { ListSkeleton } from '@/components/ui/Skeleton';
import type { Allergen, AllergenSeverity } from '@/types';

export default function ProfilePage() {
  const { instance } = useMsal();
  const isAuthenticated = useIsAuthenticated();
  const [allergens, setAllergens] = useState<Allergen[]>([]);
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

  const fetchAllergens = useCallback(async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/allergens', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load allergens');
      const data = await res.json();
      setAllergens(data.allergens);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load allergens');
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchAllergens();
    }
  }, [isAuthenticated, fetchAllergens]);

  const handleAdd = async (name: string, severity: AllergenSeverity) => {
    const token = await getToken();
    const res = await fetch('/api/allergens', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ name, severity }),
    });

    if (res.status === 409) {
      const data = await res.json();
      throw new Error(data.error);
    }
    if (!res.ok) throw new Error('Failed to add allergen');

    const data = await res.json();
    setAllergens((prev) => [...prev, data.allergen]);
  };

  const handleUpdate = async (id: string, name: string, severity: AllergenSeverity) => {
    const token = await getToken();
    const res = await fetch('/api/allergens', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id, name, severity }),
    });

    if (res.status === 409) {
      const data = await res.json();
      throw new Error(data.error);
    }
    if (res.status === 404) throw new Error('Allergen not found');
    if (!res.ok) throw new Error('Failed to update allergen');

    const data = await res.json();
    setAllergens((prev) => prev.map((a) => (a.id === id ? data.allergen : a)));
  };

  const handleDelete = async (id: string) => {
    const token = await getToken();
    const res = await fetch('/api/allergens', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ id }),
    });

    if (res.status === 404) throw new Error('Allergen not found');
    if (!res.ok) throw new Error('Failed to delete allergen');

    setAllergens((prev) => prev.filter((a) => a.id !== id));
  };

  if (!isAuthenticated) {
    return (
      <div className="text-center py-16">
        <p className="text-gray-600">Please sign in to manage your allergy profile.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Allergy Profile</h1>

      <div className="rounded-lg border border-gray-200 bg-white p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Allergen</h2>
        <AllergenForm onAdd={handleAdd} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Your Allergens</h2>
        {loading ? (
          <ListSkeleton count={3} />
        ) : error ? (
          <p className="text-sm text-red-600 py-4" role="alert">
            {error}
          </p>
        ) : (
          <AllergenList allergens={allergens} onUpdate={handleUpdate} onDelete={handleDelete} />
        )}
      </div>
    </div>
  );
}
