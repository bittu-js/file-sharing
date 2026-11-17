import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Star } from 'lucide-react';
import Header from '../components/Header';
import FileTable from '../components/FileTable';
import api from '../services/api';

const FavoritesPage = () => {
  const {
    onFileClick,
    onPreview,
    onDownload,
    onShare,
    onTrashFile,
    onTrashFolder,
    onToggleFavoriteFile,
    onToggleFavoriteFolder,
    refreshTrigger
  } = useOutletContext();

  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFavorites = async () => {
      setLoading(true);
      try {
        const res = await api.get('/files/favorites');
        if (res.data.success) {
          setFiles(res.data.files || []);
          setFolders(res.data.folders || []);
        }
      } catch (err) {
        console.error('Failed to load favorites:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [refreshTrigger]);

  return (
    <div className="flex-1 flex flex-col bg-canvas-light dark:bg-canvas-dark min-h-screen">
      <Header
        title="Favorites"
        subtitle="Quick access to all your starred files and folders"
      />

      <div className="p-6 space-y-4 max-w-7xl w-full mx-auto">
        <FileTable
          folders={folders}
          files={files}
          loading={loading}
          onFileClick={onFileClick}
          onPreview={onPreview}
          onDownload={onDownload}
          onShare={onShare}
          onTrashFile={onTrashFile}
          onTrashFolder={onTrashFolder}
          onToggleFavoriteFile={onToggleFavoriteFile}
          onToggleFavoriteFolder={onToggleFavoriteFolder}
        />
      </div>
    </div>
  );
};

export default FavoritesPage;
