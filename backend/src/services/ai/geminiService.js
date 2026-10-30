import { GoogleGenerativeAI } from '@google/generative-ai';
import { config, hasGeminiKey } from '../../config/env.js';

let genAI = null;
if (hasGeminiKey) {
  try {
    genAI = new GoogleGenerativeAI(config.GEMINI_API_KEY);
  } catch (err) {
    console.warn('Could not initialize GoogleGenerativeAI client:', err.message);
  }
}

/**
 * Builds grounded prompt for Gemini
 */
const buildGroundedPrompt = (question, retrievedChunks, conversationHistory = []) => {
  let contextText = '';
  retrievedChunks.forEach((chunk, index) => {
    contextText += `--- SOURCE REF [SRC-${index + 1}] ---\n`;
    contextText += `Document: "${chunk.documentTitle}" (Page: ${chunk.pageNumber})\n`;
    contextText += `Text Excerpt: "${chunk.text}"\n\n`;
  });

  const prompt = `
You are ResearchLens AI, an evidence-first academic research assistant.
Your absolute priority is to provide verifiable, evidence-grounded answers based STRICTLY on the retrieved sources below.

CRITICAL INSTRUCTIONS:
1. Every factual statement or claim MUST cite the source using the exact format [SRC-X].
2. For every citation, specify:
   - What claim is supported.
   - The exact excerpt or direct evidence from the source.
3. If the retrieved sources do NOT contain sufficient evidence to answer the question or parts of it, EXPLICITLY state: "The uploaded research documents do not contain sufficient evidence to address this point." DO NOT invent or extrapolate facts without marking them.
4. Distinguish clearly between:
   - DIRECT EVIDENCE: explicitly stated facts in the text.
   - AI INTERPRETATION / HYPOTHESIS: logical deductions, clearly marked as hypothesis.
   - UNVERIFIED CLAIMS: open questions requiring further experimental validation.
5. Never invent paper authors, DOIs, page numbers, or external publications.

RETRIEVED SOURCE EXCERPTS:
${contextText || '(No relevant excerpts retrieved for this query.)'}

USER RESEARCH INQUIRY:
${question}

OUTPUT FORMAT REQUIREMENTS:
Provide your response in structured JSON with the following format:
{
  "answer": "Comprehensive, evidence-grounded answer in markdown formatting. Include inline [SRC-X] markers where claims are made.",
  "citations": [
    {
      "sourceId": "SRC-1",
      "claim": "Specific statement made in the answer",
      "excerpt": "Verbatim supporting quote from the source passage",
      "verificationStatus": "verified" // or "unverified", "extrapolated"
    }
  ],
  "directEvidenceSummary": ["Key direct finding 1", "Key direct finding 2"],
  "aiHypotheses": ["Potential relationship inferred by AI (requires further verification)"],
  "unsupportedAspects": ["Aspects not answered by current documents"],
  "evidenceSufficiency": "sufficient" // or "partial", "insufficient"
}
`;

  return prompt;
};

/**
 * Fallback synthesizer when Gemini API key is missing or unavailable
 * Uses rule-based extraction from actual retrieved chunks so user can still test the platform
 */
