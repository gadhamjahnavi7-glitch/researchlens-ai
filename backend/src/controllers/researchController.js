import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { ResearchProject } from '../models/ResearchProject.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { retrieveRelevantChunks } from '../services/retrieval/retrievalService.js';
import { generateResearchAnswer } from '../services/ai/geminiService.js';
import { detectContradictions } from '../services/research/contradictionService.js';
import { chatMessageSchema, claimCompareSchema } from '../validators/researchSchemas.js';
import { logActivity } from '../models/ActivityLog.js';

export const chat = async (req, res, next) => {
  try {
    const validated = chatMessageSchema.parse(req.body);

    // Verify project ownership
    const project = await ResearchProject.findOne({
      _id: validated.projectId,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Research project not found.'
      });
    }

    // Get or create conversation
    let conversation;
    if (validated.conversationId) {
      conversation = await Conversation.findOne({
        _id: validated.conversationId,
        projectId: project._id,
        userId: req.user._id
      });
    }

    if (!conversation) {
      conversation = await Conversation.create({
        userId: req.user._id,
        projectId: project._id,
        title: validated.question.slice(0, 50) + (validated.question.length > 50 ? '...' : ''),
        selectedDocumentIds: validated.documentIds
      });
    }

    // Save user message
    await Message.create({
      conversationId: conversation._id,
      userId: req.user._id,
      role: 'user',
      content: validated.question
    });

    // 1. Retrieve relevant evidence chunks
    const retrievedChunks = await retrieveRelevantChunks({
      userId: req.user._id,
      projectId: project._id,
      documentIds: validated.documentIds,
      query: validated.question,
      limit: 6
    });

    // 2. Generate grounded AI response
    const aiResult = await generateResearchAnswer({
      question: validated.question,
      retrievedChunks
    });

    // 3. Save assistant message with verified citations
    const assistantMessage = await Message.create({
      conversationId: conversation._id,
      userId: req.user._id,
      role: 'assistant',
      content: aiResult.answer,
      citations: aiResult.citations.map((c, idx) => ({
        citationId: c.sourceId || `SRC-${idx + 1}`,
        claim: c.claim,
        documentId: c.documentId,
        documentTitle: c.documentTitle,
        pageNumber: c.pageNumber,
        excerpt: c.excerpt,
        relevanceScore: c.relevanceScore || 0.85,
        verificationStatus: c.verificationStatus || 'verified'
      })),
      evidenceAnalysis: {
        directEvidenceCount: aiResult.directEvidenceSummary?.length || aiResult.citations?.length || 0,
        hypothesesCount: aiResult.aiHypotheses?.length || 0,
        unsupportedCount: aiResult.unsupportedAspects?.length || 0,
        verdict: aiResult.evidenceSufficiency || 'grounded'
      }
    });

    await logActivity({
      userId: req.user._id,
      projectId: project._id,
      action: 'CHAT_INQUIRY',
      title: 'Conducted Research Chat Inquiry',
      description: `Inquiry: "${validated.question.slice(0, 100)}" (${assistantMessage.citations?.length || 0} citations generated).`
    });

    res.json({
      success: true,
      conversationId: conversation._id,
      message: assistantMessage,
      evidenceSummary: {
        retrievedCount: retrievedChunks.length,
        directEvidenceSummary: aiResult.directEvidenceSummary,
        aiHypotheses: aiResult.aiHypotheses,
        unsupportedAspects: aiResult.unsupportedAspects,
        evidenceSufficiency: aiResult.evidenceSufficiency,
        isFallback: aiResult.isFallback || false,
        warning: aiResult.errorWarning || null
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }

    const conversations = await Conversation.find(filter)
      .sort({ updatedAt: -1 })
      .lean();

    res.json({
      success: true,
      conversations
    });
  } catch (error) {
    next(error);
  }
};

export const getConversationMessages = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    const messages = await Message.find({ conversationId: conversation._id })
      .sort({ createdAt: 1 })
      .lean();

    res.json({
      success: true,
      conversation,
      messages
    });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await Conversation.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found.'
      });
    }

    await Message.deleteMany({ conversationId: conversation._id });
    await Conversation.deleteOne({ _id: conversation._id });

    res.json({
      success: true,
      message: 'Conversation deleted.'
    });
  } catch (error) {
    next(error);
  }
};

export const compareClaims = async (req, res, next) => {
  try {
    const validated = claimCompareSchema.parse(req.body);

    const result = await detectContradictions({
      userId: req.user._id,
      projectId: validated.projectId,
      documentIds: validated.documentIds,
      topic: validated.topic
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};

export const getEvidence = async (req, res, next) => {
  try {
    const { projectId, conversationId } = req.query;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'projectId query parameter is required.'
      });
    }

    const messageFilter = { userId: req.user._id, role: 'assistant' };
    if (conversationId) {
      messageFilter.conversationId = conversationId;
    }

    // Find all assistant messages with citations
    const messages = await Message.find(messageFilter)
      .sort({ createdAt: -1 })
      .lean();

    const allCitations = [];
    messages.forEach(m => {
      if (m.citations && m.citations.length > 0) {
        m.citations.forEach(cit => {
          allCitations.push({
            ...cit,
            messageId: m._id,
            conversationId: m.conversationId,
            createdAt: m.createdAt
          });
        });
      }
    });

    res.json({
      success: true,
      count: allCitations.length,
      evidence: allCitations
    });
  } catch (error) {
    next(error);
  }
};

