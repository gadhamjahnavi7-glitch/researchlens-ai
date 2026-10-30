import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  LogOut,
  User,
  ChevronDown,
  Search,
  ExternalLink,
  Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { useProject } from '../../context/ProjectContext.jsx';

export const Navbar = () => {
  const { user, logout } = useAuth();
  const { projects, selectedProjectId, selectProject, seedSample, loading: projectLoading } = useProject();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const navigate = useNavigate();

  const handleSeed = async () => {
    try {
      setSeeding(true);
      await seedSample();
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to seed demo workspace:', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-4 md:px-6 flex items-center justify-between">
      {/* Brand & Project Selector */}
      <div className="flex items-center space-x-6">
        <Link to="/dashboard" className="flex items-center space-x-2.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold shadow-sm shadow-indigo-200">
            RL
          </div>
          <div className="hidden sm:block">
            <span className="text-base font-bold text-slate-900 tracking-tight">ResearchLens</span>
            <span className="text-xs ml-1.5 px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-medium border border-indigo-200">AI</span>
          </div>
        </Link>

        {/* Project Selector Dropdown */}
        <div className="relative">
          <select
            value={selectedProjectId || ''}
            onChange={(e) => selectProject(e.target.value)}
            className="text-xs sm:text-sm font-medium bg-slate-50 border border-slate-300 text-slate-700 rounded-lg py-1.5 pl-3 pr-8 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 cursor-pointer max-w-[200px] sm:max-w-[280px] truncate"
          >
            {projects.length === 0 ? (
              <option value="">No Active Projects</option>
            ) : (
              projects.map(p => (
                <option key={p._id} value={p._id}>
                  📂 {p.title} ({p.documentCount || 0} docs)
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {/* Action Buttons & User Menu */}
      <div className="flex items-center space-x-3">
        {/* Quick Demo Workspace Loader */}
        <button
          onClick={handleSeed}
          disabled={seeding || projectLoading}
          className="inline-flex items-center space-x-1.5 text-xs font-medium px-3 py-1.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition shadow-sm"
          title="Instant load 3 sample scientific papers and demo workspace"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
          <span className="hidden md:inline">{seeding ? 'Seeding...' : 'Load Sample Papers'}</span>
          <span className="md:hidden">Demo</span>
        </button>

        {/* Quick Search Shortcut */}
        <Link
          to="/search"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
          title="Search documents and chunks"
        >
          <Search className="w-4 h-4" />
        </Link>

        {/* User Account Menu */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center space-x-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 transition border border-transparent hover:border-slate-200"
          >
            <div className="w-7 h-7 rounded-full bg-slate-200 border border-slate-300 text-slate-700 flex items-center justify-center text-xs font-semibold">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <span className="text-xs font-medium text-slate-700 hidden lg:inline max-w-[120px] truncate">
              {user?.name || 'Researcher'}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {dropdownOpen && (
            <div
              className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-lg border border-slate-200 py-1.5 z-50 text-sm animate-in fade-in"
              onMouseLeave={() => setDropdownOpen(false)}
            >
              <div className="px-3.5 py-2 border-b border-slate-100">
                <p className="text-xs font-medium text-slate-500">Signed in as</p>
                <p className="text-sm font-semibold text-slate-800 truncate">{user?.email}</p>
              </div>

              <Link
                to="/settings"
                onClick={() => setDropdownOpen(false)}
                className="flex items-center px-3.5 py-2 text-slate-700 hover:bg-slate-50 transition"
              >
                <User className="w-4 h-4 mr-2.5 text-slate-400" />
                Profile & Settings
              </Link>

              <button
                onClick={() => {
                  setDropdownOpen(false);
                  logout();
                }}
                className="w-full flex items-center px-3.5 py-2 text-rose-600 hover:bg-rose-50 transition text-left"
              >
                <LogOut className="w-4 h-4 mr-2.5 text-rose-500" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

