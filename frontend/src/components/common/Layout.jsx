import React, { useState } from 'react';
import { Outlet, Navigate, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';
import { Sidebar } from './Sidebar.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  LayoutDashboard,
  MessageSquareQuote,
  ShieldCheck,
  FileText,
  Network,
  Menu,
  X
} from 'lucide-react';
import { NavLink } from 'react-router-dom';

export const Layout = () => {
  const { isAuthenticated, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">Initializing ResearchLens AI...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#f8fafc]">
      <Navbar />

      <div className="flex-1 flex overflow-hidden">
        <Sidebar />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <Outlet />
        </main>
      </div>

      {/* Mobile Bottom Navigation for Quick Access on Handheld Devices */}
      <div className="md:hidden border-t border-slate-200 bg-white fixed bottom-0 left-0 right-0 z-40 flex justify-around items-center py-2 px-1 text-slate-500">
        <NavLink
          to="/dashboard"
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] ${isActive ? 'text-indigo-600 font-bold' : ''}`
          }
        >
          <LayoutDashboard className="w-5 h-5 mb-0.5" />
          Dashboard
        </NavLink>
        <NavLink
          to="/documents"
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] ${isActive ? 'text-indigo-600 font-bold' : ''}`
          }
        >
          <FileText className="w-5 h-5 mb-0.5" />
          Docs
        </NavLink>
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] ${isActive ? 'text-indigo-600 font-bold' : ''}`
          }
        >
          <MessageSquareQuote className="w-5 h-5 mb-0.5" />
          Chat
        </NavLink>
        <NavLink
          to="/evidence"
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] ${isActive ? 'text-indigo-600 font-bold' : ''}`
          }
        >
          <ShieldCheck className="w-5 h-5 mb-0.5" />
          Evidence
        </NavLink>
        <NavLink
          to="/discovery"
          className={({ isActive }) =>
            `flex flex-col items-center text-[10px] ${isActive ? 'text-indigo-600 font-bold' : ''}`
          }
        >
          <Network className="w-5 h-5 mb-0.5" />
          Graph
        </NavLink>
      </div>
    </div>
  );
};

