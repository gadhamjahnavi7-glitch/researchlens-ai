import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { calculateChunkScore, tokenize } from '../services/retrieval/retrievalService.js';

export const search = async (req, res, next) => {
  try {
    const { q, projectId, documentId } = req.query;

    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Search query parameter (q) is required.'
      });
    }

    const queryTokens = tokenize(q.trim());

    const docFilter = { userId: req.user._id };
    if (projectId) docFilter.projectId = projectId;
    if (documentId) docFilter._id = documentId;

    // Search matching documents by title or text preview
    const matchingDocs = await Document.find({
      ...docFilter,
      $or: [
        { title: { $regex: q.trim(), $options: 'i' } },
        { textPreview: { $regex: q.trim(), $options: 'i' } },
        { keyThemes: { $in: [new RegExp(q.trim(), 'i')] } }
      ]
    }).select('title originalFilename fileType pageCount summary').lean();

    // Search matching chunks
    const chunkFilter = { userId: req.user._id };
    if (projectId) chunkFilter.projectId = projectId;
    if (documentId) chunkFilter.documentId = documentId;

    const candidateChunks = await DocumentChunk.find(chunkFilter)
      .populate('documentId', 'title originalFilename')
      .lean();

    const scoredChunks = [];
    candidateChunks.forEach(chunk => {
      const score = calculateChunkScore(queryTokens, chunk.text);
      if (score > 0.08 || chunk.text.toLowerCase().includes(q.trim().toLowerCase())) {
        scoredChunks.push({
          chunkId: chunk._id,
          documentId: chunk.documentId?._id,
          documentTitle: chunk.documentId?.title || 'Document',
          pageNumber: chunk.pageNumber,
          text: chunk.text,
          score: parseFloat(score.toFixed(3))
        });
      }
    });

    scoredChunks.sort((a, b) => b.score - a.score);

    res.json({
      success: true,
      query: q.trim(),
      totalMatches: matchingDocs.length + scoredChunks.length,
      documents: matchingDocs,
      chunks: scoredChunks.slice(0, 15)
    });
  } catch (error) {
    next(error);
  }
};

