'use client';

interface GuidanceDisplayProps {
  guidance: string;
  disclaimer: string;
}

export default function GuidanceDisplay({ guidance, disclaimer }: GuidanceDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">AI Guidance</h3>
        <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
          {guidance}
        </div>
      </div>

      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <div className="flex gap-2">
          <span className="text-yellow-600 text-lg" aria-hidden="true">
            ⚠️
          </span>
          <div>
            <h4 className="text-sm font-semibold text-yellow-800">Medical Disclaimer</h4>
            <p className="mt-1 text-sm text-yellow-700">{disclaimer}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
