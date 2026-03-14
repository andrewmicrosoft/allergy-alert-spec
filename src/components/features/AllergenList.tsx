'use client';

import { useState } from 'react';
import type { Allergen, AllergenSeverity } from '@/types';

interface AllergenListProps {
  allergens: Allergen[];
  onUpdate: (id: string, name: string, severity: AllergenSeverity) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export default function AllergenList({ allergens, onUpdate, onDelete }: AllergenListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editSeverity, setEditSeverity] = useState<AllergenSeverity>('allergy');
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startEditing = (allergen: Allergen) => {
    setEditingId(allergen.id);
    setEditName(allergen.name);
    setEditSeverity(allergen.severity);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setError(null);
  };

  const handleUpdate = async (id: string) => {
    const trimmed = editName.trim();
    if (!trimmed) return;

    setLoading(id);
    setError(null);
    try {
      await onUpdate(id, trimmed, editSeverity);
      setEditingId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update allergen');
    } finally {
      setLoading(null);
    }
  };

  const handleDelete = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      await onDelete(id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete allergen');
    } finally {
      setLoading(null);
    }
  };

  if (allergens.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No allergens added yet. Use the form above to add your first allergen.</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {error && (
        <p className="text-sm text-red-600 mb-2" role="alert">
          {error}
        </p>
      )}
      <ul className="divide-y divide-gray-200">
        {allergens.map((allergen) => (
          <li key={allergen.id} className="py-3">
            {editingId === allergen.id ? (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  maxLength={100}
                  className="flex-1 rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <select
                  value={editSeverity}
                  onChange={(e) => setEditSeverity(e.target.value as AllergenSeverity)}
                  className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
                >
                  <option value="allergy">Allergy</option>
                  <option value="intolerance">Intolerance</option>
                </select>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleUpdate(allergen.id)}
                    disabled={loading === allergen.id}
                    className="rounded px-3 py-1 text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:bg-gray-400"
                  >
                    Save
                  </button>
                  <button
                    onClick={cancelEditing}
                    className="rounded px-3 py-1 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-900">{allergen.name}</span>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      allergen.severity === 'allergy'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {allergen.severity}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(allergen)}
                    disabled={loading === allergen.id}
                    className="text-sm text-gray-600 hover:text-gray-900"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(allergen.id)}
                    disabled={loading === allergen.id}
                    className="text-sm text-red-600 hover:text-red-800"
                  >
                    {loading === allergen.id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
