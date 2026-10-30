import React, { useState } from 'react';
import {
  FolderKanban,
  Plus,
  Trash2,
  FileText,
  Clock,
  Sparkles,
  Check,
  Tag,
  ArrowRight
} from 'lucide-react';
import { useProject } from '../context/ProjectContext.jsx';
import { projectApi } from '../api/projectApi.js';
import { EmptyState } from '../components/common/EmptyState.jsx';
import { Badge } from '../components/common/Badge.jsx';

export const ProjectsPage = () => {
  const { projects, selectedProjectId, selectProject, fetchProjects, seedSample } = useProject();
  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSubmitting(true);
    try {
      const tags = tagsInput
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);

      const res = await projectApi.createProject({
        title: title.trim(),
        description: description.trim(),
        tags
      });

      await fetchProjects();
      selectProject(res.project._id);
      setTitle('');
      setDescription('');
      setTagsInput('');
      setModalOpen(false);
    } catch (err) {
      console.error('Failed to create project:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this research project? All associated documents, chunks, and reports will be removed.')) {
      return;
    }

    setDeletingId(id);
    try {
      await projectApi.deleteProject(id);
      await fetchProjects();
    } catch (err) {
      console.error('Failed to delete project:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-slate-900 tracking-tight">Research Projects</h1>
          <p className="text-sm text-slate-500 mt-1">
            Organize documents, focused inquiries, and discovery reports by research topic.
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => seedSample()}
            className="inline-flex items-center px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 mr-1.5 text-amber-600" />
            Seed Sample Workspace
          </button>
          <button
            onClick={() => setModalOpen(true)}
            className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            New Research Project
          </button>
        </div>
      </div>

      {/* Projects Grid */}
      {projects.length === 0 ? (
        <EmptyState
          title="No research projects yet"
          description="Create your first project to start organizing scientific documents, or load the pre-configured sample workspace."
          actionText="Create Project"
          onAction={() => setModalOpen(true)}
          secondaryActionText="Load Sample Workspace"
          onSecondaryAction={() => seedSample()}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((p) => {
            const isSelected = p._id === selectedProjectId;
            return (
              <div
                key={p._id}
                onClick={() => selectProject(p._id)}
                className={`bg-white border rounded-2xl p-6 transition shadow-sm cursor-pointer relative flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 ring-2 ring-indigo-500/20 shadow-md'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <FolderKanban className="w-5 h-5" />
                    </div>

                    <div className="flex items-center space-x-2">
                      {isSelected ? (
                        <span className="inline-flex items-center text-xs font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check className="w-3 h-3 mr-1" /> Active
                        </span>
                      ) : (
                        <span className="text-xs text-slate-400 hover:text-indigo-600 font-medium">
                          Select
                        </span>
                      )}

                      <button
                        onClick={(e) => handleDelete(p._id, e)}
                        disabled={deletingId === p._id}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 mb-1.5 line-clamp-1">{p.title}</h3>
                  <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed font-light">
                    {p.description || 'No description provided for this research project.'}
                  </p>

                  {/* Tags */}
                  {p.tags && p.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {p.tags.map((t, idx) => (
                        <span
                          key={idx}
                          className="text-[11px] font-medium bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    <span>{p.documentCount || 0} papers</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(p.updatedAt || p.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 animate-in fade-in">
            <h2 className="text-lg font-bold text-slate-900 mb-1">Create New Research Project</h2>
            <p className="text-xs text-slate-500 mb-5">
              Set up a dedicated project container for research papers and synthesis.
            </p>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Project Title *
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Cognitive Resilience in High-Altitude Conditions"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Research Description
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Briefly describe the research scope, hypotheses, or objectives..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Neuroscience, Hypoxia, Biomarkers"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                  disabled={submitting || !title.trim()}
                  className="px-4 py-2 rounded-xl text-sm font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

