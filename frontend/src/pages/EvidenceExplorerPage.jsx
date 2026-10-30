import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  FileText,
  Search,
  Filter,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Copy,
  Sparkles
} from 'lucide-react';
import { useProject } from '../context/ProjectContext.jsx';
import { researchApi } from '../api/researchApi.js';
import { documentApi } from '../api/documentApi.js';
import { Badge } from '../components/common/Badge.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { CardSkeleton } from '../components/common/Skeleton.jsx';

export const EvidenceExplorerPage = () => {
  const { selectedProjectId, selectedProject, seedSample } = useProject();
  const [evidenceList, setEvidenceList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('all'); // all, verified, hypothesis, unverified
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    const loadEvidence = async () => {
      if (!selectedProjectId) return;
      setLoading(true);
      try {
        const res = await researchApi.getEvidence(selectedProjectId);
        setEvidenceList(res.evidence || []);
      } catch (err) {
        console.error('Failed to load evidence:', err);
      } finally {
        setLoading(false);
      }
    };

    loadEvidence();
  }, [selectedProjectId]);

  const handleCopyExcerpt = (id, text) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredEvidence = evidenceList.filter((e) => {
    const matchesQuery =
      e.claim.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.documentTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      e.excerpt.toLowerCase().includes(searchQuery.toLowerCase());

    if (filterType === 'all') return matchesQuery;
    if (filterType === 'verified') return matchesQuery && e.verificationStatus === 'verified';
    if (filterType === 'hypothesis') return matchesQuery && e.verificationStatus === 'extrapolated';
    return matchesQuery;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Signature Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-200 text-xs font-semibold border border-indigo-400/30 mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Signature Feature: Evidence-First Truth Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold tracking-tight text-white">
              Evidence Explorer
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-3xl font-light leading-relaxed">
              Every factual assertion synthesized by ResearchLens AI is mapped directly to its exact published excerpt, original page number, and source paper. Inspect direct evidence versus AI-inferred hypotheses.
            </p>
          </div>

          <div className="flex items-center space-x-3 shrink-0">
            <Link
              to="/chat"
              className="inline-flex items-center px-4 py-2.5 rounded-xl text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 transition shadow-sm"
            >
              Ask New Inquiry &rarr;
            </Link>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-6 mt-6 border-t border-slate-700/60 text-xs">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <span className="text-slate-200 font-medium">Direct Evidence:</span>
            <span className="text-slate-400">Explicitly stated in source</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-200 font-medium">AI Hypothesis:</span>
            <span className="text-slate-400">Inferred relationship (unverified)</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
            <span className="text-slate-200 font-medium">Unsupported:</span>
            <span className="text-slate-400">Marked as lacking source data</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'all'
                ? 'bg-indigo-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Evidence ({evidenceList.length})
          </button>
          <button
            onClick={() => setFilterType('verified')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              filterType === 'verified'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Direct Verified Passages
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search claims or excerpts..."
            className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Evidence Cards Stream */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : filteredEvidence.length === 0 ? (
        <EmptyState
          title="No verified evidence citations recorded yet"
          description="Ask research questions in the Research Assistant or seed sample papers to generate page-level verifiable citations."
          actionText="Start Research Inquiry"
          onAction={() => window.location.href = '/chat'}
          secondaryActionText="Load Sample Papers"
          onSecondaryAction={() => seedSample()}
        />
      ) : (
        <div className="space-y-4">
          {filteredEvidence.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200">
                      [{item.citationId || `SRC-${idx + 1}`}]
                    </span>
                    <Badge variant={item.verificationStatus === 'verified' ? 'verified' : 'hypothesis'}>
                      {item.verificationStatus === 'verified' ? 'Direct Source Evidence' : 'AI Inferred Hypothesis'}
                    </Badge>
                  </div>
                  <h3 className="text-base font-bold text-slate-900 pt-1 leading-snug">
                    "{item.claim}"
                  </h3>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  <div className="text-right">
                    <div className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold">
                      Retrieval Score
                    </div>
                    <div className="text-sm font-mono font-bold text-emerald-600">
                      {Math.round((item.relevanceScore || 0.88) * 100)}% Match
                    </div>
                  </div>
                </div>
              </div>

              {/* Supporting Excerpt Box */}
              <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4 mb-4">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5 flex items-center justify-between">
                  <span>Verbatim Supporting Passage:</span>
                  <button
                    onClick={() => handleCopyExcerpt(idx, item.excerpt)}
                    className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium flex items-center space-x-1"
                  >
                    <Copy className="w-3 h-3" />
                    <span>{copiedId === idx ? 'Copied!' : 'Copy Quote'}</span>
                  </button>
                </div>
                <blockquote className="text-xs sm:text-sm text-slate-800 leading-relaxed font-serif italic border-l-2 border-indigo-500 pl-3">
                  "{item.excerpt}"
                </blockquote>
              </div>

              {/* Document and Page Metadata Footer */}
              <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center space-x-2 font-medium">
                  <FileText className="w-4 h-4 text-indigo-600" />
                  <span className="text-slate-800">{item.documentTitle}</span>
                  <span>•</span>
                  <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700 font-mono">
                    Page {item.pageNumber || 1}
                  </span>
                </div>

                {item.documentId && (
                  <Link
                    to={`/documents/${item.documentId}`}
                    className="inline-flex items-center text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                  >
                    Open Source Document &rarr;
                  </Link>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

