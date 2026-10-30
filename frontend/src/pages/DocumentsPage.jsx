import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FileText,
  Upload,
  Trash2,
  Eye,
  FileCheck,
  AlertCircle,
  Sparkles,
  Search,
  Filter,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useProject } from '../context/ProjectContext.jsx';
import { documentApi } from '../api/documentApi.js';
import { Badge } from '../components/common/Badge.jsx';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { CardSkeleton } from '../components/common/Skeleton.jsx';

export const DocumentsPage = () => {
  const { selectedProjectId, selectedProject, seedSample, projects } = useProject();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [uploadSuccess, setUploadSuccess] = useState(null);
  const [title, setTitle] = useState('');
  const [file, setFile] = useState(null);
  const [filterQuery, setFilterQuery] = useState('');

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const res = await documentApi.getDocuments(selectedProjectId);
      setDocuments(res.documents || []);
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocuments();
  }, [selectedProjectId]);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      if (!title) {
        setTitle(selected.name.replace(/\.[^/.]+$/, ''));
      }
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!file) return;
    if (!selectedProjectId) {
      setUploadError('Please select or create a research project first.');
      return;
    }

    setUploading(true);
    setUploadError(null);
    setUploadSuccess(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('projectId', selectedProjectId);
    formData.append('title', title || file.name);

    try {
      const res = await documentApi.uploadDocument(formData);
      setUploadSuccess('Document successfully uploaded and chunked into verifiable research evidence.');
      setFile(null);
      setTitle('');
      await loadDocuments();
    } catch (err) {
      setUploadError(err.response?.data?.message || 'Failed to upload and process document.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to remove "${title}"?`)) return;
    try {
      await documentApi.deleteDocument(id);
      await loadDocuments();
    } catch (err) {
      console.error('Failed to delete document:', err);
    }
  };

  const filteredDocs = documents.filter(d =>
    d.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
    d.fileType.toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Document Library</h1>
          <p className="text-sm text-slate-500 mt-1">
            Upload and manage PDF research papers, text documents, and word documents.
          </p>
        </div>

        <button
          onClick={() => seedSample()}
          className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition shadow-sm self-start sm:self-auto"
        >
          <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
          Load 3 Sample Papers
        </button>
      </div>

      {/* Upload Box */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <h2 className="text-base font-bold text-slate-900 mb-1">Upload New Research Document</h2>
        <p className="text-xs text-slate-500 mb-4 font-light">
          Supported formats: <strong>PDF (.pdf)</strong>, <strong>Plain Text (.txt)</strong>, <strong>Word (.docx)</strong>. Text is automatically parsed, preserving page boundaries.
        </p>

        {uploadError && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        {uploadSuccess && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{uploadSuccess}</span>
          </div>
        )}

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Paper / Document Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Randomized Clinical Evaluation of Chronobiotics"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Select File (PDF, TXT, DOCX) *
              </label>
              <input
                type="file"
                required
                accept=".pdf,.txt,.docx"
                onChange={handleFileChange}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
              />
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <span className="text-xs text-slate-400">
              Uploading to: <strong>{selectedProject?.title || 'Default Project'}</strong>
            </span>
            <button
              type="submit"
              disabled={uploading || !file}
              className="inline-flex items-center px-5 py-2.5 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Processing & Chunking...' : 'Upload & Index'}
            </button>
          </div>
        </form>
      </div>

      {/* Document Library Table */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h2 className="text-base font-bold text-slate-900">
            Indexed Documents ({filteredDocs.length})
          </h2>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter by title..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        ) : filteredDocs.length === 0 ? (
          <EmptyState
            title="No documents uploaded yet"
            description="Upload research papers or load the demo scientific dataset."
            actionText="Load Sample Papers"
            onAction={() => seedSample()}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="text-xs uppercase text-slate-400 border-b border-slate-200 bg-slate-50/50">
                <tr>
                  <th className="py-3 px-4 font-semibold">Title</th>
                  <th className="py-3 px-4 font-semibold">Original File</th>
                  <th className="py-3 px-4 font-semibold">Format</th>
                  <th className="py-3 px-4 font-semibold">Pages</th>
                  <th className="py-3 px-4 font-semibold">Indexed Chunks</th>
                  <th className="py-3 px-4 font-semibold">Status</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredDocs.map((doc) => (
                  <tr key={doc._id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div className="flex items-center space-x-2">
                        <FileText className="w-4 h-4 text-indigo-600 shrink-0" />
                        <span className="truncate max-w-xs">{doc.title}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-500 truncate max-w-[140px]">
                      {doc.originalFilename}
                    </td>
                    <td className="py-3.5 px-4 uppercase text-xs font-mono font-medium text-slate-600">
                      {doc.fileType}
                    </td>
                    <td className="py-3.5 px-4">{doc.pageCount || 1}</td>
                    <td className="py-3.5 px-4 font-mono text-xs">{doc.chunkCount} chunks</td>
                    <td className="py-3.5 px-4">
                      <Badge variant={doc.processingStatus}>{doc.processingStatus}</Badge>
                      {doc.processingError && (
                        <p className="text-[10px] text-amber-600 mt-1 max-w-xs truncate" title={doc.processingError}>
                          ⚠️ {doc.processingError}
                        </p>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right space-x-2">
                      <Link
                        to={`/documents/${doc._id}`}
                        className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition"
                      >
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        View Chunks
                      </Link>
                      <button
                        onClick={() => handleDelete(doc._id, doc.title)}
                        className="p-1 text-slate-400 hover:text-rose-600 transition"
                        title="Delete document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

