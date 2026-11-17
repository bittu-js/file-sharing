import React from 'react';
import { formatBytes } from '../utils/formatters';

const StorageBar = ({ breakdown, totalBytes }) => {
  const categories = [
    { key: 'documents', label: 'Documents', color: 'bg-blue-500', text: 'text-blue-600' },
    { key: 'images', label: 'Images', color: 'bg-amber-500', text: 'text-amber-600' },
    { key: 'archives', label: 'Archives', color: 'bg-orange-500', text: 'text-orange-600' },
    { key: 'media', label: 'Media', color: 'bg-purple-500', text: 'text-purple-600' },
    { key: 'other', label: 'Other', color: 'bg-neutral-400', text: 'text-neutral-500' }
  ];

  const total = totalBytes || 1; // avoid division by 0

  return (
    <div className="bg-white border border-border rounded-lg p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold text-text-primary uppercase tracking-wider">
          Storage Breakdown
        </h3>
        <span className="text-xs text-text-secondary font-medium">
          {formatBytes(totalBytes)} used
        </span>
      </div>

      {/* Segmented bar */}
      <div className="h-2 w-full bg-surface-hover rounded-full overflow-hidden flex">
        {categories.map((cat) => {
          const bytes = breakdown?.[cat.key]?.bytes || 0;
          const percentage = (bytes / total) * 100;
          if (percentage <= 0) return null;
          return (
            <div
              key={cat.key}
              title={`${cat.label}: ${formatBytes(bytes)} (${Math.round(percentage)}%)`}
              className={`${cat.color} h-full transition-all duration-300 first:rounded-l-full last:rounded-r-full`}
              style={{ width: `${Math.max(percentage, 1)}%` }}
            />
          );
        })}
        {totalBytes === 0 && (
          <div className="w-full bg-neutral-100 h-full rounded-full" />
        )}
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4 pt-3 border-t border-border">
        {categories.map((cat) => {
          const item = breakdown?.[cat.key] || { count: 0, bytes: 0 };
          return (
            <div key={cat.key} className="flex items-start gap-2">
              <span className={`w-2 h-2 rounded-full ${cat.color} mt-1 flex-shrink-0`} />
              <div>
                <p className="text-[11px] font-medium text-text-primary leading-tight">
                  {cat.label}
                </p>
                <p className="text-[11px] text-text-muted leading-tight mt-0.5">
                  {formatBytes(item.bytes)} ({item.count})
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default StorageBar;
