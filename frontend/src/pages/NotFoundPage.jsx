import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 text-center">
      <div className="max-w-md space-y-4">
        <h1 className="text-6xl font-bold font-serif text-slate-800">404</h1>
        <h2 className="text-xl font-bold text-slate-900">Page Not Found</h2>
        <p className="text-sm text-slate-500">
          The requested research view does not exist or has been moved.
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};

