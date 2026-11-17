import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Clock } from 'lucide-react';
import Header from '../components/Header';
import FileTable from '../components/FileTable';
import api from '../services/api';

const RecentPage = () => {
  const {
    onFileClick,
    onPreview,
    onDownload,
    onShare,
    onTrashFile,
    onToggleFavoriteFile,
    refreshTrigger
  } = useOutletContext();

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecent = async () => {
      setLoading(true);
      try {
        const res = await api.get('/files/recent?limit=30');
        if (res.data.success) {
          setFiles(res.data.files || []);
        }
      } catch (err) {
        console.error('Failed to load recent files:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchRecent();
  }, [refreshTrigger]);

  return (
    <div className="flex-1 flex flex-col bg-canvas-light dark:bg-canvas-dark min-h-screen">
      <Header
        title="Recent Files"
        subtitle="Chronological trail of your recently uploaded and accessed documents"
      />

      <div className="p-6 space-y-4 max-w-7xl w-full mx-auto">
        <FileTable
          folders={[]}
          files={files}
          loading={loading}
          onFileClick={onFileClick}
          onPreview={onPreview}
          onDownload={onDownload}
          onShare={onShare}
          onTrashFile={onTrashFile}
          onToggleFavoriteFile={onToggleFavoriteFile}
        />
      </div>
    </div>
  );
};

export default RecentPage;
