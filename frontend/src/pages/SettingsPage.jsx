import React, { useState, useEffect } from 'react';
import {
  Settings,
  Key,
  Database,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Sparkles,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';
import { useProject } from '../context/ProjectContext.jsx';
import axiosClient from '../api/axiosClient.js';
import { Badge } from '../components/common/Badge.jsx';

export const SettingsPage = () => {
  const { user, logout } = useAuth();
  const { seedSample } = useProject();
  const [health, setHealth] = useState(null);
  const [seeding, setSeeding] = useState(false);
  const [seedSuccess, setSeedSuccess] = useState(false);

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const res = await axiosClient.get('/health');
        setHealth(res.data);
      } catch (err) {
        console.error('Health check failed:', err);
      }
    };
    fetchHealth();
  }, []);

  const handleSeed = async () => {
    setSeeding(true);
    setSeedSuccess(false);
    try {
      await seedSample();
      setSeedSuccess(true);
      setTimeout(() => setSeedSuccess(false), 3000);
    } catch (err) {
      console.error('Seed error:', err);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Application Settings</h1>
        <p className="text-sm text-slate-500 mt-1">
          System environment, API credentials configuration, and researcher profile.
        </p>
      </div>

      {/* User Profile Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center space-x-2">
          <User className="w-4 h-4 text-indigo-600" />
          <span>Researcher Profile</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Full Name</span>
            <span className="font-bold text-slate-800">{user?.name || 'Researcher'}</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-slate-500 block mb-1">Email</span>
            <span className="font-bold text-slate-800 font-mono text-xs">{user?.email}</span>
          </div>
        </div>
      </div>

      {/* AI & Backend Status */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
          <Key className="w-4 h-4 text-indigo-600" />
          <span>Google Gemini API Status</span>
        </h2>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-slate-800">Gemini Generative AI Integration:</span>
            {health?.geminiConfigured ? (
              <Badge variant="verified">Configured & Active</Badge>
            ) : (
              <Badge variant="hypothesis">Local Evidence Mode Active</Badge>
            )}
          </div>

          <p className="text-xs text-slate-600 leading-relaxed font-light">
            When <code>GEMINI_API_KEY</code> is configured in <code>backend/.env</code>, full LLM multi-step generative reasoning runs through Google's official Gen AI SDK. When omitted, the platform seamlessly uses local BM25 evidence synthesis and excerpt verification.
          </p>

          {!health?.geminiConfigured && (
            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-xs text-indigo-900 space-y-1">
              <div className="font-semibold">How to activate Gemini API:</div>
              <ol className="list-decimal pl-4 space-y-0.5 text-[11px]">
                <li>Get a free Gemini API key from <a href="https://aistudio.google.com/" target="_blank" rel="noreferrer" className="underline font-bold">Google AI Studio</a>.</li>
                <li>Add <code>GEMINI_API_KEY=your_key_here</code> to <code>backend/.env</code>.</li>
                <li>Restart backend server: <code>npm run dev</code>.</li>
              </ol>
            </div>
          )}
        </div>
      </div>

      {/* Demonstration Workspace Reset */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900">One-Click Demonstration Data</h2>
          <p className="text-xs text-slate-500 mt-1">
            Instantly loads 3 scientific papers with verifiable findings, page numbers, and deliberate cross-paper contradictions.
          </p>
        </div>

        <button
          onClick={handleSeed}
          disabled={seeding}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 transition shadow-sm shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5" />
          {seeding ? 'Seeding...' : seedSuccess ? 'Sample Workspace Ready!' : 'Load Sample Workspace'}
        </button>
      </div>

      {/* Sign Out Action */}
      <div className="pt-4 border-t border-slate-200 flex justify-end">
        <button
          onClick={logout}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition"
        >
          <LogOut className="w-3.5 h-3.5 mr-1.5" />
          Sign Out of Account
        </button>
      </div>
    </div>
  );
};

