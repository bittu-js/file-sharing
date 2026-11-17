import React from 'react';
import {
  MoreVertical,
  Star,
  Download,
  Share2,
  Trash2,
  Eye,
  Folder,
  Tag
} from 'lucide-react';
import { formatBytes, formatDate } from '../utils/formatters';
import { getFileIcon, getFolderIcon } from '../utils/fileIcons';

const FileGrid = ({
  folders = [],
  files = [],
  selectedFileIds = [],
  selectedFolderIds = [],
  onToggleSelectFile,
  onToggleSelectFolder,
  onFolderClick,
  onFileClick,
  onFileDoubleClick,
  onPreview,
  onDownload,
  onShare,
  onTrashFile,
  onTrashFolder,
  onToggleFavoriteFile,
  onToggleFavoriteFolder,
  isTrashView = false
}) => {
  return (
    <div className="space-y-6">
      {/* FOLDERS GRID SECTION */}
      {folders.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-[10px] font-semibold tracking-wider uppercase text-tertiary-light dark:text-tertiary-dark font-mono">
            FOLDERS ({folders.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {folders.map((folder) => {
              const isSelected = selectedFolderIds.includes(folder._id);
              return (
                <div
                  key={folder._id}
                  onClick={() => onFolderClick && onFolderClick(folder)}
                  className={`group relative p-3 rounded-sm border transition-all cursor-pointer select-none bg-panel-light dark:bg-panel-dark hover:border-accent ${
                    isSelected
                      ? 'border-accent ring-1 ring-accent bg-accent/5 dark:bg-accent/10'
                      : 'border-line-light dark:border-line-dark'
                  }`}
                >
                  {/* Select Checkbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectFolder && onToggleSelectFolder(folder._id);
                    }}
                    className={`absolute top-2 left-2 transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded-xs border-line-light dark:border-line-dark text-accent focus:ring-0"
                    />
                  </div>

                  {/* Favorite Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavoriteFolder && onToggleFavoriteFolder(folder);
                    }}
                    className={`absolute top-2 right-2 p-1 transition-opacity ${
                      folder.isFavorite
                        ? 'opacity-100 text-amber-500'
                        : 'opacity-0 group-hover:opacity-100 text-tertiary-light dark:text-tertiary-dark hover:text-amber-500'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${folder.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  <div className="flex flex-col items-center text-center pt-2">
                    <div className="w-10 h-10 mb-2 flex items-center justify-center">
                      {getFolderIcon(folder.color || 'blue', false, 'w-8 h-8')}
                    </div>
                    <p className="text-xs font-medium text-primary-light dark:text-primary-dark truncate w-full">
                      {folder.name}
                    </p>
                    <span className="text-[10px] text-tertiary-light dark:text-tertiary-dark font-mono mt-0.5">
                      Folder
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* FILES GRID SECTION */}
      {files.length > 0 && (
        <div className="space-y-2.5">
          <h3 className="text-[10px] font-semibold tracking-wider uppercase text-tertiary-light dark:text-tertiary-dark font-mono">
            FILES ({files.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
            {files.map((file) => {
              const isSelected = selectedFileIds.includes(file._id);
              const isImage = file.fileType?.startsWith('image/');

              return (
                <div
                  key={file._id}
                  onClick={() => onFileClick && onFileClick(file)}
                  onDoubleClick={() => onFileDoubleClick ? onFileDoubleClick(file) : onPreview(file)}
                  className={`group relative p-2.5 rounded-sm border transition-all cursor-pointer select-none bg-panel-light dark:bg-panel-dark hover:border-accent flex flex-col justify-between ${
                    isSelected
                      ? 'border-accent ring-1 ring-accent bg-accent/5 dark:bg-accent/10'
                      : 'border-line-light dark:border-line-dark'
                  }`}
                >
                  {/* Select Checkbox */}
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleSelectFile && onToggleSelectFile(file._id);
                    }}
                    className={`absolute top-2 left-2 z-10 transition-opacity ${
                      isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      readOnly
                      className="rounded-xs border-line-light dark:border-line-dark text-accent focus:ring-0"
                    />
                  </div>

                  {/* Favorite Toggle */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onToggleFavoriteFile && onToggleFavoriteFile(file);
                    }}
                    className={`absolute top-2 right-2 z-10 p-1 transition-opacity ${
                      file.isFavorite
                        ? 'opacity-100 text-amber-500'
                        : 'opacity-0 group-hover:opacity-100 text-tertiary-light dark:text-tertiary-dark hover:text-amber-500'
                    }`}
                  >
                    <Star className={`w-3 h-3 ${file.isFavorite ? 'fill-current' : ''}`} />
                  </button>

                  {/* Thumbnail / Icon area */}
                  <div className="w-full h-24 rounded-xs bg-subtle-light dark:bg-subtle-dark flex items-center justify-center overflow-hidden mb-2 relative">
                    {isImage ? (
                      <img
                        src={`/api/files/${file._id}/preview`}
                        alt={file.originalName}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      getFileIcon(file.fileType, file.originalName, 'w-8 h-8')
                    )}

                    {file.version > 1 && (
                      <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded-xs text-[9px] font-mono font-bold bg-primary-light dark:bg-primary-dark text-white dark:text-black">
                        v{file.version}
                      </span>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="w-full">
                    <p className="text-xs font-medium text-primary-light dark:text-primary-dark truncate" title={file.originalName}>
                      {file.originalName}
                    </p>
                    <div className="flex items-center justify-between text-[10px] text-tertiary-light dark:text-tertiary-dark font-mono mt-1">
                      <span>{formatBytes(file.fileSize)}</span>
                      <span>{formatDate(file.uploadDate).split(',')[0]}</span>
                    </div>

                    {file.tags && file.tags.length > 0 && (
                      <div className="flex gap-1 mt-1.5 overflow-hidden">
                        {file.tags.slice(0, 2).map((tag, i) => (
                          <span
                            key={i}
                            className="px-1 py-0.2 rounded-xs text-[9px] bg-subtle-light dark:bg-subtle-dark text-secondary-light dark:text-secondary-dark truncate font-mono"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default FileGrid;
