import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileQuestion, ArrowLeft } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="bg-white border border-border rounded-lg p-8 max-w-sm w-full text-center shadow-2xs">
        <div className="w-12 h-12 rounded-full bg-surface border border-border mx-auto flex items-center justify-center text-text-muted mb-3">
          <FileQuestion className="w-6 h-6 text-neutral-400" />
        </div>
        <h2 className="text-sm font-semibold text-text-primary">Page Not Found</h2>
        <p className="text-xs text-text-muted mt-1 leading-relaxed">
          The requested page does not exist or may have been moved.
        </p>
        <div className="mt-6 pt-4 border-t border-border">
          <NavLink
            to="/"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700"
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
