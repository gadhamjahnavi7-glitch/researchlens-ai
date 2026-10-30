import React from 'react';

export const Badge = ({ variant = 'default', children, className = '' }) => {
  const styles = {
    default: 'bg-slate-100 text-slate-700 border-slate-200',
    verified: 'bg-emerald-50 text-emerald-700 border-emerald-200 font-medium',
    hypothesis: 'bg-amber-50 text-amber-700 border-amber-200 italic',
    unverified: 'bg-rose-50 text-rose-700 border-rose-200',
    primary: 'bg-indigo-50 text-indigo-700 border-indigo-200 font-medium',
    purple: 'bg-violet-50 text-violet-700 border-violet-200',
    completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    processing: 'bg-sky-50 text-sky-700 border-sky-200 animate-pulse',
    failed: 'bg-rose-50 text-rose-700 border-rose-200'
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs border ${
        styles[variant] || styles.default
      } ${className}`}
    >
      {children}
    </span>
  );
};

