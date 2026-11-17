import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Trash2, AlertTriangle, RefreshCw, XCircle } from 'lucide-react';
import Header from '../components/Header';
import FileTable from '../components/FileTable';
import api from '../services/api';

const TrashPage = () => {
  const { onRestoreFile, onDeletePermanentFile, refreshTrigger, triggerRefresh } = useOutletContext();
  const [trashFiles, setTrashFiles] = useState([]);
  const [trashFolders, setTrashFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchTrashItems = async () => {
    setLoading(true);
    try {
      const [filesRes, foldersRes] = await Promise.all([
        api.get('/files', { params: { trash: 'true', all: 'true' } }),
        api.get('/folders', { params: { trash: 'true', all: 'true' } })
      ]);
      if (filesRes.data.success) {
        setTrashFiles(filesRes.data.files || []);
      }
      if (foldersRes.data.success) {
        setTrashFolders(foldersRes.data.folders || []);
      }
    } catch (err) {
      console.error('Failed to load trash items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTrashItems();
  }, [refreshTrigger]);

  const handleEmptyTrash = async () => {
    if (!confirm('Are you sure you want to permanently empty the trash? All files and historical versions will be permanently erased.')) {
      return;
    }
    try {
      await api.post('/files/trash/empty');
      fetchTrashItems();
      triggerRefresh();
    } catch (err) {
      alert('Failed to empty trash.');
    }
  };

  const handleRestoreAll = async () => {
    try {
      await api.post('/files/trash/restore-all');
      fetchTrashItems();
      triggerRefresh();
    } catch (err) {
      alert('Failed to restore all items.');
    }
  };

  const totalCount = trashFiles.length + trashFolders.length;

  return (
    <div className="flex-1 flex flex-col bg-canvas-light dark:bg-canvas-dark min-h-screen">
      <Header
        title="Recycle Bin"
        subtitle="Manage soft-deleted files and folders. Items can be restored or purged permanently."
      />

      <div className="p-6 space-y-4 max-w-7xl w-full mx-auto">
        {totalCount > 0 && (
          <div className="flex items-center justify-between p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900 rounded-sm text-xs text-amber-800 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>
                {totalCount} item{totalCount === 1 ? '' : 's'} in Recycle Bin.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestoreAll}
                className="flex items-center gap-1 px-2.5 py-1 font-medium bg-panel-light dark:bg-panel-dark text-primary-light dark:text-primary-dark border border-line-light dark:border-line-dark rounded-xs hover:bg-subtle-light dark:hover:bg-subtle-dark transition-colors"
              >
                <RefreshCw className="w-3 h-3" />
                <span>Restore All</span>
              </button>
              <button
                onClick={handleEmptyTrash}
                className="flex items-center gap-1 px-2.5 py-1 font-medium bg-rose-600 text-white rounded-xs hover:bg-rose-700 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                <span>Empty Trash</span>
              </button>
            </div>
          </div>
        )}

        <FileTable
          folders={trashFolders}
          files={trashFiles}
          loading={loading}
          isTrashView={true}
          onRestoreFile={onRestoreFile}
          onDeletePermanentFile={onDeletePermanentFile}
        />
      </div>
    </div>
  );
};

export default TrashPage;
