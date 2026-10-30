import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  AlertTriangle,
  FileText,
  ShieldCheck,
  RefreshCw,
  Search,
  ExternalLink,
  Sparkles,
  Info
} from 'lucide-react';
import { useProject } from '../context/ProjectContext.jsx';
import { researchApi } from '../api/researchApi.js';
import { documentApi } from '../api/documentApi.js';
import { Badge } from '../components/common/Badge.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { CardSkeleton } from '../components/common/Skeleton.jsx';

export const ContradictionsPage = () => {
  const { selectedProjectId, selectedProject, seedSample } = useProject();
  const [documents, setDocuments] = useState([]);
  const [comparisons, setComparisons] = useState([]);
  const [overallVerdict, setOverallVerdict] = useState('');
  const [loading, setLoading] = useState(true);
  const [topicInput, setTopicInput] = useState('');
  const [analyzing, setAnalyzing] = useState(false);

  const loadContradictions = async (customTopic) => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const [docsRes, compRes] = await Promise.all([
        documentApi.getDocuments(selectedProjectId),
        researchApi.compareClaims({
          projectId: selectedProjectId,
          topic: customTopic || ''
        })
      ]);

      setDocuments(docsRes.documents || []);
      setComparisons(compRes.comparisons || []);
      setOverallVerdict(compRes.overallVerdict || '');
    } catch (err) {
      console.error('Failed to load contradiction analysis:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContradictions();
  }, [selectedProjectId]);

  const handleRunComparison = async (e) => {
    e.preventDefault();
    setAnalyzing(true);
    try {
      await loadContradictions(topicInput);
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold border border-amber-200 mb-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Cross-Document Scientific Divergence</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
              Contradiction & Claim Comparison
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-light mt-1 max-w-3xl leading-relaxed">
              Discovers conflicting findings, divergent outcome metrics, and methodological disagreements between independent research papers.
            </p>
          </div>

          <div className="text-right shrink-0">
            <Badge variant="hypothesis">Human Review Required</Badge>
          </div>
        </div>

        {/* Topic Filter Bar */}
        <form onSubmit={handleRunComparison} className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <input
            type="text"
            value={topicInput}
            onChange={(e) => setTopicInput(e.target.value)}
            placeholder="Filter by scientific variable (e.g. Cognitive vigilance, dosage, light exposure)..."
            className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={analyzing || loading || documents.length < 2}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm shrink-0"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${analyzing ? 'animate-spin' : ''}`} />
            {analyzing ? 'Comparing Claims...' : 'Compare Sources'}
          </button>
        </form>
      </div>

      {/* Human Review Advisory Callout */}
      <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-xs flex items-start space-x-3">
        <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="leading-relaxed font-light">
          <strong>Academic Verification Advisory:</strong> Disagreements may arise from differing sample cohorts, dosage concentrations, measurement timeframes, or environmental controls rather than direct logical falsehood. All identified discrepancies require expert researcher scrutiny.
        </div>
      </div>

      {/* Main Comparisons Content */}
      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : documents.length < 2 ? (
        <EmptyState
          icon={GitCompare}
          title="At least 2 documents required"
          description="Contradiction analysis compares findings across multiple papers. Please upload at least 2 papers or load the 3 sample demonstration papers."
          actionText="Load 3 Sample Papers"
          onAction={() => seedSample()}
        />
      ) : comparisons.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <ShieldCheck className="w-10 h-10 text-emerald-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800">No Direct Contradictions Detected</h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mt-1 mb-4">
            The analyzed passages do not exhibit statistically conflicting claims for this topic. The uploaded sources appear complementary.
          </p>
          <button
            onClick={() => seedSample()}
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
          >
            Load Sample Workspace (contains verifiable scientific contradictions) &rarr;
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {comparisons.map((item, idx) => (
            <div
              key={idx}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6 hover:border-slate-300 transition"
            >
              {/* Divergence Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Divergence #{idx + 1}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">
                    Topic: {item.topic}
                  </h3>
                </div>

                <Badge variant="hypothesis">Human Verification Flagged</Badge>
              </div>

              {/* Side-by-Side Claim Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Position A */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-indigo-600" />
                      <span className="truncate max-w-[200px]">{item.claimA?.sourceTitle || 'Study A'}</span>
                    </span>
                    <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      Page {item.claimA?.pageNumber || 1}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-900">
                    Claim: "{item.claimA?.statement}"
                  </div>

                  <blockquote className="text-xs text-slate-700 italic border-l-2 border-indigo-500 pl-2.5 font-serif leading-relaxed">
                    "{item.claimA?.excerpt}"
                  </blockquote>
                </div>

                {/* Position B */}
                <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/70 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center space-x-1.5">
                      <FileText className="w-3.5 h-3.5 text-violet-600" />
                      <span className="truncate max-w-[200px]">{item.claimB?.sourceTitle || 'Study B'}</span>
                    </span>
                    <span className="text-[11px] font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                      Page {item.claimB?.pageNumber || 1}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-900">
                    Claim: "{item.claimB?.statement}"
                  </div>

                  <blockquote className="text-xs text-slate-700 italic border-l-2 border-violet-500 pl-2.5 font-serif leading-relaxed">
                    "{item.claimB?.excerpt}"
                  </blockquote>
                </div>
              </div>

              {/* Hypothesized Reasons for Divergence */}
              {item.potentialReasons && item.potentialReasons.length > 0 && (
                <div className="bg-indigo-50/50 border border-indigo-100 rounded-xl p-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-900 mb-2">
                    Hypothesized Scientific Explanations for Divergence:
                  </h4>
                  <ul className="space-y-1.5 text-xs text-indigo-950 font-light">
                    {item.potentialReasons.map((reason, rIdx) => (
                      <li key={rIdx} className="flex items-start space-x-2">
                        <span className="text-indigo-600 font-bold">•</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

