import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Delete',
  isDestructive = true,
  loading = false
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-white border border-border rounded-lg max-w-sm w-full shadow-lg overflow-hidden animate-in fade-in duration-200">
        <div className="p-5">
          <div className="flex items-center gap-3">
            <div
              className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                isDestructive
                  ? 'bg-rose-50 text-rose-600 border border-rose-200'
                  : 'bg-amber-50 text-amber-600 border border-amber-200'
              }`}
            >
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-text-primary">{title}</h3>
              <p className="text-xs text-text-secondary mt-1">{message}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-5 py-3 border-t border-border bg-surface">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-3.5 py-1.5 text-xs font-medium text-text-secondary hover:text-text-primary bg-white border border-border rounded-md hover:bg-neutral-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`px-4 py-1.5 text-xs font-medium text-white rounded-md transition-colors ${
              isDestructive
                ? 'bg-rose-600 hover:bg-rose-700'
                : 'bg-brand-600 hover:bg-brand-700'
            }`}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
