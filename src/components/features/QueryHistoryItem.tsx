'use client';

import { useState } from 'react';
import type { QueryDocument } from '@/types';

interface QueryHistoryItemProps {
  query: QueryDocument;
  onDelete: (id: string) => Promise<void>;
}

export default function QueryHistoryItem({ query, onDelete }: QueryHistoryItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(query.id);
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
    }
  };

  const formattedDate = new Date(query.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <button onClick={() => setExpanded(!expanded)} className="text-left w-full">
            <p className="text-sm font-medium text-gray-900 truncate">{query.queryText}</p>
            <p className="text-xs text-gray-500 mt-1">{formattedDate}</p>
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            {expanded ? 'Collapse' : 'Expand'}
          </button>

          {confirmDelete ? (
            <div className="flex gap-1">
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="text-xs px-2 py-1 rounded bg-red-600 text-white hover:bg-red-700 disabled:bg-gray-400"
              >
                {deleting ? '...' : 'Confirm'}
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-700 hover:bg-gray-200"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              className="text-sm text-red-600 hover:text-red-800"
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {expanded && (
        <div className="mt-4 space-y-3">
          <div className="rounded-md bg-gray-50 p-3">
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{query.guidance}</p>
          </div>
          <div className="rounded-md bg-yellow-50 border border-yellow-200 p-3">
            <p className="text-xs text-yellow-700">{query.disclaimer}</p>
          </div>
        </div>
      )}
    </div>
  );
}
