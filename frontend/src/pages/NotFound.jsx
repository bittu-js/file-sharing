import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-canvas-light dark:bg-canvas-dark flex items-center justify-center p-4">
      <div className="bg-panel-light dark:bg-panel-dark border border-line-light dark:border-line-dark rounded-md p-8 max-w-sm w-full text-center shadow-panel">
        <div className="w-12 h-12 rounded-full bg-subtle-light dark:bg-subtle-dark border border-line-light dark:border-line-dark mx-auto flex items-center justify-center text-tertiary-light dark:text-tertiary-dark mb-3">
          <FileQuestion className="w-6 h-6 text-tertiary-light dark:text-tertiary-dark" />
        </div>
        <h2 className="text-sm font-semibold text-primary-light dark:text-primary-dark">Page Not Found</h2>
        <p className="text-xs text-secondary-light dark:text-secondary-dark mt-1 leading-relaxed">
          The requested page does not exist or may have been moved.
        </p>
        <div className="mt-6 pt-4 border-t border-line-light dark:border-line-dark">
          <NavLink
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline font-mono"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Return to Dashboard</span>
          </NavLink>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
