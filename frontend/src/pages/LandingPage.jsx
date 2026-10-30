import React from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  Sparkles,
  GitCompare,
  Network,
  FileSpreadsheet,
  ArrowRight,
  BookOpen,
  Search,
  CheckCircle2
} from 'lucide-react';

export const LandingPage = () => {
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Navigation */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-sm shadow-sm">
              RL
            </div>
            <span className="text-lg font-bold text-slate-900 tracking-tight">ResearchLens</span>
            <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono font-medium border border-indigo-200">AI</span>
          </div>

          <div className="flex items-center space-x-4">
            <Link
              to="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 transition"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="inline-flex items-center text-sm font-medium px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="py-20 md:py-28 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-medium mb-6">
            <ShieldCheck className="w-4 h-4 text-indigo-600" />
            <span>Evidence-First Academic AI — Never Hallucinated</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-bold text-slate-900 tracking-tight leading-tight mb-6">
            Transform Scattered Papers into <span className="text-indigo-600">Verifiable Scientific Knowledge</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-600 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Upload multiple research papers, cross-examine findings, detect conflicting claims, and generate publication-ready synthesis reports with every single sentence linked to exact page-level citations.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link
              to="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-medium bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-md shadow-indigo-100"
            >
              Launch Research Workspace
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-3.5 rounded-xl text-base font-medium bg-white text-slate-700 border border-slate-300 hover:bg-slate-50 transition"
            >
              Sign In to Existing Project
            </Link>
          </div>

          {/* Differentiator Highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left pt-6 border-t border-slate-200">
            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Evidence Explorer</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Click any claim to inspect the source paper, exact page number, and verbatim excerpt. AI inferences are explicitly labeled.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 text-amber-600 flex items-center justify-center mb-4">
                <GitCompare className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Contradiction Detection</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Detects conflicting conclusions across independent studies, highlighting methodological variances, cohort size differences, and dosage limits.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <div className="w-10 h-10 rounded-xl bg-violet-50 border border-violet-100 text-violet-600 flex items-center justify-center mb-4">
                <Network className="w-5 h-5" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-2">Knowledge Graph Discovery</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Automatically extracts cross-paper themes, concept relationships, and unaddressed research gaps to accelerate literature reviews.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 text-center text-xs text-slate-500">
        <p>ResearchLens AI — Built for the Hackathon: AI for Research & Knowledge Discovery</p>
      </footer>
    </div>
  );
};

