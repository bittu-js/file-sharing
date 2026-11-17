import React, { useState } from 'react';
import { X, FolderPlus, Loader2 } from 'lucide-react';
import api from '../services/api';

const CreateFolderModal = ({ isOpen, onClose, parentFolderId = null, onFolderCreated }) => {
  const [name, setName] = useState('');
  const [color, setColor] = useState('blue');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const colors = [
    { id: 'blue', label: 'Blue', bg: 'bg-blue-500' },
    { id: 'emerald', label: 'Emerald', bg: 'bg-emerald-500' },
    { id: 'amber', label: 'Amber', bg: 'bg-amber-500' },
    { id: 'purple', label: 'Purple', bg: 'bg-purple-500' },
    { id: 'rose', label: 'Rose', bg: 'bg-rose-500' },
    { id: 'slate', label: 'Slate', bg: 'bg-zinc-500' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError('');

    try {
      const res = await api.post('/folders', {
        name: name.trim(),
        parentId: parentFolderId,
        color
      });

      if (res.data.success) {
        setName('');
        onFolderCreated && onFolderCreated(res.data.folder);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create folder.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md max-w-sm w-full shadow-panel overflow-hidden animate-in fade-in duration-150">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line-light dark:border-line-dark">
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-accent" />
            <h3 className="text-xs font-semibold text-primary-light dark:text-primary-dark">
              Create New Folder
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xs text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-secondary-light dark:text-secondary-dark mb-1 font-mono uppercase">
              Folder Name
            </label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Design Specs, Invoices"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-xs text-primary-light dark:text-primary-dark focus:outline-none focus:border-accent"
            />
          </div>

          <div>
            <label className="block text-[11px] font-medium text-secondary-light dark:text-secondary-dark mb-1.5 font-mono uppercase">
              Color Tag
            </label>
            <div className="flex items-center gap-2">
              {colors.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setColor(c.id)}
                  title={c.label}
                  className={`w-5 h-5 rounded-full ${c.bg} transition-all ${
                    color === c.id ? 'ring-2 ring-accent ring-offset-2 dark:ring-offset-black scale-110' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line-light dark:border-line-dark">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-xs text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark border border-line-light dark:border-line-dark rounded-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-xs disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Create</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateFolderModal;
