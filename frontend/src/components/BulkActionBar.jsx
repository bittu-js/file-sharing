import React from 'react';
import { Download, FolderInput, Trash2, X } from 'lucide-react';

const BulkActionBar = ({
  selectedCount,
  onDownloadZip,
  onOpenMove,
  onBulkTrash,
  onClearSelection
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark shadow-panel rounded-md px-4 py-2.5 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200">
      <div className="flex items-center gap-2 border-r border-line-light dark:border-line-dark pr-3">
        <span className="w-5 h-5 rounded-full bg-accent text-white flex items-center justify-center text-[10px] font-bold font-mono">
          {selectedCount}
        </span>
        <span className="text-xs font-medium text-primary-light dark:text-primary-dark">
          Selected
        </span>
      </div>

      <div className="flex items-center gap-1.5">
        <button
          onClick={onDownloadZip}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark hover:bg-subtle-light dark:hover:bg-subtle-dark rounded-xs transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-accent" />
          <span>Download ZIP</span>
        </button>

        <button
          onClick={onOpenMove}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark hover:bg-subtle-light dark:hover:bg-subtle-dark rounded-xs transition-colors"
        >
          <FolderInput className="w-3.5 h-3.5 text-blue-500" />
          <span>Move</span>
        </button>

        <button
          onClick={onBulkTrash}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xs transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Trash</span>
        </button>
      </div>

      <button
        onClick={onClearSelection}
        title="Deselect all"
        className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs ml-1"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};

export default BulkActionBar;
