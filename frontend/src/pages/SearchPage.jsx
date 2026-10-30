import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Search,
  FileText,
  ShieldCheck,
  Filter,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { useProject } from '../context/ProjectContext.jsx';
import { searchApi } from '../api/searchApi.js';
import { documentApi } from '../api/documentApi.js';
import { Badge } from '../components/common/Badge.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { CardSkeleton } from '../components/common/Skeleton.jsx';

export const SearchPage = () => {
  const { selectedProjectId, selectedProject } = useProject();
  const [query, setQuery] = useState('');
  const [documents, setDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    const fetchDocs = async () => {
      if (!selectedProjectId) return;
      try {
        const res = await documentApi.getDocuments(selectedProjectId);
        setDocuments(res.documents || []);
      } catch (err) {
        console.error('Failed to load filter docs:', err);
      }
    };
    fetchDocs();
  }, [selectedProjectId]);

  const handleSearch = async (e) => {
    e?.preventDefault();
    if (!query.trim()) return;

    setSearching(true);
    try {
      const res = await searchApi.search(query.trim(), selectedProjectId, selectedDocId || undefined);
      setResults(res);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Search & Index Explorer</h1>
        <p className="text-sm text-slate-500 mt-1">
          Search across indexed document titles, extracted text, and chunk passages with exact page references.
        </p>
      </div>

      {/* Search Input Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search keywords, variables, effect sizes, methodologies..."
                className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div className="w-full sm:w-64">
              <select
                value={selectedDocId}
                onChange={(e) => setSelectedDocId(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Project Documents</option>
                {documents.map((d) => (
                  <option key={d._id} value={d._id}>
                    {d.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              type="submit"
              disabled={searching || !query.trim()}
              className="inline-flex items-center justify-center px-6 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm shrink-0"
            >
              {searching ? 'Searching...' : 'Search Index'}
            </button>
          </div>
        </form>
      </div>

      {/* Results View */}
      {searching ? (
        <div className="space-y-3">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      ) : results ? (
        <div className="space-y-6">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Found <strong>{results.totalMatches || 0}</strong> matches for inquiry: "<em>{results.query}</em>"
            </span>
          </div>

          {/* Matching Documents */}
          {results.documents?.length > 0 && (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Matching Documents ({results.documents.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.documents.map((d) => (
                  <Link
                    key={d._id}
                    to={`/documents/${d._id}`}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 transition flex items-start space-x-3"
                  >
                    <FileText className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
                    <div className="overflow-hidden">
                      <h3 className="text-sm font-bold text-slate-900 truncate">{d.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{d.pageCount || 1} pages • {d.fileType?.toUpperCase()}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Matching Chunks */}
          {results.chunks?.length > 0 ? (
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Matching Evidence Passages ({results.chunks.length})
              </h2>

              <div className="space-y-3">
                {results.chunks.map((c) => (
                  <div
                    key={c.chunkId}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 space-y-2 hover:border-slate-300 transition"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2 font-semibold text-slate-800">
                        <FileText className="w-3.5 h-3.5 text-indigo-600" />
                        <span>{c.documentTitle}</span>
                        <span>•</span>
                        <span className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200 text-slate-600">
                          Page {c.pageNumber}
                        </span>
                      </div>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        Relevance: {Math.round(c.score * 100)}%
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                      {c.text}
                    </p>

                    <div className="pt-2 flex justify-end">
                      <Link
                        to="/chat"
                        className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center space-x-1"
                      >
                        <span>Inquire About This Passage</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : results.documents?.length === 0 ? (
            <EmptyState
              title="No passages matched your query"
              description="Try adjusting your search terms or verify that documents are uploaded."
            />
          ) : null}
        </div>
      ) : null}
    </div>
  );
};

