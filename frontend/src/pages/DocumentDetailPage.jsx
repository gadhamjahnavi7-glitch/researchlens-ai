import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileText,
  ArrowLeft,
  Layers,
  BookOpen,
  Calendar,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { documentApi } from '../api/documentApi.js';
import { Badge } from '../components/common/Badge.jsx';
import { CardSkeleton } from '../components/common/Skeleton.jsx';

export const DocumentDetailPage = () => {
  const { id } = useParams();
  const [doc, setDoc] = useState(null);
  const [chunks, setChunks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChunk, setSelectedChunk] = useState(null);

  useEffect(() => {
    const fetchContent = async () => {
      setLoading(true);
      try {
        const res = await documentApi.getDocumentContent(id);
        setDoc(res.document);
        setChunks(res.chunks || []);
        if (res.chunks?.length > 0) {
          setSelectedChunk(res.chunks[0]);
        }
      } catch (err) {
        console.error('Failed to load document content:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchContent();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!doc) {
    return (
      <div className="max-w-xl mx-auto text-center py-16">
        <h2 className="text-lg font-bold text-slate-800">Document Not Found</h2>
        <Link to="/documents" className="text-sm text-indigo-600 mt-2 inline-block">
          &larr; Back to documents
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Navigation & Header */}
      <div>
        <Link
          to="/documents"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800 mb-3"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Document Library
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">
              {doc.title}
            </h1>
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
              <span className="font-mono">{doc.originalFilename}</span>
              <span>•</span>
              <span className="uppercase font-semibold">{doc.fileType}</span>
              <span>•</span>
              <span>{doc.pageCount || 1} pages</span>
              <span>•</span>
              <span>{chunks.length} evidence chunks</span>
              <span>•</span>
              <Badge variant={doc.processingStatus}>{doc.processingStatus}</Badge>
            </div>
          </div>

          <Link
            to="/chat"
            className="inline-flex items-center px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm self-start"
          >
            Ask Questions About This Paper &rarr;
          </Link>
        </div>
      </div>

      {/* Two-Column Chunk Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Chunks List */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col h-[650px]">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
              Extracted Chunks ({chunks.length})
            </h3>
            <span className="text-[11px] text-slate-400">Select to inspect</span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {chunks.map((c) => {
              const isSelected = selectedChunk?._id === c._id;
              return (
                <div
                  key={c._id}
                  onClick={() => setSelectedChunk(c)}
                  className={`p-3 rounded-xl border transition cursor-pointer text-xs ${
                    isSelected
                      ? 'bg-indigo-50/80 border-indigo-400 text-slate-900 shadow-sm'
                      : 'bg-slate-50/50 border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5 font-semibold">
                    <span className="text-indigo-700 font-mono">
                      Chunk #{c.chunkIndex + 1}
                    </span>
                    <span className="px-1.5 py-0.5 rounded bg-white border border-slate-200 text-slate-600 text-[10px]">
                      Page {c.pageNumber}
                    </span>
                  </div>
                  <p className="line-clamp-2 text-slate-600 font-light leading-relaxed">
                    {c.text}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Selected Chunk Details & Text Inspection */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col h-[650px]">
          {selectedChunk ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <div>
                  <span className="text-xs font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                    Chunk #{selectedChunk.chunkIndex + 1}
                  </span>
                  <span className="ml-2 text-xs text-slate-500">
                    Page {selectedChunk.pageNumber} • Approx. {selectedChunk.tokenCount || 0} tokens
                  </span>
                </div>
                <div className="inline-flex items-center space-x-1.5 text-xs text-emerald-700 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Grounding-Ready</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto bg-slate-50/60 p-5 rounded-xl border border-slate-200 text-sm leading-relaxed text-slate-800 font-mono whitespace-pre-wrap selection:bg-indigo-100">
                {selectedChunk.text}
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400 mt-4">
                <span>Indexed in MongoDB for BM25 and Vector Semantic Search</span>
                <button
                  onClick={() => navigator.clipboard.writeText(selectedChunk.text)}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                >
                  Copy Excerpt
                </button>
              </div>
            </div>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-sm">
              Select a chunk on the left to inspect its exact parsed text.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

