import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  FileSpreadsheet,
  ArrowLeft,
  Download,
  Copy,
  Check,
  Edit3,
  Save,
  BookOpen,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { reportApi } from '../api/reportApi.js';
import { CardSkeleton } from '../components/common/Skeleton.jsx';

export const ReportDetailPage = () => {
  const { id } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(null);
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await reportApi.getReportById(id);
        setReport(res.report);
        setEditedContent(res.report.reportContent);
      } catch (err) {
        console.error('Failed to load report:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await reportApi.updateReport(id, { reportContent: editedContent });
      setReport(res.report);
      setIsEditing(false);
    } catch (err) {
      console.error('Failed to save report edits:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleExportMarkdown = async () => {
    try {
      const mdText = await reportApi.exportReportMarkdown(id);
      const blob = new Blob([mdText], { type: 'text/markdown;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `${report.title.replace(/[^a-z0-9]/gi, '_')}.md`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Export markdown failed:', err);
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      const mdText = await reportApi.exportReportMarkdown(id);
      navigator.clipboard.writeText(mdText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Copy markdown failed:', err);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="max-w-lg mx-auto text-center py-16">
        <h2 className="text-lg font-bold text-slate-800">Report Not Found</h2>
        <Link to="/reports" className="text-sm text-indigo-600 mt-2 inline-block">
          &larr; Back to Reports
        </Link>
      </div>
    );
  }

  const c = isEditing ? editedContent : report.reportContent;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Link
          to="/reports"
          className="inline-flex items-center text-xs font-semibold text-slate-500 hover:text-slate-800"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Back to Reports
        </Link>

        <div className="flex items-center space-x-2">
          {isEditing ? (
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 transition"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
            >
              <Edit3 className="w-3.5 h-3.5 mr-1.5" />
              Edit Report
            </button>
          )}

          <button
            onClick={handleCopyMarkdown}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 mr-1.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 mr-1.5" />}
            {copied ? 'Copied' : 'Copy MD'}
          </button>

          <button
            onClick={handleExportMarkdown}
            className="inline-flex items-center px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 text-white hover:bg-indigo-700 transition shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Download (.md)
          </button>
        </div>
      </div>

      {/* Report Document Sheet */}
      <article className="bg-white border border-slate-200 rounded-2xl p-8 sm:p-12 shadow-sm space-y-8 font-serif leading-relaxed text-slate-800">
        {/* Title Header */}
        <header className="border-b border-slate-200 pb-6 not-italic font-sans">
          <div className="text-xs uppercase font-bold tracking-wider text-indigo-700 mb-2">
            Scientific Research Synthesis Report
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-slate-900 leading-tight">
            {report.title}
          </h1>
          <div className="mt-3 text-xs text-slate-500 flex flex-wrap items-center gap-3">
            <span>Research Question: <strong className="text-slate-800 font-sans">{report.researchQuestion}</strong></span>
            <span>•</span>
            <span>Generated: {new Date(report.createdAt).toLocaleDateString()}</span>
          </div>
        </header>

        {/* 1. Executive Summary */}
        <section className="space-y-2">
          <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900">
            1. Executive Summary
          </h2>
          {isEditing ? (
            <textarea
              rows={4}
              value={c.executiveSummary || ''}
              onChange={(e) => setEditedContent({ ...c, executiveSummary: e.target.value })}
              className="w-full p-3 rounded-lg border text-sm font-sans"
            />
          ) : (
            <p className="text-sm font-light text-slate-700 leading-relaxed">
              {c.executiveSummary}
            </p>
          )}
        </section>

        {/* 2. Background and Context */}
        <section className="space-y-2">
          <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900">
            2. Background and Context
          </h2>
          {isEditing ? (
            <textarea
              rows={3}
              value={c.background || ''}
              onChange={(e) => setEditedContent({ ...c, background: e.target.value })}
              className="w-full p-3 rounded-lg border text-sm font-sans"
            />
          ) : (
            <p className="text-sm font-light text-slate-700 leading-relaxed">
              {c.background}
            </p>
          )}
        </section>

        {/* 3. Major Findings */}
        <section className="space-y-3">
          <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900">
            3. Major Findings
          </h2>
          {(c.majorFindings || []).map((f, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-sans text-xs space-y-1.5">
              <h3 className="font-bold text-slate-900">{idx + 1}. {f.heading}</h3>
              <p className="text-slate-700 font-serif leading-relaxed text-sm">{f.content}</p>
              {f.supportingSources?.length > 0 && (
                <div className="text-[11px] text-slate-500 font-mono">
                  Sources: {f.supportingSources.join(', ')}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* 4. Comparison of Sources */}
        <section className="space-y-2">
          <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900">
            4. Comparative Source Synthesis
          </h2>
          <p className="text-sm font-light text-slate-700 leading-relaxed">
            {c.sourceComparison}
          </p>
        </section>

        {/* 5. Supporting Evidence Quotes */}
        <section className="space-y-3">
          <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900">
            5. Verifiable Supporting Evidence
          </h2>
          <div className="space-y-2">
            {(c.supportingEvidence || []).map((e, idx) => (
              <div key={idx} className="p-3 rounded-lg bg-indigo-50/50 border border-indigo-100 text-xs font-sans space-y-1">
                <div className="font-semibold text-slate-900">Claim: "{e.claim}"</div>
                <blockquote className="italic font-serif text-slate-700 pl-2 border-l-2 border-indigo-500">
                  "{e.excerpt}"
                </blockquote>
                <div className="text-[10px] text-slate-500 font-mono">
                  — {e.sourceTitle} (Page {e.pageNumber})
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 6. Potential Disagreements */}
        {c.potentialDisagreements?.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900">
              6. Potential Disagreements & Divergence
            </h2>
            {c.potentialDisagreements.map((d, idx) => (
              <div key={idx} className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 text-xs font-sans space-y-1.5">
                <div className="font-bold text-amber-900">Topic: {d.topic}</div>
                <div className="text-slate-800">
                  • <strong>{d.claimA?.source} (p.{d.claimA?.page}):</strong> "{d.claimA?.text}"
                </div>
                <div className="text-slate-800">
                  • <strong>{d.claimB?.source} (p.{d.claimB?.page}):</strong> "{d.claimB?.text}"
                </div>
                <div className="text-amber-800 italic pt-1">
                  Reason for divergence: {d.reason}
                </div>
              </div>
            ))}
          </section>
        )}

        {/* 7. Research Gaps */}
        <section className="space-y-2">
          <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900">
            7. Identified Research Gaps
          </h2>
          <ul className="list-disc pl-5 text-sm font-light text-slate-700 space-y-1">
            {(c.researchGaps || []).map((g, idx) => (
              <li key={idx}>{g}</li>
            ))}
          </ul>
        </section>

        {/* 8. Limitations */}
        <section className="space-y-2">
          <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900">
            8. Limitations
          </h2>
          <ul className="list-disc pl-5 text-sm font-light text-slate-700 space-y-1">
            {(c.limitations || []).map((l, idx) => (
              <li key={idx}>{l}</li>
            ))}
          </ul>
        </section>

        {/* 9. Conclusion */}
        <section className="space-y-2">
          <h2 className="text-base font-bold font-sans uppercase tracking-wider text-slate-900">
            9. Conclusion
          </h2>
          <p className="text-sm font-light text-slate-700 leading-relaxed">
            {c.conclusion}
          </p>
        </section>

        {/* 10. References */}
        <footer className="pt-6 border-t border-slate-200 font-sans text-xs text-slate-600 not-italic space-y-2">
          <h2 className="text-xs uppercase font-bold tracking-wider text-slate-800">
            10. References to Uploaded Source Materials
          </h2>
          <div className="space-y-1 font-mono">
            {(report.sourceReferences || []).map((s, idx) => (
              <div key={idx}>
                [{idx + 1}] <em>{s.title}</em> — {s.filename} ({s.chunksUsed || 1} chunks utilized)
              </div>
            ))}
          </div>
        </footer>
      </article>
    </div>
  );
};

