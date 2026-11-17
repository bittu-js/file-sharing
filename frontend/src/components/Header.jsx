import React from 'react';
import {
  Search,
  LayoutGrid,
  List,
  FolderPlus,
  Upload,
  Inbox,
  ChevronRight,
  X
} from 'lucide-react';

const Header = ({
  breadcrumbs = [],
  onBreadcrumbClick,
  title,
  subtitle,
  searchValue = '',
  onSearchChange,
  viewMode = 'list',
  onViewModeChange,
  onOpenUpload,
  onOpenCreateFolder,
  onOpenCreateRequest
}) => {
  return (
    <header className="h-14 border-b border-line-light dark:border-line-dark bg-panel-light dark:bg-panel-dark px-6 flex items-center justify-between sticky top-0 z-20">
      {/* Left: Breadcrumbs or Title */}
      <div className="flex items-center gap-2 overflow-hidden max-w-lg">
        {breadcrumbs && breadcrumbs.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-xs text-secondary-light dark:text-secondary-dark truncate">
            {breadcrumbs.map((b, i) => (
              <React.Fragment key={b.id || i}>
                {i > 0 && <ChevronRight className="w-3 h-3 text-tertiary-light dark:text-tertiary-dark flex-shrink-0" />}
                <button
                  onClick={() => onBreadcrumbClick && onBreadcrumbClick(b)}
                  className={`hover:text-primary-light dark:hover:text-primary-dark transition-colors truncate ${
                    i === breadcrumbs.length - 1
                      ? 'font-semibold text-primary-light dark:text-primary-dark'
                      : 'font-normal'
                  }`}
                >
                  {b.name}
                </button>
              </React.Fragment>
            ))}
          </nav>
        ) : (
          <div>
            <h1 className="text-xs font-semibold uppercase tracking-wider text-primary-light dark:text-primary-dark">
              {title}
            </h1>
            {subtitle && (
              <p className="text-[11px] text-tertiary-light dark:text-tertiary-dark hidden sm:block">
                {subtitle}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Right Controls: Search, View Switcher, Action Buttons */}
      <div className="flex items-center gap-2.5">
        {/* Search Input */}
        {onSearchChange !== undefined && (
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-tertiary-light dark:text-tertiary-dark absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search files (Ctrl+K)..."
              value={searchValue}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full text-xs pl-8 pr-7 py-1.5 bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark rounded-sm text-primary-light dark:text-primary-dark placeholder:text-tertiary-light dark:placeholder:text-tertiary-dark focus:outline-none focus:border-accent transition-colors font-sans"
            />
            {searchValue && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* View Switcher: List vs Grid */}
        {onViewModeChange && (
          <div className="flex items-center border border-line-light dark:border-line-dark rounded-sm p-0.5 bg-subtle-light dark:bg-subtle-dark">
            <button
              onClick={() => onViewModeChange('list')}
              title="List View"
              className={`p-1 rounded-xs transition-colors ${
                viewMode === 'list'
                  ? 'bg-panel-light dark:bg-panel-dark text-primary-light dark:text-primary-dark shadow-2xs font-medium'
                  : 'text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark'
              }`}
            >
              <List className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onViewModeChange('grid')}
              title="Grid View"
              className={`p-1 rounded-xs transition-colors ${
                viewMode === 'grid'
                  ? 'bg-panel-light dark:bg-panel-dark text-primary-light dark:text-primary-dark shadow-2xs font-medium'
                  : 'text-tertiary-light dark:text-tertiary-dark hover:text-primary-light dark:hover:text-primary-dark'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Action Buttons */}
        {onOpenCreateFolder && (
          <button
            onClick={onOpenCreateFolder}
            title="Create Folder"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark border border-line-light dark:border-line-dark hover:bg-subtle-light dark:hover:bg-subtle-dark rounded-sm transition-colors"
          >
            <FolderPlus className="w-3.5 h-3.5" />
            <span className="hidden md:inline">New Folder</span>
          </button>
        )}

        {onOpenCreateRequest && (
          <button
            onClick={onOpenCreateRequest}
            title="Create Upload Request Portal"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-secondary-light dark:text-secondary-dark hover:text-primary-light dark:hover:text-primary-dark border border-line-light dark:border-line-dark hover:bg-subtle-light dark:hover:bg-subtle-dark rounded-sm transition-colors"
          >
            <Inbox className="w-3.5 h-3.5" />
            <span className="hidden md:inline">File Request</span>
          </button>
        )}

        {onOpenUpload && (
          <button
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white dark:text-black bg-primary-light dark:bg-primary-dark hover:opacity-90 rounded-sm transition-colors shadow-2xs"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default Header;
