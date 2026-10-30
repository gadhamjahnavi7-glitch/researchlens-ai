import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FolderKanban,
  FileText,
  MessageSquareQuote,
  ShieldCheck,
  Network,
  GitCompare,
  FileSpreadsheet,
  Search,
  Settings,
  Sparkles
} from 'lucide-react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
  { name: 'Projects', path: '/projects', icon: FolderKanban },
  { name: 'Document Library', path: '/documents', icon: FileText },
  { name: 'Research Assistant', path: '/chat', icon: MessageSquareQuote },
  {
    name: 'Evidence Explorer',
    path: '/evidence',
    icon: ShieldCheck,
    isSignature: true
  },
  { name: 'Knowledge Discovery', path: '/discovery', icon: Network },
  { name: 'Contradiction Analysis', path: '/contradictions', icon: GitCompare },
  { name: 'Research Reports', path: '/reports', icon: FileSpreadsheet },
  { name: 'Search & Index', path: '/search', icon: Search },
  { name: 'Settings & API', path: '/settings', icon: Settings }
];

export const Sidebar = () => {
  return (
    <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex md:flex-col justify-between shrink-0 min-h-[calc(100vh-4rem)]">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Research Workspace
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`
              }
            >
              <div className="flex items-center space-x-3">
                <Icon className="w-4 h-4 shrink-0 text-slate-500" />
                <span>{item.name}</span>
              </div>
              {item.isSignature && (
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
                  Core
                </span>
              )}
            </NavLink>
          );
        })}
      </div>

      {/* Grounded AI Badge in Footer */}
      <div className="p-4 border-t border-slate-100 m-2 rounded-xl bg-slate-50/70 border">
        <div className="flex items-center space-x-2 text-indigo-700 font-semibold text-xs mb-1">
          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
          <span>Evidence-First AI</span>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Every statement is strictly linked to verified page-level source citations.
        </p>
      </div>
    </aside>
  );
};

