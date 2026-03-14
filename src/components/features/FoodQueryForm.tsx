'use client';

import { useState } from 'react';

interface FoodQueryFormProps {
  onSubmit: (queryText: string) => Promise<void>;
}

export default function FoodQueryForm({ onSubmit }: FoodQueryFormProps) {
  const [queryText, setQueryText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = queryText.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);

    try {
      await onSubmit(trimmed);
      setQueryText('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get guidance');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="food-query" className="block text-sm font-medium text-gray-700">
          What would you like to eat?
        </label>
        <textarea
          id="food-query"
          value={queryText}
          onChange={(e) => setQueryText(e.target.value)}
          placeholder="e.g., Thai food, Olive Garden, sushi restaurant near me"
          maxLength={500}
          rows={3}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
        <p className="mt-1 text-xs text-gray-500">{queryText.length}/500 characters</p>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !queryText.trim()}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? (
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
              />
            </svg>
            Getting Guidance...
          </span>
        ) : (
          'Get AI Guidance'
        )}
      </button>
    </form>
  );
}
