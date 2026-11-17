import React, { useState, useEffect } from 'react';
import { useOutletContext, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import FileTable from '../components/FileTable';
import FileGrid from '../components/FileGrid';
import BulkActionBar from '../components/BulkActionBar';
import api from '../services/api';

const MyFiles = () => {
  const {
    onOpenUpload,
    onOpenCreateFolder,
    onOpenCreateRequest,
    onOpenNewVersion,
    onOpenMove,
    onFileClick,
    onPreview,
    onDownload,
    onShare,
    onTrashFile,
    onTrashFolder,
    onToggleFavoriteFile,
    onToggleFavoriteFolder,
    refreshTrigger,
    triggerRefresh
  } = useOutletContext();

  const [searchParams, setSearchParams] = useSearchParams();
  const currentFolderId = searchParams.get('folder') || null;

  const [folders, setFolders] = useState([]);
  const [files, setFiles] = useState([]);
  const [breadcrumbs, setBreadcrumbs] = useState([{ id: null, name: 'All Files' }]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [selectedTag, setSelectedTag] = useState('');
  const [viewMode, setViewMode] = useState(() => localStorage.getItem('vaultdrop_view_mode') || 'list');
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });

  // Bulk selection states
  const [selectedFileIds, setSelectedFileIds] = useState([]);
  const [selectedFolderIds, setSelectedFolderIds] = useState([]);

  const categories = [
    { id: 'all', label: 'All' },
    { id: 'documents', label: 'Docs' },
    { id: 'images', label: 'Images' },
    { id: 'archives', label: 'Archives' },
    { id: 'media', label: 'Media' }
  ];

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('vaultdrop_view_mode', mode);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const sortParam = `${sortConfig.key}_${sortConfig.direction}`;
      const fileParams = {
        trash: 'false',
        sort: sortParam
      };

      if (currentFolderId) {
        fileParams.folderId = currentFolderId;
      }
      if (search.trim()) fileParams.search = search.trim();
      if (category !== 'all') fileParams.category = category;
      if (selectedTag) fileParams.tag = selectedTag;

      const [foldersRes, filesRes] = await Promise.all([
        api.get('/folders', { params: { parentId: currentFolderId, trash: 'false' } }),
        api.get('/files', { params: fileParams })
      ]);

      if (foldersRes.data.success) {
        setFolders(foldersRes.data.folders || []);
      }
      if (filesRes.data.success) {
        setFiles(filesRes.data.files || []);
      }

      // Fetch breadcrumbs if inside folder
      if (currentFolderId) {
        const bcRes = await api.get(`/folders/${currentFolderId}/breadcrumbs`);
        if (bcRes.data.success) {
          setBreadcrumbs([
            { id: null, name: 'All Files' },
            ...(bcRes.data.breadcrumbs || [])
          ]);
        }
      } else {
        setBreadcrumbs([{ id: null, name: 'All Files' }]);
      }
    } catch (err) {
      console.error('Failed to load files and folders:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delay = setTimeout(fetchData, 150);
    return () => clearTimeout(delay);
  }, [currentFolderId, search, category, selectedTag, sortConfig, refreshTrigger]);

  // Navigate folder
  const handleFolderClick = (folder) => {
    setSelectedFileIds([]);
    setSelectedFolderIds([]);
    setSearchParams({ folder: folder._id });
  };

  const handleBreadcrumbClick = (bc) => {
    setSelectedFileIds([]);
    setSelectedFolderIds([]);
    if (bc.id) {
      setSearchParams({ folder: bc.id });
    } else {
      setSearchParams({});
    }
  };

  // Multi-select handlers
  const handleToggleSelectAll = () => {
    if (
      selectedFileIds.length === files.length &&
      selectedFolderIds.length === folders.length
    ) {
      setSelectedFileIds([]);
      setSelectedFolderIds([]);
    } else {
      setSelectedFileIds(files.map((f) => f._id));
      setSelectedFolderIds(folders.map((f) => f._id));
    }
  };

  const handleToggleSelectFile = (id) => {
    setSelectedFileIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleToggleSelectFolder = (id) => {
    setSelectedFolderIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk actions
  const handleBulkDownloadZip = async () => {
    if (selectedFileIds.length === 0) {
      alert('Please select at least one file to download.');
      return;
    }
    try {
      const response = await api.post(
        '/files/bulk/download',
        { fileIds: selectedFileIds },
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `VaultDrop_Archive_${Date.now()}.zip`);
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Bulk download failed.');
    }
  };

  const handleBulkTrash = async () => {
    const count = selectedFileIds.length + selectedFolderIds.length;
    if (!confirm(`Move ${count} selected item(s) to trash?`)) return;

    try {
      await api.post('/files/bulk/trash', {
        fileIds: selectedFileIds,
        folderIds: selectedFolderIds
      });
      setSelectedFileIds([]);
      setSelectedFolderIds([]);
      triggerRefresh();
    } catch (err) {
      alert('Failed to trash selected items.');
    }
  };

  const handleOpenMoveModal = () => {
    onOpenMove &&
      onOpenMove({
        fileIds: selectedFileIds,
        folderIds: selectedFolderIds,
        currentFolderId
      });
  };

  // Collect all unique tags for filter pills
  const allTags = Array.from(
    new Set(files.flatMap((f) => f.tags || []).filter(Boolean))
  );

  return (
    <div className="flex-1 flex flex-col bg-canvas-light dark:bg-canvas-dark min-h-screen">
      <Header
        breadcrumbs={breadcrumbs}
        onBreadcrumbClick={handleBreadcrumbClick}
        searchValue={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onOpenUpload={onOpenUpload}
        onOpenCreateFolder={onOpenCreateFolder}
        onOpenCreateRequest={onOpenCreateRequest}
      />

      <div className="p-6 space-y-4 max-w-7xl w-full mx-auto">
        {/* Controls: Categories & Tags Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Category Filter Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setCategory(cat.id)}
                className={`px-2.5 py-1 text-xs rounded-xs font-mono transition-colors whitespace-nowrap ${
                  category === cat.id
                    ? 'bg-primary-light dark:bg-primary-dark text-white dark:text-black font-semibold'
                    : 'bg-panel-light dark:bg-panel-dark text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark border border-line-light dark:border-line-dark'
                }`}
              >
                {cat.label}
              </button>
            ))}

            {/* Custom tags filter */}
            {allTags.map((tag) => (
              <button
                key={tag}
                onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
                className={`px-2 py-1 text-xs rounded-xs font-mono transition-colors whitespace-nowrap border ${
                  selectedTag === tag
                    ? 'bg-accent text-white border-accent font-semibold'
                    : 'bg-panel-light dark:bg-panel-dark text-secondary-light dark:text-secondary-dark border-line-light dark:border-line-dark hover:border-accent'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>

          <div className="text-[11px] font-mono text-tertiary-light dark:text-tertiary-dark">
            {folders.length} folder{folders.length === 1 ? '' : 's'} • {files.length} file{files.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* FILE LISTING VIEW */}
        {viewMode === 'list' ? (
          <FileTable
            folders={folders}
            files={files}
            loading={loading}
            selectedFileIds={selectedFileIds}
            selectedFolderIds={selectedFolderIds}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelectFile={handleToggleSelectFile}
            onToggleSelectFolder={handleToggleSelectFolder}
            sortConfig={sortConfig}
            onSort={(k, d) => setSortConfig({ key: k, direction: d })}
            onFolderClick={handleFolderClick}
            onFileClick={onFileClick}
            onPreview={onPreview}
            onDownload={onDownload}
            onShare={onShare}
            onTrashFile={onTrashFile}
            onTrashFolder={onTrashFolder}
            onToggleFavoriteFile={onToggleFavoriteFile}
            onToggleFavoriteFolder={onToggleFavoriteFolder}
            onOpenUpload={onOpenUpload}
          />
        ) : (
          <FileGrid
            folders={folders}
            files={files}
            selectedFileIds={selectedFileIds}
            selectedFolderIds={selectedFolderIds}
            onToggleSelectFile={handleToggleSelectFile}
            onToggleSelectFolder={handleToggleSelectFolder}
            onFolderClick={handleFolderClick}
            onFileClick={onFileClick}
            onPreview={onPreview}
            onDownload={onDownload}
            onShare={onShare}
            onTrashFile={onTrashFile}
            onTrashFolder={onTrashFolder}
            onToggleFavoriteFile={onToggleFavoriteFile}
            onToggleFavoriteFolder={onToggleFavoriteFolder}
          />
        )}
      </div>

      {/* Floating Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedFileIds.length + selectedFolderIds.length}
        onDownloadZip={handleBulkDownloadZip}
        onOpenMove={handleOpenMoveModal}
        onBulkTrash={handleBulkTrash}
        onClearSelection={() => {
          setSelectedFileIds([]);
          setSelectedFolderIds([]);
        }}
      />
    </div>
  );
};

export default MyFiles;
