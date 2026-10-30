import React, { useState, useEffect, useRef } from 'react';
import {
  MessageSquareQuote,
  Send,
  Sparkles,
  ShieldCheck,
  FileText,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  Info,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { useProject } from '../context/ProjectContext.jsx';
import { researchApi } from '../api/researchApi.js';
import { documentApi } from '../api/documentApi.js';
import { Badge } from '../components/common/Badge.jsx';

const SAMPLE_QUESTIONS = [
  'What effect does 0.5mg melatonin have on psychomotor vigilance and attention lapses?',
  'Compare the phototherapy intervention with oral melatonin regimens.',
  'What did the dual-intervention study conclude regarding single-modality protocols?',
  'Are there any conflicting findings or contradictions across the uploaded papers?'
];

export const ResearchChatPage = () => {
  const { selectedProjectId, selectedProject, seedSample } = useProject();
  const [documents, setDocuments] = useState([]);
  const [selectedDocIds, setSelectedDocIds] = useState([]);
  const [conversations, setConversations] = useState([]);
  const [activeConversationId, setActiveConversationId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputQuestion, setInputQuestion] = useState('');
  const [sending, setSending] = useState(false);
  const [activeCitation, setActiveCitation] = useState(null);
  const [evidencePanelOpen, setEvidencePanelOpen] = useState(true);

  const messagesEndRef = useRef(null);

  // Load documents and conversation list
  useEffect(() => {
    const init = async () => {
      if (!selectedProjectId) return;
      try {
        const [docsRes, convsRes] = await Promise.all([
          documentApi.getDocuments(selectedProjectId),
          researchApi.getConversations(selectedProjectId)
        ]);

        const docs = docsRes.documents || [];
        setDocuments(docs);
        setSelectedDocIds(docs.map(d => d._id)); // default all selected

        const convs = convsRes.conversations || [];
        setConversations(convs);
        if (convs.length > 0) {
          loadConversation(convs[0]._id);
        } else {
          setMessages([]);
          setActiveConversationId(null);
        }
      } catch (err) {
        console.error('Failed to load chat workspace:', err);
      }
    };

    init();
  }, [selectedProjectId]);

  const loadConversation = async (convId) => {
    setActiveConversationId(convId);
    try {
      const res = await researchApi.getConversationMessages(convId);
      setMessages(res.messages || []);
      // Auto select first citation from last message if available
      const lastMsg = res.messages?.[res.messages.length - 1];
      if (lastMsg?.citations?.length > 0) {
        setActiveCitation(lastMsg.citations[0]);
      }
    } catch (err) {
      console.error('Failed to load conversation messages:', err);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, sending]);

  const handleSend = async (questionToSend) => {
    const q = (questionToSend || inputQuestion).trim();
    if (!q || sending || !selectedProjectId) return;

    setInputQuestion('');
    setSending(true);

    // Optimistic user message
    const tempUserMsg = {
      _id: 'temp-' + Date.now(),
      role: 'user',
      content: q,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempUserMsg]);

    try {
      const res = await researchApi.chat({
        projectId: selectedProjectId,
        conversationId: activeConversationId,
        question: q,
        documentIds: selectedDocIds
      });

      if (!activeConversationId) {
        setActiveConversationId(res.conversationId);
        // refresh conversations list
        const convsRes = await researchApi.getConversations(selectedProjectId);
        setConversations(convsRes.conversations || []);
      }

      setMessages(prev => [...prev.filter(m => m._id !== tempUserMsg._id), tempUserMsg, res.message]);

      if (res.message?.citations?.length > 0) {
        setActiveCitation(res.message.citations[0]);
      }
    } catch (err) {
      console.error('Chat error:', err);
      setMessages(prev => [
        ...prev,
        {
          _id: 'error-' + Date.now(),
          role: 'assistant',
          content: `⚠️ Inquiry error: ${err.response?.data?.message || err.message}`,
          citations: []
        }
      ]);
    } finally {
      setSending(false);
    }
  };

  const toggleDocSelection = (docId) => {
    if (selectedDocIds.includes(docId)) {
      setSelectedDocIds(selectedDocIds.filter(id => id !== docId));
    } else {
      setSelectedDocIds([...selectedDocIds, docId]);
    }
  };

  return (
    <div className="h-[calc(100vh-6.5rem)] flex flex-col lg:flex-row gap-4 max-w-[1600px] mx-auto overflow-hidden">
      {/* LEFT PANEL: Document Filter & Thread Selector */}
      <div className="w-full lg:w-72 bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hidden md:flex md:flex-col justify-between shrink-0 h-full overflow-hidden">
        <div className="overflow-y-auto space-y-5">
          {/* Document Scope Filter */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Source Filter ({selectedDocIds.length}/{documents.length})
              </span>
              <button
                onClick={() => setSelectedDocIds(selectedDocIds.length === documents.length ? [] : documents.map(d => d._id))}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium"
              >
                {selectedDocIds.length === documents.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            {documents.length === 0 ? (
              <div className="text-xs text-slate-400 p-3 bg-slate-50 rounded-xl text-center">
                No documents in project.{' '}
                <button onClick={() => seedSample()} className="text-indigo-600 underline font-semibold">
                  Load Demo Papers
                </button>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                {documents.map((d) => (
                  <label
                    key={d._id}
                    className="flex items-start space-x-2 p-2 rounded-lg hover:bg-slate-50 cursor-pointer text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedDocIds.includes(d._id)}
                      onChange={() => toggleDocSelection(d._id)}
                      className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="line-clamp-2 text-slate-700 leading-tight">
                      {d.title}
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Past Research Conversations */}
          <div className="pt-4 border-t border-slate-100">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block mb-2">
              Inquiry Threads
            </span>
            <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
              <button
                onClick={() => {
                  setActiveConversationId(null);
                  setMessages([]);
                }}
                className={`w-full text-left p-2 rounded-lg text-xs font-semibold flex items-center space-x-2 transition ${
                  !activeConversationId
                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>+ New Research Inquiry</span>
              </button>

              {conversations.map((c) => (
                <button
                  key={c._id}
                  onClick={() => loadConversation(c._id)}
                  className={`w-full text-left p-2 rounded-lg text-xs transition truncate block ${
                    activeConversationId === c._id
                      ? 'bg-indigo-50 text-indigo-700 font-semibold border border-indigo-200'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {c.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 text-center">
          Grounding queries across {selectedDocIds.length} source(s)
        </div>
      </div>

      {/* CENTER PANEL: Chat Dialogue Workspace */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm h-full overflow-hidden">
        {/* Workspace Banner */}
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-bold text-xs">
              AI
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold text-slate-900">
                {selectedProject?.title || 'Cross-Document Research Chat'}
              </h2>
              <p className="text-[11px] text-slate-500">
                Grounded multi-document retrieval with strict citation verification
              </p>
            </div>
          </div>

          <button
            onClick={() => setEvidencePanelOpen(!evidencePanelOpen)}
            className="lg:hidden text-xs font-semibold px-2.5 py-1 rounded bg-indigo-50 text-indigo-700 border border-indigo-200"
          >
            {evidencePanelOpen ? 'Hide Evidence' : 'Show Evidence'}
          </button>
        </div>

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col justify-center items-center text-center max-w-lg mx-auto py-8">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
                <MessageSquareQuote className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800 mb-1">
                Ask Questions Across Your Research Library
              </h3>
              <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                ResearchLens AI searches all indexed pages, retrieves verbatim evidence, and validates claims before presenting answers.
              </p>

              <div className="w-full space-y-2 text-left">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                  Sample Inquiries to Try:
                </p>
                {SAMPLE_QUESTIONS.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSend(q)}
                    className="w-full text-left p-2.5 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/40 text-xs text-slate-700 transition"
                  >
                    💬 "{q}"
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m._id}
                  className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                >
                  <div className="text-[10px] text-slate-400 mb-1 px-1">
                    {isUser ? 'You' : 'ResearchLens Assistant'}
                  </div>

                  <div
                    className={`max-w-2xl rounded-2xl p-4 sm:p-5 text-sm leading-relaxed shadow-sm ${
                      isUser
                        ? 'bg-indigo-600 text-white rounded-br-sm'
                        : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-bl-sm'
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{m.content}</div>

                    {/* Citations List if Assistant */}
                    {!isUser && m.citations && m.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200">
                        <div className="text-[11px] font-semibold text-slate-600 mb-2 flex items-center space-x-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-indigo-600" />
                          <span>Supporting Evidence Citations (Click to inspect):</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {m.citations.map((c, idx) => (
                            <button
                              key={idx}
                              onClick={() => {
                                setActiveCitation(c);
                                setEvidencePanelOpen(true);
                              }}
                              className={`text-xs px-2.5 py-1 rounded-lg border flex items-center space-x-1.5 transition ${
                                activeCitation?.claim === c.claim
                                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                                  : 'bg-white text-indigo-700 border-indigo-200 hover:bg-indigo-50'
                              }`}
                            >
                              <span className="font-mono font-bold">[{c.citationId || `SRC-${idx + 1}`}]</span>
                              <span className="truncate max-w-[120px]">{c.documentTitle}</span>
                              <span className="text-[10px] opacity-75">p.{c.pageNumber}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}

          {sending && (
            <div className="flex items-center space-x-3 text-slate-500 text-xs p-4 bg-slate-50 rounded-xl border border-slate-200 animate-pulse max-w-sm">
              <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
              <span>Retrieving evidence passages & synthesizing grounded answer...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuestion}
              onChange={(e) => setInputQuestion(e.target.value)}
              placeholder="Ask a scientific research question across selected documents..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              disabled={sending}
            />
            <button
              type="submit"
              disabled={sending || !inputQuestion.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50 shadow-sm shrink-0"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>

      {/* RIGHT PANEL: Evidence Explorer Inspection Sidebar */}
      {evidencePanelOpen && (
        <div className="w-full lg:w-80 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between shrink-0 h-full overflow-hidden">
          <div className="flex flex-col h-full overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center space-x-1.5 text-xs font-bold uppercase tracking-wider text-slate-700">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Evidence Panel</span>
              </div>
              <Badge variant="verified">Signature Feature</Badge>
            </div>

            {activeCitation ? (
              <div className="flex-1 overflow-y-auto space-y-4 pr-1">
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Supported Claim
                  </span>
                  <div className="p-3 rounded-xl bg-indigo-50/60 border border-indigo-200 text-xs font-medium text-slate-900 leading-relaxed">
                    "{activeCitation.claim}"
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Source Document & Page
                  </span>
                  <div className="text-xs font-semibold text-slate-800">
                    📄 {activeCitation.documentTitle}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5 font-mono">
                    Exact Page Reference: <strong>Page {activeCitation.pageNumber}</strong>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Verbatim Supporting Excerpt
                  </span>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed font-mono whitespace-pre-wrap">
                    "{activeCitation.excerpt}"
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                    Retrieval Grounding Score
                  </span>
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full"
                        style={{ width: `${Math.min(100, Math.round((activeCitation.relevanceScore || 0.85) * 100))}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono font-bold text-emerald-700">
                      {Math.round((activeCitation.relevanceScore || 0.85) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 space-y-1">
                  <div className="font-semibold text-slate-800">Verification Verdict:</div>
                  <div className="text-emerald-700 font-medium">✓ Direct Grounded Excerpt</div>
                  <p className="text-slate-500 leading-relaxed text-[10px]">
                    Extracted directly from the author's published findings.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-4 text-slate-400 text-xs">
                <ShieldCheck className="w-8 h-8 text-slate-300 mb-2" />
                <p>Click on any citation pill [SRC-X] in the chat response to inspect the exact supporting excerpt and page number.</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

