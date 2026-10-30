import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Trash2,
  BookOpen,
  Download,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  FileText
} from 'lucide-react';
import { useProject } from '../context/ProjectContext.jsx';
import { reportApi } from '../api/reportApi.js';
import { documentApi } from '../api/documentApi.js';
import { Badge } from '../components/common/Badge.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { CardSkeleton } from '../components/common/Skeleton.jsx';

export const ReportsPage = () => {
  const { selectedProjectId, selectedProject, seedSample } = useProject();
  const [reports, setReports] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [researchQuestion, setResearchQuestion] = useState('');
  const [reportTitle, setReportTitle] = useState('');

  const loadData = async () => {
    if (!selectedProjectId) return;
    setLoading(true);
    try {
      const [repsRes, docsRes] = await Promise.all([
        reportApi.getReports(selectedProjectId),
        documentApi.getDocuments(selectedProjectId)
      ]);
      setReports(repsRes.reports || []);
      setDocuments(docsRes.documents || []);
    } catch (err) {
      console.error('Failed to load reports:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedProjectId]);

  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!researchQuestion.trim() || !selectedProjectId) return;

    setGenerating(true);
    try {
      const res = await reportApi.generateReport({
        projectId: selectedProjectId,
        title: reportTitle.trim() || undefined,
        researchQuestion: researchQuestion.trim()
      });

      setModalOpen(false);
      setResearchQuestion('');
      setReportTitle('');
      await loadData();
    } catch (err) {
      console.error('Report generation failed:', err);
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this research report?')) return;
    try {
      await reportApi.deleteReport(id);
      await loadData();
    } catch (err) {
      console.error('Failed to delete report:', err);
    }
  };

  const handleDownloadMarkdown = async (reportId, title, e) => {
    e.stopPropagation();
    try {
      const mdText = await reportApi.exportReportMarkdown(reportId);
      const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${title.replace(/[^a-z0-9]/gi, '_')}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Download markdown failed:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Research Reports</h1>
          <p className="text-sm text-slate-500 mt-1">
            Generate and export publication-ready evidence synthesis reports with exact source references.
          </p>
        </div>

        <button
          onClick={() => setModalOpen(true)}
          disabled={documents.length === 0}
          className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm disabled:opacity-50"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Generate New Report
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : reports.length === 0 ? (
        <EmptyState
          icon={FileSpreadsheet}
          title="No research reports generated yet"
          description="Synthesize your uploaded research documents into a comprehensive 10-section academic report."
          actionText={documents.length > 0 ? "Generate Report" : "Load Sample Papers First"}
          onAction={() => documents.length > 0 ? setModalOpen(true) : seedSample()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reports.map((r) => (
            <div
              key={r._id}
              className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm hover:border-slate-300 transition flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                    <FileSpreadsheet className="w-5 h-5" />
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={(e) => handleDownloadMarkdown(r._id, r.title, e)}
                      className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                      title="Export as Markdown (.md)"
                    >
                      <Download className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(r._id, e)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Delete report"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-1.5 line-clamp-1">{r.title}</h3>
                <p className="text-xs text-slate-500 mb-3 italic font-serif line-clamp-2">
                  "{r.researchQuestion}"
                </p>

                <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed font-light mb-4">
                  {r.reportContent?.executiveSummary || 'Synthesis report generated from project sources.'}
                </p>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">
                  {r.sourceReferences?.length || 1} sources cited
                </span>
                <Link
                  to={`/reports/${r._id}`}
                  className="font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                >
                  <span>Read Full Report</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Generate Report Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Generate Structured Research Report</h2>
            <p className="text-xs text-slate-500 mb-5 font-light">
              Synthesizes across {documents.length} papers into 10 structured sections with verifiable references.
            </p>

            <form onSubmit={handleGenerate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Research Question *
                </label>
                <input
                  type="text"
                  required
                  value={researchQuestion}
                  onChange={(e) => setResearchQuestion(e.target.value)}
                  placeholder="e.g. How do pharmacological chronobiotics compare to morning lux phototherapy?"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Report Title (Optional)
                </label>
                <input
                  type="text"
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  placeholder="e.g. Circadian Interventions: Comparative Efficacy Synthesis"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="pt-3 flex justify-end space-x-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 hover:bg-slate-100 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || !researchQuestion.trim()}
                  className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Synthesizing 10 Sections...
                    </>
                  ) : (
                    'Generate Report'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

