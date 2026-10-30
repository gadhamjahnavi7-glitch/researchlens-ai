import React, { useState, useEffect } from 'react';
import {
  Network,
  Sparkles,
  Layers,
  ArrowRight,
  TrendingUp,
  HelpCircle,
  ShieldCheck,
  RefreshCw,
  Info
} from 'lucide-react';
import { useProject } from '../context/ProjectContext.jsx';
import { discoveryApi } from '../api/discoveryApi.js';
import { Badge } from '../components/common/Badge.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { CardSkeleton } from '../components/common/Skeleton.jsx';

export const KnowledgeDiscoveryPage = () => {
  const { selectedProjectId, selectedProject, seedSample } = useProject();
  const [discovery, setDiscovery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);

  const loadDiscovery = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const res = await discoveryApi.getProjectDiscovery(selectedProjectId);
      setDiscovery(res.discovery);
      if (res.discovery?.graphData?.nodes?.length > 0) {
        setSelectedNode(res.discovery.graphData.nodes[0]);
      }
    } catch (err) {
      console.error('Failed to load discovery data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDiscovery();
  }, [selectedProjectId]);

  const handleReanalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await discoveryApi.analyzeProject({ projectId: selectedProjectId });
      setDiscovery(res.discovery);
    } catch (err) {
      console.error('Failed to re-analyze:', err);
    } finally {
      setAnalyzing(false);
    }
  };

  const themes = discovery?.themes || [];
  const concepts = discovery?.concepts || [];
  const gaps = discovery?.researchGaps || [];
  const directions = discovery?.emergingDirections || [];
  const nodes = discovery?.graphData?.nodes || [];
  const links = discovery?.graphData?.links || [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-violet-50 text-violet-700 text-xs font-semibold border border-violet-200 mb-2">
            <Network className="w-3.5 h-3.5" />
            <span>Cross-Document Knowledge Discovery</span>
          </div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
            Knowledge Synthesis & Concept Map
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-light mt-1">
            Discover macro themes, concept networks, and unaddressed scientific gaps across active project documents.
          </p>
        </div>

        <button
          onClick={handleReanalyze}
          disabled={analyzing || loading || !selectedProjectId}
          className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm shrink-0"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${analyzing ? 'animate-spin' : ''}`} />
          {analyzing ? 'Re-synthesizing Knowledge...' : 'Re-analyze Documents'}
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : !discovery || (themes.length === 0 && concepts.length === 0) ? (
        <EmptyState
          title="No discovery insights found"
          description="Upload research papers or load the sample workspace to extract knowledge themes and concept networks."
          actionText="Load Sample Papers"
          onAction={() => seedSample()}
        />
      ) : (
        <>
          {/* Top Section: Concept Network Graph Visualizer */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-100 mb-6">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                  <span>Interactive Concept Map & Relationships</span>
                  <Badge variant="hypothesis">AI-Generated Hypotheses</Badge>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Visual node network connecting identified entities across papers. Click any node to inspect relationship details.
                </p>
              </div>

              <div className="text-[11px] text-slate-400 font-medium">
                {nodes.length} Concepts • {links.length} Relations
              </div>
            </div>

            {/* SVG Interactive Graph Canvas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 bg-slate-900 rounded-2xl p-4 flex items-center justify-center relative min-h-[360px] overflow-hidden shadow-inner">
                {/* SVG Visualizer */}
                <svg viewBox="0 0 500 320" className="w-full h-full max-h-[350px]">
                  {/* Links */}
                  {links.map((link, idx) => {
                    const sourceNode = nodes.find(n => n.id === link.source) || nodes[0];
                    const targetNode = nodes.find(n => n.id === link.target) || nodes[idx % nodes.length];
                    const angle = (idx / Math.max(1, links.length)) * 2 * Math.PI;
                    const x1 = 250;
                    const y1 = 160;
                    const x2 = 250 + Math.cos(angle) * 125;
                    const y2 = 160 + Math.sin(angle) * 110;

                    return (
                      <g key={idx}>
                        <line
                          x1={x1}
                          y1={y1}
                          x2={x2}
                          y2={y2}
                          stroke="#4f46e5"
                          strokeWidth="2"
                          strokeDasharray="4 3"
                          opacity="0.6"
                        />
                        <text
                          x={(x1 + x2) / 2}
                          y={(y1 + y2) / 2 - 4}
                          fill="#a5b4fc"
                          fontSize="9"
                          textAnchor="middle"
                          fontFamily="monospace"
                        >
                          {link.label}
                        </text>
                      </g>
                    );
                  })}

                  {/* Central Node */}
                  <g className="cursor-pointer" onClick={() => setSelectedNode(nodes[0])}>
                    <circle cx="250" cy="160" r="28" fill="#4338ca" stroke="#6366f1" strokeWidth="3" />
                    <text x="250" y="164" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">
                      Core Domain
                    </text>
                  </g>

                  {/* Peripheral Nodes */}
                  {nodes.slice(1).map((node, idx) => {
                    const angle = (idx / Math.max(1, nodes.length - 1)) * 2 * Math.PI;
                    const cx = 250 + Math.cos(angle) * 125;
                    const cy = 160 + Math.sin(angle) * 110;
                    const isSelected = selectedNode?.id === node.id;

                    return (
                      <g
                        key={node.id}
                        className="cursor-pointer hover:opacity-90 transition"
                        onClick={() => setSelectedNode(node)}
                      >
                        <circle
                          cx={cx}
                          cy={cy}
                          r={isSelected ? 22 : 18}
                          fill={isSelected ? '#10b981' : '#334155'}
                          stroke={isSelected ? '#34d399' : '#64748b'}
                          strokeWidth="2"
                        />
                        <text
                          x={cx}
                          y={cy + 4}
                          fill="#f8fafc"
                          fontSize="9"
                          fontWeight={isSelected ? 'bold' : 'normal'}
                          textAnchor="middle"
                        >
                          {node.id.slice(0, 10)}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                <div className="absolute bottom-3 left-4 text-[10px] text-slate-400 font-mono">
                  ● Blue: Core | ● Slate: Identified Entity | ● Green: Selected
                </div>
              </div>

              {/* Node Inspector Panel */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                    Concept Inspector
                  </div>
                  <h3 className="text-base font-bold text-slate-900 mb-2">
                    {selectedNode ? selectedNode.id : 'Select a concept node'}
                  </h3>

                  <div className="space-y-3 text-xs text-slate-600">
                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5">Classification:</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200 font-medium text-[11px]">
                        {selectedNode?.type || 'Identified Research Variable'}
                      </span>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5">Verification Status:</span>
                      <span className="text-amber-700 italic text-[11px]">
                        ⚠️ Automatically inferred relationship (AI Hypothesis)
                      </span>
                    </div>

                    <div>
                      <span className="font-semibold text-slate-700 block mb-0.5">Linked Research Papers:</span>
                      <p className="text-slate-500 font-light text-xs">
                        Correlated across {selectedProject?.title || 'active library papers'}.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 mt-4">
                  <Link
                    to="/chat"
                    className="w-full text-center block text-xs font-semibold py-2 px-3 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
                  >
                    Ask Assistant About {selectedNode ? `"${selectedNode.id}"` : 'This Concept'}
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Research Themes & Key Entities */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Macro Themes */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
                <Layers className="w-4 h-4 text-indigo-600" />
                <span>Extracted Research Themes</span>
              </h2>
              <p className="text-xs text-slate-500 mb-5">Common patterns discovered across sources</p>

              <div className="space-y-4">
                {themes.map((theme, idx) => (
                  <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-bold text-slate-800">{theme.name}</h3>
                      <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {theme.relevance}% Relevance
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed font-light">{theme.description}</p>
                    <div className="text-[11px] text-slate-400">
                      Spans across {theme.documentCount || 2} analyzed documents
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Key Entities & Concepts */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-emerald-600" />
                <span>Salient Scientific Entities</span>
              </h2>
              <p className="text-xs text-slate-500 mb-5">High-frequency terms & measurement metrics</p>

              <div className="space-y-3">
                {concepts.map((concept, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 transition flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800">{concept.name}</div>
                      <div className="text-[11px] text-slate-500">{concept.category || 'Domain Entity'}</div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-mono font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                        freq: {concept.frequency || 1}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Research Gaps & Emerging Directions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
                <HelpCircle className="w-4 h-4 text-amber-600" />
                <span>Unaddressed Research Gaps</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">Questions unanswered by current papers</p>

              <ul className="space-y-2.5">
                {gaps.map((gap, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900 flex items-start space-x-2.5">
                    <span className="text-amber-600 font-bold">•</span>
                    <span className="leading-relaxed font-light">{gap}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-indigo-600" />
                <span>Emerging Research Directions</span>
              </h2>
              <p className="text-xs text-slate-500 mb-4">Promising avenues for future inquiry</p>

              <ul className="space-y-2.5">
                {directions.map((dir, idx) => (
                  <li key={idx} className="p-3 rounded-xl bg-indigo-50/50 border border-indigo-200/60 text-xs text-indigo-900 flex items-start space-x-2.5">
                    <span className="text-indigo-600 font-bold">•</span>
                    <span className="leading-relaxed font-light">{dir}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

