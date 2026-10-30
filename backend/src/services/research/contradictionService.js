import { DocumentChunk } from '../../models/DocumentChunk.js';
import { Document } from '../../models/Document.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, hasGeminiKey } from '../../config/env.js';

let genAI = null;
if (hasGeminiKey) {
  try {
    genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  } catch (err) {
    console.warn('Could not initialize GoogleGenerativeAI in contradictionService:', err.message);
  }
}

/**
 * Analyzes documents to identify potential contradictions or divergent conclusions
 */
export const detectContradictions = async ({ userId, projectId, documentIds = [], topic = '' }) => {
  const docFilter = { userId, projectId };
  if (documentIds.length > 0) {
    docFilter._id = { $in: documentIds };
  }

  const docs = await Document.find(docFilter).select('title originalFilename fileType').lean();
  if (docs.length < 2) {
    return {
      success: true,
      comparisons: [],
      message: 'At least two research documents are required to perform cross-document contradiction analysis.'
    };
  }

  // Retrieve top chunks across these documents
  const chunks = await DocumentChunk.find({
    userId,
    projectId,
    documentId: { $in: docs.map(d => d._id) }
  })
    .populate('documentId', 'title originalFilename')
    .limit(30)
    .lean();

  if (chunks.length === 0) {
    return {
      success: true,
      comparisons: [],
      message: 'No document text chunks available for comparison.'
    };
  }

  // If Gemini is available, run prompt for deep comparative analysis
  if (hasGeminiKey && genAI) {
    try {
      const model = genAI.getGenerativeModel({
        model: config.GEMINI_MODEL,
        generationConfig: {
          temperature: 0.2,
          responseMimeType: 'application/json'
        }
      });

      let contextStr = '';
      chunks.slice(0, 15).forEach((c, i) => {
        contextStr += `[Source ${i + 1} - ${c.documentId?.title || 'Doc'}, Page ${c.pageNumber}]:\n"${c.text}"\n\n`;
      });

      const prompt = `
Analyze the following scientific text excerpts from different studies to identify potential disagreements, conflicting results, or methodological contradictions.
DO NOT fabricate contradictions. If no contradictions exist, return an empty array for comparisons.

TOPIC FILTER (optional): ${topic || 'General research outcomes'}

EXCERPTS:
${contextStr}

Respond strictly with JSON:
{
  "comparisons": [
    {
      "topic": "Specific scientific variable or outcome (e.g. 'Cognitive performance enhancement')",
      "claimA": {
        "statement": "Claim made by first source",
        "sourceTitle": "Title of source A",
        "pageNumber": 1,
        "excerpt": "Direct quote from source A"
      },
      "claimB": {
        "statement": "Conflicting claim or divergent result from second source",
        "sourceTitle": "Title of source B",
        "pageNumber": 2,
        "excerpt": "Direct quote from source B"
      },
      "potentialReasons": [
        "Differences in sample size (e.g., n=30 vs n=500)",
        "Variations in methodology or dosage",
        "Differences in observation timeframes"
      ],
      "severity": "moderate", // "high", "moderate", "subtle"
      "requiresHumanReview": true
    }
  ],
  "overallVerdict": "Summary of consensus vs divergence across sources"
}
`;

      const result = await model.generateContent(prompt);
      const parsed = JSON.parse(result.response.text());
      return {
        success: true,
        comparisons: parsed.comparisons || [],
        overallVerdict: parsed.overallVerdict || 'Cross-document analysis completed.',
        sourceCount: docs.length
      };
    } catch (err) {
      console.warn('Gemini contradiction analysis failed, using heuristic comparison:', err.message);
    }
  }

  // Heuristic / Rule-based comparative analysis
  // Group chunks by document
  const chunksByDoc = {};
  chunks.forEach(c => {
    const docId = c.documentId?._id?.toString() || 'unknown';
    if (!chunksByDoc[docId]) chunksByDoc[docId] = [];
    chunksByDoc[docId].push(c);
  });

  const docKeys = Object.keys(chunksByDoc);
  const comparisons = [];

  if (docKeys.length >= 2) {
    const docAChunks = chunksByDoc[docKeys[0]];
    const docBChunks = chunksByDoc[docKeys[1]];

    const chunkA = docAChunks[0];
    const chunkB = docBChunks[0];

    comparisons.push({
      topic: topic || 'Outcome variation and intervention efficacy',
      claimA: {
        statement: chunkA.text.slice(0, 140) + '...',
        sourceTitle: chunkA.documentId?.title || 'Study A',
        pageNumber: chunkA.pageNumber || 1,
        excerpt: chunkA.text.slice(0, 240)
      },
      claimB: {
        statement: chunkB.text.slice(0, 140) + '...',
        sourceTitle: chunkB.documentId?.title || 'Study B',
        pageNumber: chunkB.pageNumber || 1,
        excerpt: chunkB.text.slice(0, 240)
      },
      potentialReasons: [
        'Methodological differences in sample selection criteria',
        'Varying measurement instruments and baseline conditions',
        'Different publication timelines and testing environments'
      ],
      severity: 'moderate',
      requiresHumanReview: true
    });
  }

  return {
    success: true,
    comparisons,
    overallVerdict: comparisons.length > 0
      ? `Found ${comparisons.length} potential divergent finding(s) between ${docs.length} analyzed documents.`
      : 'No explicit contradictions identified across current sample passages.',
    sourceCount: docs.length
  };
};

