import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  FolderKanban,
  MessageSquareQuote,
  ShieldCheck,
  FileSpreadsheet,
  Upload,
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Clock
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext.jsx';
import { useProject } from '../context/ProjectContext.jsx';
import { documentApi } from '../api/documentApi.js';
import { researchApi } from '../api/researchApi.js';
import { reportApi } from '../api/reportApi.js';
import { projectApi } from '../api/projectApi.js';
import { Badge } from '../components/common/Badge.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { CardSkeleton } from '../components/common/Skeleton.jsx';

export const DashboardPage = () => {
  const { user } = useAuth();
  const { projects, selectedProject, seedSample, loading: projectLoading } = useProject();
  const [documents, setDocuments] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [reports, setReports] = useState([]);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seeding, setSeeding] = useState(false);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const [docsRes, convsRes, repsRes, actsRes] = await Promise.all([
          documentApi.getDocuments(selectedProject?._id),
          researchApi.getConversations(selectedProject?._id),
          reportApi.getReports(selectedProject?._id),
          projectApi.getActivities(selectedProject?._id).catch(() => ({ activities: [] }))
        ]);

        setDocuments(docsRes.documents || []);
        setConversations(convsRes.conversations || []);
        setReports(repsRes.reports || []);
        setActivities(actsRes.activities || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [selectedProject]);

  const handleSeed = async () => {
    setSeeding(true);
    try {
      await seedSample();
    } catch (err) {
      console.error('Failed to seed:', err);
    } finally {
      setSeeding(false);
    }
  };

  const totalChunks = documents.reduce((acc, doc) => acc + (doc.chunkCount || 0), 0);

  // Chart data: Chunk and Page count per document
  const chartData = documents.slice(0, 5).map(doc => ({
    name: doc.title.length > 20 ? doc.title.slice(0, 18) + '...' : doc.title,
    chunks: doc.chunkCount || 1,
    pages: doc.pageCount || 1
  }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6 shadow-sm">
        <div>
          <div className="inline-flex items-center space-x-2 text-xs font-semibold px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 mb-3">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Active Project: {selectedProject ? selectedProject.title : 'All Projects'}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.name || 'Researcher'}
          </h1>
          <p className="text-sm text-slate-600 mt-1 max-w-2xl font-light">
            Your evidence-first workspace has indexed <strong>{documents.length}</strong> documents and <strong>{totalChunks}</strong> verifiable evidence passages.
          </p>
        </div>

        {/* Quick Demo Loader CTA */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          <button
            onClick={handleSeed}
            disabled={seeding || projectLoading}
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 transition shadow-sm shadow-amber-200 disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {seeding ? 'Seeding Demo Data...' : 'Load Demo Scientific Papers'}
          </button>
          <Link
            to="/documents"
            className="inline-flex items-center px-4 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Paper
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Indexed Documents</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{documents.length}</div>
          <p className="text-xs text-slate-500 mt-1">Across active workspace</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Evidence Passages</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{totalChunks}</div>
          <p className="text-xs text-slate-500 mt-1">Page-level chunks ready</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Research Threads</span>
            <MessageSquareQuote className="w-4 h-4 text-violet-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{conversations.length}</div>
          <p className="text-xs text-slate-500 mt-1">Grounded inquiries</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Synthesis Reports</span>
            <FileSpreadsheet className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-slate-900">{reports.length}</div>
          <p className="text-xs text-slate-500 mt-1">Generated & editable</p>
        </div>
      </div>

      {/* Main Workspace Row: Analytics Chart & Quick Workflows */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Analytics Card */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Document Chunk & Evidence Distribution</h2>
              <p className="text-xs text-slate-500 mt-0.5">Retrieval granularity across uploaded papers</p>
            </div>
            <span className="text-xs font-mono font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
              Live Index
            </span>
          </div>

          {chartData.length > 0 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-15} textAnchor="end" />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                  />
                  <Bar dataKey="chunks" name="Indexed Chunks" fill="#637bf4" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="pages" name="Pages" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-200 rounded-xl">
              <FileText className="w-8 h-8 text-slate-300 mb-2" />
              <p className="text-sm font-medium text-slate-600">No documents indexed in this project yet.</p>
              <button
                onClick={handleSeed}
                className="mt-3 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
              >
                + Load 3 Sample Scientific Papers
              </button>
            </div>
          )}
        </div>

        {/* Quick Launchpad Actions */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">Research Launchpad</h2>
            <p className="text-xs text-slate-500 mb-4">Direct shortcuts to evidence features</p>

            <div className="space-y-3">
              <Link
                to="/chat"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                    <MessageSquareQuote className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600">
                      Cross-Document Chat
                    </div>
                    <div className="text-[11px] text-slate-500">Ask questions across all papers</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-indigo-600 transition" />
              </Link>

              <Link
                to="/evidence"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 group-hover:text-emerald-700">
                      Evidence Explorer
                    </div>
                    <div className="text-[11px] text-slate-500">Inspect page-level passages</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-700 transition" />
              </Link>

              <Link
                to="/contradictions"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-amber-300 hover:bg-amber-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 group-hover:text-amber-700">
                      Contradiction Detection
                    </div>
                    <div className="text-[11px] text-slate-500">Compare conflicting findings</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-700 transition" />
              </Link>

              <Link
                to="/reports"
                className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 transition group"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
                    <FileSpreadsheet className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-slate-800 group-hover:text-violet-700">
                      Generate Research Report
                    </div>
                    <div className="text-[11px] text-slate-500">Structured markdown export</div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-violet-700 transition" />
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Documents Table & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-base font-bold text-slate-900">Recent Research Documents</h2>
              <p className="text-xs text-slate-500 mt-0.5">Documents processed and indexed in MongoDB Atlas</p>
            </div>
            <Link
              to="/documents"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View all documents
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CardSkeleton />
              <CardSkeleton />
            </div>
          ) : documents.length === 0 ? (
            <EmptyState
              title="No research documents found"
              description="Upload research papers or load our sample dataset to start analyzing."
              actionText="Load Sample Papers"
              onAction={handleSeed}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="text-xs uppercase text-slate-400 border-b border-slate-200 bg-slate-50/50">
                  <tr>
                    <th className="py-3 px-4 font-semibold">Document Title</th>
                    <th className="py-3 px-4 font-semibold">Format</th>
                    <th className="py-3 px-4 font-semibold">Pages</th>
                    <th className="py-3 px-4 font-semibold">Status</th>
                    <th className="py-3 px-4 font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {documents.slice(0, 5).map((doc) => (
                    <tr key={doc._id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div className="flex items-center space-x-2.5">
                          <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span className="truncate max-w-[180px] sm:max-w-xs">{doc.title}</span>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 uppercase text-xs font-mono font-medium text-slate-500">
                        {doc.fileType}
                      </td>
                      <td className="py-3.5 px-4">{doc.pageCount || 1}</td>
                      <td className="py-3.5 px-4">
                        <Badge variant={doc.processingStatus}>{doc.processingStatus}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <Link
                          to={`/documents/${doc._id}`}
                          className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          Inspect
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Live MongoDB Activity Feed */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-900 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>MongoDB Activity Log</span>
              </h2>
              <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Connected
              </span>
            </div>

            {activities.length === 0 ? (
              <div className="text-xs text-slate-400 py-8 text-center">
                No recent activity recorded. Perform an action to see real-time MongoDB logs.
              </div>
            ) : (
              <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
                {activities.slice(0, 6).map((act) => (
                  <div key={act._id} className="p-2.5 rounded-xl border border-slate-100 bg-slate-50/60 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-slate-800 truncate">{act.title}</span>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-light line-clamp-2 leading-relaxed">
                      {act.description}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
            Persisted in MongoDB Atlas collection: <code>activitylogs</code>
          </div>
        </div>
      </div>
    </div>
  );
};

