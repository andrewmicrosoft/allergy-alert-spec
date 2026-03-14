'use client';

import { useState } from 'react';
import type { AllergenSeverity } from '@/types';

interface AllergenFormProps {
  onAdd: (name: string, severity: AllergenSeverity) => Promise<void>;
}

export default function AllergenForm({ onAdd }: AllergenFormProps) {
  const [name, setName] = useState('');
  const [severity, setSeverity] = useState<AllergenSeverity>('allergy');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setError(null);

    try {
      await onAdd(trimmed, severity);
      setName('');
      setSeverity('allergy');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add allergen');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="allergen-name" className="block text-sm font-medium text-gray-700">
          Allergen Name
        </label>
        <input
          id="allergen-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g., Peanuts, Lactose, Shellfish"
          maxLength={100}
          required
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
        />
      </div>

      <fieldset>
        <legend className="block text-sm font-medium text-gray-700">Severity</legend>
        <div className="mt-2 flex gap-6">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="severity"
              value="allergy"
              checked={severity === 'allergy'}
              onChange={() => setSeverity('allergy')}
              className="text-red-600 focus:ring-red-500"
            />
            <span>Allergy</span>
            <span className="text-xs text-gray-500">(potentially life-threatening)</span>
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="severity"
              value="intolerance"
              checked={severity === 'intolerance'}
              onChange={() => setSeverity('intolerance')}
              className="text-yellow-600 focus:ring-yellow-500"
            />
            <span>Intolerance</span>
            <span className="text-xs text-gray-500">(causes discomfort)</span>
          </label>
        </div>
      </fieldset>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting || !name.trim()}
        className="rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
      >
        {submitting ? 'Adding...' : 'Add Allergen'}
      </button>
    </form>
  );
}
