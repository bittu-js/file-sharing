import React, { useState, useEffect } from 'react';
import { X, Folder, FolderInput, Loader2, Home } from 'lucide-react';
import api from '../services/api';

const MoveModal = ({
  isOpen,
  onClose,
  fileIds = [],
  folderIds = [],
  currentFolderId = null,
  onMoveSuccess
}) => {
  const [folders, setFolders] = useState([]);
  const [targetFolderId, setTargetFolderId] = useState(null);
  const [loadingFolders, setLoadingFolders] = useState(true);
  const [moving, setMoving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      fetchFolders();
      setTargetFolderId(null);
      setError('');
    }
  }, [isOpen]);

  const fetchFolders = async () => {
    setLoadingFolders(true);
    try {
      const res = await api.get('/folders?all=true');
      if (res.data.success) {
        // Exclude the folders being moved so user can't move folder into itself
        const filtered = (res.data.folders || []).filter(
          (f) => !folderIds.includes(f._id)
        );
        setFolders(filtered);
      }
    } catch (err) {
      console.error('Failed to load folders:', err);
    } finally {
      setLoadingFolders(false);
    }
  };

  if (!isOpen) return null;

  const totalItemsCount = fileIds.length + folderIds.length;

  const handleMove = async () => {
    setMoving(true);
    setError('');

    try {
      const res = await api.post('/files/bulk/move', {
        fileIds,
        folderIds,
        targetFolderId
      });

      if (res.data.success) {
        onMoveSuccess && onMoveSuccess();
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to move items.');
    } finally {
      setMoving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md max-w-sm w-full shadow-panel overflow-hidden animate-in fade-in duration-150">
        <div className="flex items-center justify-between px-4 py-3 border-b border-line-light dark:border-line-dark">
          <div className="flex items-center gap-2">
            <FolderInput className="w-4 h-4 text-blue-500" />
            <h3 className="text-xs font-semibold text-primary-light dark:text-primary-dark">
              Move {totalItemsCount} item{totalItemsCount === 1 ? '' : 's'} to...
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {error && (
            <div className="p-2 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xs text-xs text-rose-600 dark:text-rose-400">
              {error}
            </div>
          )}

          <p className="text-[11px] text-secondary-light dark:text-secondary-dark">
            Select a destination folder:
          </p>

          <div className="border border-line-light dark:border-line-dark rounded-xs max-h-56 overflow-y-auto divide-y divide-line-light dark:divide-line-dark text-xs">
            {/* Root Option */}
            <button
              type="button"
              onClick={() => setTargetFolderId(null)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                targetFolderId === null
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'hover:bg-subtle-light dark:hover:bg-subtle-dark text-primary-light dark:text-primary-dark'
              }`}
            >
              <Home className="w-3.5 h-3.5 text-blue-500" />
              <span>Root (My Files)</span>
            </button>

            {loadingFolders ? (
              <div className="p-4 text-center text-xs text-tertiary-light dark:text-tertiary-dark">
                Loading folders...
              </div>
            ) : folders.length === 0 ? (
              <div className="p-3 text-center text-[11px] text-tertiary-light dark:text-tertiary-dark">
                No folders created yet.
              </div>
            ) : (
              folders.map((f) => (
                <button
                  key={f._id}
                  type="button"
                  onClick={() => setTargetFolderId(f._id)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${
                    targetFolderId === f._id
                      ? 'bg-accent/10 text-accent font-medium'
                      : 'hover:bg-subtle-light dark:hover:bg-subtle-dark text-primary-light dark:text-primary-dark'
                  }`}
                >
                  <Folder className="w-3.5 h-3.5 text-blue-500" />
                  <span className="truncate">{f.name}</span>
                </button>
              ))
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-line-light dark:border-line-dark">
            <button
              type="button"
              onClick={onClose}
              disabled={moving}
              className="px-3 py-1.5 text-xs text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark border border-line-light dark:border-line-dark rounded-xs"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleMove}
              disabled={moving}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-xs disabled:opacity-50"
            >
              {moving && <Loader2 className="w-3 h-3 animate-spin" />}
              <span>Move Here</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoveModal;
