import React from 'react';
import {
  FileText,
  Image as ImageIcon,
  FileArchive,
  Film,
  Music,
  FileCode,
  FileSpreadsheet,
  File,
  Folder,
  FolderOpen
} from 'lucide-react';

export const getFolderColorClass = (color = 'blue') => {
  switch (color) {
    case 'emerald':
      return 'text-emerald-500 fill-emerald-500/10';
    case 'amber':
      return 'text-amber-500 fill-amber-500/10';
    case 'purple':
      return 'text-purple-500 fill-purple-500/10';
    case 'rose':
      return 'text-rose-500 fill-rose-500/10';
    case 'slate':
      return 'text-zinc-400 fill-zinc-400/10';
    case 'blue':
    default:
      return 'text-blue-500 fill-blue-500/10';
  }
};

export const getFolderIcon = (color = 'blue', isOpen = false, className = 'w-4 h-4') => {
  const colorClass = getFolderColorClass(color);
  if (isOpen) {
    return <FolderOpen className={`${className} ${colorClass}`} />;
  }
  return <Folder className={`${className} ${colorClass}`} />;
};

export const getFileIcon = (fileType = '', fileName = '', className = 'w-4 h-4') => {
  const type = (fileType || '').toLowerCase();
  const ext = (fileName || '').split('.').pop().toLowerCase();

  // Images
  if (type.startsWith('image/') || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) {
    return <ImageIcon className={`${className} text-amber-500 dark:text-amber-400`} />;
  }

  // PDFs and Documents
  if (type.includes('pdf') || ext === 'pdf') {
    return <FileText className={`${className} text-rose-500 dark:text-rose-400`} />;
  }
  if (
    type.includes('word') ||
    type.includes('document') ||
    ['doc', 'docx', 'odt', 'rtf'].includes(ext)
  ) {
    return <FileText className={`${className} text-blue-500 dark:text-blue-400`} />;
  }

  // Spreadsheets
  if (
    type.includes('sheet') ||
    type.includes('excel') ||
    ['xls', 'xlsx', 'csv'].includes(ext)
  ) {
    return <FileSpreadsheet className={`${className} text-emerald-500 dark:text-emerald-400`} />;
  }

  // Archives / Compressed
  if (
    type.includes('zip') ||
    type.includes('tar') ||
    type.includes('rar') ||
    type.includes('7z') ||
    ['zip', 'rar', 'tar', 'gz', '7z'].includes(ext)
  ) {
    return <FileArchive className={`${className} text-orange-500 dark:text-orange-400`} />;
  }

  // Audio / Video
  if (type.startsWith('video/') || ['mp4', 'mov', 'avi', 'mkv', 'webm'].includes(ext)) {
    return <Film className={`${className} text-purple-500 dark:text-purple-400`} />;
  }
  if (type.startsWith('audio/') || ['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
    return <Music className={`${className} text-pink-500 dark:text-pink-400`} />;
  }

  // Code / Plain Text
  if (
    type.includes('javascript') ||
    type.includes('json') ||
    type.includes('html') ||
    type.includes('css') ||
    ['js', 'jsx', 'ts', 'tsx', 'json', 'html', 'css', 'py', 'java', 'cpp', 'c', 'sh'].includes(ext)
  ) {
    return <FileCode className={`${className} text-indigo-500 dark:text-indigo-400`} />;
  }

  // Default File
  return <File className={`${className} text-zinc-400 dark:text-zinc-500`} />;
};
