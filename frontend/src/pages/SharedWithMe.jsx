import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Users, File, Download, Eye, Share2 } from 'lucide-react';
import Header from '../components/Header';
import FileTable from '../components/FileTable';
import api from '../services/api';

const SharedWithMe = () => {
  const { onFileClick, onPreview, onDownload, refreshTrigger } = useOutletContext();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSharedWithMe = async () => {
      setLoading(true);
      try {
        const res = await api.get('/files/shared-with-me');
        if (res.data.success) {
          setFiles(res.data.files || []);
        }
      } catch (err) {
        console.error('Failed to load files shared with you:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSharedWithMe();
  }, [refreshTrigger]);

  return (
    <div className="flex-1 flex flex-col bg-canvas-light dark:bg-canvas-dark min-h-screen">
      <Header
        title="Shared With Me"
        subtitle="Documents and resources shared with your account by collaborators"
      />

      <div className="p-6 space-y-4 max-w-7xl w-full mx-auto">
        <FileTable
          files={files}
          folders={[]}
          loading={loading}
          onFileClick={onFileClick}
          onPreview={onPreview}
          onDownload={onDownload}
        />
      </div>
    </div>
  );
};

export default SharedWithMe;
