import React, { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import FileDetailsPanel from '../components/FileDetailsPanel';
import FileUploadModal from '../components/FileUploadModal';
import FilePreviewModal from '../components/FilePreviewModal';
import ShareModal from '../components/ShareModal';
import CreateFolderModal from '../components/CreateFolderModal';
import MoveModal from '../components/MoveModal';
import NewVersionModal from '../components/NewVersionModal';
import CreateFileRequestModal from '../components/CreateFileRequestModal';
import ConfirmationModal from '../components/ConfirmationModal';
import api from '../services/api';

const AppLayout = () => {
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
  const [isCreateRequestOpen, setIsCreateRequestOpen] = useState(false);
  const [selectedFileForDetails, setSelectedFileForDetails] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [shareFile, setShareFile] = useState(null);
  const [newVersionFile, setNewVersionFile] = useState(null);
  const [moveModalData, setMoveModalData] = useState(null); // { fileIds, folderIds, currentFolderId }

  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    title: '',
    message: '',
    confirmText: 'Confirm',
    isDestructive: true,
    onConfirm: () => {}
  });

  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  // Keyboard shortcut listener (Esc to close panel)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (selectedFileForDetails) setSelectedFileForDetails(null);
        if (previewFile) setPreviewFile(null);
        if (shareFile) setShareFile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedFileForDetails, previewFile, shareFile]);

  // Download File
  const handleDownload = async (file) => {
    try {
      const response = await api.get(`/files/${file._id}/download`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.originalName);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
      triggerRefresh();
    } catch (err) {
      console.error('Download failed:', err);
      alert('Failed to download file.');
    }
  };

  // File Star / Favorite Toggle
  const handleToggleFavoriteFile = async (file) => {
    try {
      await api.patch(`/files/${file._id}/favorite`);
      if (selectedFileForDetails?._id === file._id) {
        setSelectedFileForDetails((prev) => ({
          ...prev,
          isFavorite: !prev.isFavorite
        }));
      }
      triggerRefresh();
    } catch (err) {
      alert('Failed to update favorite status.');
    }
  };

  // Folder Star / Favorite Toggle
  const handleToggleFavoriteFolder = async (folder) => {
    try {
      await api.patch(`/folders/${folder._id}/favorite`);
      triggerRefresh();
    } catch (err) {
      alert('Failed to update folder favorite status.');
    }
  };

  // Trash File
  const handleTrashFile = (file) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Move to Trash',
      message: `Move "${file.originalName}" to trash? You can restore it later.`,
      confirmText: 'Move to Trash',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.patch(`/files/${file._id}/trash`);
          if (selectedFileForDetails?._id === file._id) {
            setSelectedFileForDetails(null);
          }
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          triggerRefresh();
        } catch (err) {
          alert('Failed to move file to trash.');
        }
      }
    });
  };

  // Trash Folder
  const handleTrashFolder = (folder) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Move Folder to Trash',
      message: `Move folder "${folder.name}" and its files to trash?`,
      confirmText: 'Move to Trash',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.patch(`/folders/${folder._id}/trash`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          triggerRefresh();
        } catch (err) {
          alert('Failed to move folder to trash.');
        }
      }
    });
  };

  // Restore File
  const handleRestoreFile = async (file) => {
    try {
      await api.patch(`/files/${file._id}/trash`);
      triggerRefresh();
    } catch (err) {
      alert('Failed to restore file.');
    }
  };

  // Restore Folder
  const handleRestoreFolder = async (folder) => {
    try {
      await api.patch(`/folders/${folder._id}/trash`);
      triggerRefresh();
    } catch (err) {
      alert('Failed to restore folder.');
    }
  };

  // Permanent Delete File
  const handleDeletePermanentFile = (file) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Permanently Delete File',
      message: `Are you sure you want to permanently delete "${file.originalName}" and its version history? This cannot be undone.`,
      confirmText: 'Delete Permanently',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/files/${file._id}`);
          if (selectedFileForDetails?._id === file._id) {
            setSelectedFileForDetails(null);
          }
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          triggerRefresh();
        } catch (err) {
          alert('Failed to delete file.');
        }
      }
    });
  };

  // Permanent Delete Folder
  const handleDeletePermanentFolder = (folder) => {
    setConfirmDialog({
      isOpen: true,
      title: 'Permanently Delete Folder',
      message: `Permanently delete folder "${folder.name}"? Files inside will be unassigned to Root.`,
      confirmText: 'Delete Permanently',
      isDestructive: true,
      onConfirm: async () => {
        try {
          await api.delete(`/folders/${folder._id}`);
          setConfirmDialog((prev) => ({ ...prev, isOpen: false }));
          triggerRefresh();
        } catch (err) {
          alert('Failed to delete folder.');
        }
      }
    });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-canvas-light dark:bg-canvas-dark text-primary-light dark:text-primary-dark font-sans">
      {/* Collapsible Left Sidebar */}
      <Sidebar onOpenUpload={() => setIsUploadOpen(true)} />

      {/* Main Workspace Container */}
      <div className="flex-1 flex overflow-hidden min-w-0">
        <main className="flex-1 min-w-0 flex flex-col overflow-y-auto">
          <Outlet
            context={{
              onOpenUpload: () => setIsUploadOpen(true),
              onOpenCreateFolder: () => setIsCreateFolderOpen(true),
              onOpenCreateRequest: () => setIsCreateRequestOpen(true),
              onOpenNewVersion: (file) => setNewVersionFile(file),
              onOpenMove: (data) => setMoveModalData(data),
              onFileClick: (file) => setSelectedFileForDetails(file),
              onPreview: (file) => setPreviewFile(file),
              onShare: (file) => setShareFile(file),
              onDownload: handleDownload,
              onTrashFile: handleTrashFile,
              onTrashFolder: handleTrashFolder,
              onRestoreFile: handleRestoreFile,
              onRestoreFolder: handleRestoreFolder,
              onDeletePermanentFile: handleDeletePermanentFile,
              onDeletePermanentFolder: handleDeletePermanentFolder,
              onToggleFavoriteFile: handleToggleFavoriteFile,
              onToggleFavoriteFolder: handleToggleFavoriteFolder,
              refreshTrigger,
              triggerRefresh
            }}
          />
        </main>

        {/* Right-Side File Details Panel (Inspector) */}
        {selectedFileForDetails && (
          <FileDetailsPanel
            file={selectedFileForDetails}
            isOpen={!!selectedFileForDetails}
            onClose={() => setSelectedFileForDetails(null)}
            onDownload={handleDownload}
            onShare={(file) => setShareFile(file)}
            onFavoriteToggle={handleToggleFavoriteFile}
            onTrash={handleTrashFile}
            onOpenNewVersion={(file) => setNewVersionFile(file)}
            onFileUpdated={triggerRefresh}
          />
        )}
      </div>

      {/* Global Modals */}
      <FileUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={triggerRefresh}
      />

      <CreateFolderModal
        isOpen={isCreateFolderOpen}
        onClose={() => setIsCreateFolderOpen(false)}
        onFolderCreated={triggerRefresh}
      />

      <CreateFileRequestModal
        isOpen={isCreateRequestOpen}
        onClose={() => setIsCreateRequestOpen(false)}
        onRequestCreated={triggerRefresh}
      />

      <NewVersionModal
        file={newVersionFile}
        isOpen={!!newVersionFile}
        onClose={() => setNewVersionFile(null)}
        onVersionUploaded={() => {
          triggerRefresh();
          if (selectedFileForDetails?._id === newVersionFile?._id) {
            // refresh selected file
            api.get(`/files/${newVersionFile._id}`).then((res) => {
              if (res.data.success) setSelectedFileForDetails(res.data.file);
            });
          }
        }}
      />

      {moveModalData && (
        <MoveModal
          isOpen={!!moveModalData}
          onClose={() => setMoveModalData(null)}
          fileIds={moveModalData.fileIds}
          folderIds={moveModalData.folderIds}
          currentFolderId={moveModalData.currentFolderId}
          onMoveSuccess={triggerRefresh}
        />
      )}

      <FilePreviewModal
        file={previewFile}
        isOpen={!!previewFile}
        onClose={() => setPreviewFile(null)}
        onDownload={handleDownload}
        onShare={(file) => {
          setPreviewFile(null);
          setShareFile(file);
        }}
      />

      <ShareModal
        file={shareFile}
        isOpen={!!shareFile}
        onClose={() => setShareFile(null)}
        onShareUpdated={triggerRefresh}
      />

      <ConfirmationModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDestructive={confirmDialog.isDestructive}
        onConfirm={confirmDialog.onConfirm}
        onClose={() => setConfirmDialog((prev) => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default AppLayout;