const synthesizeRuleBasedAnswer = (question, retrievedChunks) => {
  if (!retrievedChunks || retrievedChunks.length === 0) {
    return {
      answer: `### Insufficient Evidence\n\nThe uploaded documents do not contain matching passages for the research inquiry: **"${question}"**.\n\n*Please ensure relevant documents are uploaded to this project or refine your search keywords.*`,
      citations: [],
      directEvidenceSummary: [],
      aiHypotheses: [],
      unsupportedAspects: [question],
      evidenceSufficiency: 'insufficient',
      isFallback: true
    };
  }

  const citations = [];
  let answerMd = `### Evidence-First Analysis for: *"${question}"*\n\nBased on retrieved passages from **${new Set(retrievedChunks.map(c => c.documentTitle)).size}** source document(s):\n\n`;

  const topChunks = retrievedChunks.slice(0, 4);
  topChunks.forEach((chunk, idx) => {
    const srcId = `SRC-${idx + 1}`;
    // Extract first 1-2 salient sentences as the claim
    const sentences = chunk.text.split(/(?<=[.!?])\s+/).filter(Boolean);
    const primaryClaim = sentences[0] || chunk.text.slice(0, 120);

    citations.push({
      sourceId: srcId,
      claim: primaryClaim,
      excerpt: chunk.text.length > 250 ? chunk.text.slice(0, 250) + '...' : chunk.text,
      verificationStatus: 'verified',
      documentId: chunk.documentId,
      documentTitle: chunk.documentTitle,
      pageNumber: chunk.pageNumber,
      relevanceScore: chunk.relevanceScore
    });

    answerMd += `**Finding ${idx + 1}** [${srcId}]: In *${chunk.documentTitle}* (Page ${chunk.pageNumber}):\n> "${chunk.text.slice(0, 280)}${chunk.text.length > 280 ? '...' : ''}"\n\n`;
  });

  answerMd += `\n---\n> [!NOTE]\n> **AI Configuration Note**: This synthesis was structured using local evidence retrieval. Configure \`GEMINI_API_KEY\` in your \`.env\` file for full LLM generative reasoning.`;

  return {
    answer: answerMd,
    citations,
    directEvidenceSummary: citations.map(c => c.claim),
    aiHypotheses: [
      `Comparative synergy between ${topChunks.map(c => c.documentTitle).join(' and ')} warrants further empirical validation.`
    ],
    unsupportedAspects: ['Longitudinal real-world validation data not present in uploaded files.'],
    evidenceSufficiency: topChunks.length > 1 ? 'sufficient' : 'partial',
    isFallback: true
  };
};

/**
 * Generate Research Chat Answer using Gemini or intelligent fallback
 */
export const generateResearchAnswer = async ({
  question,
  retrievedChunks = [],
  conversationHistory = []
}) => {
  // If no Gemini key is provided, gracefully use rule-based evidence synthesis
  if (!hasGeminiKey || !genAI) {
    return synthesizeRuleBasedAnswer(question, retrievedChunks);
  }

  try {
    const model = genAI.getGenerativeModel({
      model: config.GEMINI_MODEL,
      generationConfig: {
        temperature: 0.2, // Low temperature for high factual grounding
        topP: 0.8,
        responseMimeType: 'application/json'
      }
    });

    const prompt = buildGroundedPrompt(question, retrievedChunks, conversationHistory);
    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    let parsed;
    try {
      parsed = JSON.parse(responseText);
    } catch (parseErr) {
      console.warn('Failed to parse Gemini JSON output, attempting cleanup:', parseErr.message);
      // Clean up markdown block if present
      const cleaned = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsed = JSON.parse(cleaned);
    }

    // Validate returned citations against real retrieved chunks!
    const validatedCitations = [];
    if (Array.isArray(parsed.citations)) {
      parsed.citations.forEach(cit => {
        const match = cit.sourceId && cit.sourceId.match(/SRC-(\d+)/i);
        if (match) {
          const chunkIndex = parseInt(match[1], 10) - 1;
          if (retrievedChunks[chunkIndex]) {
            const realChunk = retrievedChunks[chunkIndex];
            validatedCitations.push({
              sourceId: cit.sourceId,
              claim: cit.claim || 'Source-supported research claim',
              excerpt: realChunk.text.slice(0, 300),
              verificationStatus: cit.verificationStatus || 'verified',
              documentId: realChunk.documentId,
              documentTitle: realChunk.documentTitle,
              pageNumber: realChunk.pageNumber,
              relevanceScore: realChunk.relevanceScore
            });
          }
        }
      });
    }

    return {
      answer: parsed.answer,
      citations: validatedCitations,
      directEvidenceSummary: parsed.directEvidenceSummary || [],
      aiHypotheses: parsed.aiHypotheses || [],
      unsupportedAspects: parsed.unsupportedAspects || [],
      evidenceSufficiency: parsed.evidenceSufficiency || 'sufficient',
      isFallback: false
    };
  } catch (error) {
    console.error('Gemini API call failed, falling back to local grounded synthesis:', error.message);
    const fallbackResult = synthesizeRuleBasedAnswer(question, retrievedChunks);
    fallbackResult.errorWarning = `Gemini API Notice: ${error.message}. Local grounded extraction was used instead.`;
    return fallbackResult;
  }
};

