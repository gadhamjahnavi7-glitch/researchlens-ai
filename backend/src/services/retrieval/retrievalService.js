import { DocumentChunk } from '../../models/DocumentChunk.js';
import { Document } from '../../models/Document.js';

/**
 * Basic tokenizer and stopword cleaner for academic & research text
 */
const STOP_WORDS = new Set([
  'the', 'and', 'a', 'an', 'in', 'on', 'of', 'for', 'to', 'with', 'by', 'at', 'from',
  'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
  'did', 'that', 'this', 'these', 'those', 'it', 'its', 'they', 'their', 'we', 'our',
  'which', 'who', 'whom', 'what', 'when', 'where', 'why', 'how', 'all', 'both', 'each',
  'more', 'most', 'other', 'some', 'such', 'than', 'too', 'very', 'can', 'will', 'just'
]);

export const tokenize = (text) => {
  if (!text) return [];
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));
};

/**
 * Calculates BM25-like relevance score for a document chunk given a query
 */
export const calculateChunkScore = (queryTokens, chunkText) => {
  if (!queryTokens.length || !chunkText) return 0;
  const chunkTokens = tokenize(chunkText);
  if (!chunkTokens.length) return 0;

  const chunkTokenFreq = {};
  for (const t of chunkTokens) {
    chunkTokenFreq[t] = (chunkTokenFreq[t] || 0) + 1;
  }

  let score = 0;
  let matches = 0;

  for (const q of queryTokens) {
    if (chunkTokenFreq[q]) {
      matches++;
      // Term frequency saturation + document length normalization
      const tf = chunkTokenFreq[q];
      const normalizedTf = (tf * 2.2) / (tf + 1.2 * (1 - 0.75 + 0.75 * (chunkTokens.length / 100)));
      score += normalizedTf;
    }
  }

  // Fraction of query terms covered
  const coverageBonus = matches / queryTokens.length;
  const finalScore = score * (1 + coverageBonus);

  // Normalize to 0.0 - 0.99
  return Math.min(0.99, Math.max(0.05, (finalScore / (queryTokens.length * 2.5))));
};

/**
 * Retrieves relevant document chunks across selected documents or entire project
 */
export const retrieveRelevantChunks = async ({
  userId,
  projectId,
  documentIds = [],
  query,
  limit = 8
}) => {
  const queryTokens = tokenize(query);

  const filter = {
    userId,
    projectId
  };

  if (documentIds && documentIds.length > 0) {
    filter.documentId = { $in: documentIds };
  }

  // Fetch chunks
  const chunks = await DocumentChunk.find(filter)
    .populate('documentId', 'title originalFilename fileType')
    .lean();

  if (!chunks || chunks.length === 0) {
    return [];
  }

  // Score each chunk
  const scoredChunks = chunks.map(chunk => {
    const score = calculateChunkScore(queryTokens, chunk.text);
    return {
      chunkId: chunk._id.toString(),
      documentId: chunk.documentId?._id?.toString() || chunk.documentId?.toString(),
      documentTitle: chunk.documentId?.title || 'Unknown Document',
      originalFilename: chunk.documentId?.originalFilename || 'Document',
      pageNumber: chunk.pageNumber || 1,
      chunkIndex: chunk.chunkIndex,
      text: chunk.text,
      relevanceScore: parseFloat(score.toFixed(3))
    };
  });

  // Sort descending by relevance score
  scoredChunks.sort((a, b) => b.relevanceScore - a.relevanceScore);

  // Return top results
  return scoredChunks.slice(0, limit);
};

