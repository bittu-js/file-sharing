import React from 'react';
import {
  Download,
  Share2,
  Eye,
  Trash2,
  Star,
  Link2,
  Lock,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  Folder,
  Tag,
  Upload,
  FolderOpen
} from 'lucide-react';
import { formatBytes, formatDate } from '../utils/formatters';
import { getFileIcon, getFolderIcon } from '../utils/fileIcons';

const FileTable = ({
  folders = [],
  files = [],
  loading = false,
  selectedFileIds = [],
  selectedFolderIds = [],
  onToggleSelectAll,
  onToggleSelectFile,
  onToggleSelectFolder,
  sortConfig = { key: 'date', direction: 'desc' },
  onSort,
  onFolderClick,
  onFileClick,
  onFileDoubleClick,
  onPreview,
  onDownload,
  onShare,
  onTrashFile,
  onTrashFolder,
  onRestoreFile,
  onRestoreFolder,
  onDeletePermanentFile,
  onDeletePermanentFolder,
  onToggleFavoriteFile,
  onToggleFavoriteFolder,
  isTrashView = false,
  onOpenUpload
}) => {
  const totalCount = folders.length + files.length;
  const isAllSelected =
    totalCount > 0 &&
    selectedFileIds.length === files.length &&
    selectedFolderIds.length === folders.length;

  const handleSort = (key) => {
    if (!onSort) return;
    const direction =
      sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc';
    onSort(key, direction);
  };

  const renderSortIndicator = (key) => {
    if (sortConfig.key !== key) {
      return (
        <ArrowUpDown className="w-3 h-3 text-tertiary-light dark:text-tertiary-dark opacity-0 group-hover:opacity-100 transition-opacity" />
      );
    }
    return sortConfig.direction === 'asc' ? (
      <ArrowUp className="w-3 h-3 text-primary-light dark:text-primary-dark" />
    ) : (
      <ArrowDown className="w-3 h-3 text-primary-light dark:text-primary-dark" />
    );
  };

  if (loading) {
    return (
      <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm overflow-hidden">
        <div className="p-12 text-center text-xs text-secondary-light dark:text-secondary-dark flex flex-col items-center justify-center gap-2">
          <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          <span className="font-mono text-[11px]">Loading files and folders...</span>
        </div>
      </div>
    );
  }

  if (folders.length === 0 && files.length === 0) {
    return (
      <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm p-12 text-center">
        <div className="w-10 h-10 rounded-sm bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark mx-auto flex items-center justify-center text-tertiary-light dark:text-tertiary-dark mb-3">
          <FolderOpen className="w-5 h-5" />
        </div>
        <h3 className="text-xs font-semibold uppercase tracking-wider text-primary-light dark:text-primary-dark font-mono">
          {isTrashView ? 'Recycle bin empty' : 'No items found'}
        </h3>
        <p className="text-[11px] text-tertiary-light dark:text-tertiary-dark mt-1 max-w-xs mx-auto">
          {isTrashView
            ? 'Deleted files and folders will remain here until permanently emptied.'
            : 'Get started by creating a folder or uploading files into this workspace.'}
        </p>
        {!isTrashView && onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="mt-4 px-3 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-sm transition-colors"
          >
            Upload files
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-sm overflow-hidden shadow-2xs">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-line-light dark:border-line-dark bg-subtle-light/60 dark:bg-subtle-dark/60 text-[10px] font-semibold text-tertiary-light dark:text-tertiary-dark uppercase tracking-wider font-mono select-none">
              <th className="py-2.5 px-3 w-8">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onToggleSelectAll}
                  className="rounded-xs border-line-light dark:border-line-dark text-accent focus:ring-0"
                />
              </th>
              <th className="py-2.5 px-2 w-7" />
              <th
                onClick={() => handleSort('name')}
                className="py-2.5 px-3 cursor-pointer group hover:text-primary-light dark:hover:text-primary-dark transition-colors"
              >
                <div className="flex items-center gap-1.5">
                  <span>Name</span>
                  {renderSortIndicator('name')}
                </div>
              </th>
              <th className="py-2.5 px-3 w-32 hidden lg:table-cell">
                <span>Tags</span>
              </th>
              <th
                onClick={() => handleSort('size')}
                className="py-2.5 px-3 cursor-pointer group hover:text-primary-light dark:hover:text-primary-dark transition-colors w-24 font-mono"
              >
                <div className="flex items-center gap-1.5">
                  <span>Size</span>
                  {renderSortIndicator('size')}
                </div>
              </th>
              <th
                onClick={() => handleSort('date')}
                className="py-2.5 px-3 cursor-pointer group hover:text-primary-light dark:hover:text-primary-dark transition-colors w-36 hidden md:table-cell"
              >
                <div className="flex items-center gap-1.5">
                  <span>Last Modified</span>
                  {renderSortIndicator('date')}
                </div>
              </th>
              <th className="py-2.5 px-3 w-32 hidden sm:table-cell">
                <span>Security</span>
              </th>
              <th className="py-2.5 px-3 text-right w-24">
                <span>Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line-light dark:divide-line-dark text-xs">
            {/* 1. FOLDERS LIST */}
            {folders.map((folder) => {
              const isSelected = selectedFolderIds.includes(folder._id);
              return (
                <tr
                  key={folder._id}
                  onClick={() => onFolderClick && onFolderClick(folder)}
                  className={`hover:bg-subtle-light/70 dark:hover:bg-subtle-dark/70 transition-colors group cursor-pointer ${
                    isSelected ? 'bg-accent/5 dark:bg-accent/10' : ''
                  }`}
                >
                  <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectFolder && onToggleSelectFolder(folder._id)}
                      className="rounded-xs border-line-light dark:border-line-dark text-accent focus:ring-0"
                    />
                  </td>
                  <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleFavoriteFolder && onToggleFavoriteFolder(folder)}
                      className={`p-0.5 rounded-xs transition-colors ${
                        folder.isFavorite
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-tertiary-light dark:text-tertiary-dark opacity-0 group-hover:opacity-100 hover:text-amber-500'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${folder.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </td>
                  <td className="py-2 px-3 font-medium text-primary-light dark:text-primary-dark">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {getFolderIcon(folder.color || 'blue', false, 'w-4 h-4 flex-shrink-0')}
                      <span className="truncate hover:text-accent transition-colors">
                        {folder.name}
                      </span>
                    </div>
                  </td>
                  <td className="py-2 px-3 hidden lg:table-cell">
                    <span className="text-[10px] text-tertiary-light dark:text-tertiary-dark font-mono">
                      Folder
                    </span>
                  </td>
                  <td className="py-2 px-3 text-secondary-light dark:text-secondary-dark font-mono text-[11px]">
                    —
                  </td>
                  <td className="py-2 px-3 text-tertiary-light dark:text-tertiary-dark text-[11px] hidden md:table-cell">
                    {formatDate(folder.updatedAt || folder.createdAt)}
                  </td>
                  <td className="py-2 px-3 hidden sm:table-cell">
                    <span className="inline-flex items-center px-1.5 py-0.2 rounded-xs text-[10px] font-mono uppercase bg-subtle-light dark:bg-subtle-dark text-tertiary-light dark:text-tertiary-dark border border-line-light dark:border-line-dark">
                      Folder
                    </span>
                  </td>
                  <td className="py-2 px-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {isTrashView ? (
                        <>
                          <button
                            onClick={() => onRestoreFolder && onRestoreFolder(folder)}
                            title="Restore folder"
                            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeletePermanentFolder && onDeletePermanentFolder(folder)}
                            title="Permanently delete"
                            className="p-1 text-rose-500 hover:text-rose-600 rounded-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => onTrashFolder && onTrashFolder(folder)}
                          title="Trash folder"
                          className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-rose-500 rounded-xs opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}

            {/* 2. FILES LIST */}
            {files.map((file) => {
              const isSelected = selectedFileIds.includes(file._id);
              const activeShare = file.activeShare;

              return (
                <tr
                  key={file._id}
                  onClick={() => onFileClick && onFileClick(file)}
                  onDoubleClick={() => onFileDoubleClick ? onFileDoubleClick(file) : onPreview(file)}
                  className={`hover:bg-subtle-light/70 dark:hover:bg-subtle-dark/70 transition-colors group cursor-pointer ${
                    isSelected ? 'bg-accent/5 dark:bg-accent/10' : ''
                  }`}
                >
                  {/* Select Checkbox */}
                  <td className="py-2 px-3" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => onToggleSelectFile && onToggleSelectFile(file._id)}
                      className="rounded-xs border-line-light dark:border-line-dark text-accent focus:ring-0"
                    />
                  </td>

                  {/* Favorite Toggle Star */}
                  <td className="py-2 px-1 text-center" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => onToggleFavoriteFile && onToggleFavoriteFile(file)}
                      className={`p-0.5 rounded-xs transition-colors ${
                        file.isFavorite
                          ? 'text-amber-500 fill-amber-500'
                          : 'text-tertiary-light dark:text-tertiary-dark opacity-0 group-hover:opacity-100 hover:text-amber-500'
                      }`}
                    >
                      <Star className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                  </td>

                  {/* File Name + Icon + Version Badge */}
                  <td className="py-2 px-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      {getFileIcon(file.fileType, file.originalName, 'w-4 h-4 flex-shrink-0')}
                      <div className="overflow-hidden flex items-center gap-1.5">
                        <span className="font-medium text-primary-light dark:text-primary-dark truncate hover:text-accent transition-colors">
                          {file.originalName}
                        </span>
                        {file.version > 1 && (
                          <span className="px-1 py-0.2 rounded-xs text-[9px] font-mono font-bold bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark text-secondary-light dark:text-secondary-dark flex-shrink-0">
                            v{file.version}
                          </span>
                        )}
                        {file.uploaderName && (
                          <span
                            title={`Uploaded via File Request by ${file.uploaderName} (${file.uploaderEmail || ''})`}
                            className="px-1.5 py-0.2 rounded-xs text-[9px] font-mono bg-accent/10 text-accent border border-accent/20 flex-shrink-0 truncate max-w-[120px]"
                          >
                            from: {file.uploaderName.split(' ')[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Tags */}
                  <td className="py-2 px-3 hidden lg:table-cell">
                    <div className="flex items-center gap-1 overflow-hidden">
                      {(file.tags || []).slice(0, 2).map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-1.5 py-0.2 rounded-xs text-[9px] font-mono bg-subtle-light dark:bg-subtle-dark text-secondary-light dark:text-secondary-dark border border-line-light dark:border-line-dark truncate"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* File Size */}
                  <td className="py-2 px-3 text-secondary-light dark:text-secondary-dark font-mono text-[11px] whitespace-nowrap">
                    {formatBytes(file.fileSize)}
                  </td>

                  {/* Upload Date */}
                  <td className="py-2 px-3 text-tertiary-light dark:text-tertiary-dark text-[11px] whitespace-nowrap hidden md:table-cell">
                    {formatDate(file.uploadDate)}
                  </td>

                  {/* Sharing / Security Badge */}
                  <td className="py-2 px-3 whitespace-nowrap hidden sm:table-cell">
                    {activeShare ? (
                      activeShare.isPasswordProtected ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs text-[10px] font-mono font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
                          <Lock className="w-2.5 h-2.5" />
                          <span>Protected</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs text-[10px] font-mono font-medium bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                          <Link2 className="w-2.5 h-2.5" />
                          <span>Shared</span>
                        </span>
                      )
                    ) : file.collaborators && file.collaborators.length > 0 ? (
                      <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-xs text-[10px] font-mono font-medium bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800">
                        <span>Collab ({file.collaborators.length})</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-1.5 py-0.2 rounded-xs text-[10px] font-mono uppercase bg-subtle-light dark:bg-subtle-dark text-tertiary-light dark:text-tertiary-dark border border-line-light dark:border-line-dark">
                        Private
                      </span>
                    )}
                  </td>

                  {/* Quick Actions Menu */}
                  <td className="py-2 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      {isTrashView ? (
                        <>
                          <button
                            onClick={() => onRestoreFile && onRestoreFile(file)}
                            title="Restore file"
                            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs"
                          >
                            <RefreshCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeletePermanentFile && onDeletePermanentFile(file)}
                            title="Delete permanently"
                            className="p-1 text-rose-500 hover:text-rose-600 rounded-xs"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => onPreview(file)}
                            title="Preview file"
                            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDownload(file)}
                            title="Download file"
                            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onShare(file)}
                            title="Share file link"
                            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark rounded-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onTrashFile(file)}
                            title="Trash file"
                            className="p-1 text-tertiary-light dark:text-tertiary-dark hover:text-rose-500 rounded-xs opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FileTable;
