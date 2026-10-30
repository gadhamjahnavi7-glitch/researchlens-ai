import mongoose from 'mongoose';

const citationSchema = new mongoose.Schema(
  {
    citationId: { type: String, required: true }, // e.g. "SRC-1"
    claim: { type: String, required: true },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true
    },
    documentTitle: { type: String, required: true },
    pageNumber: { type: Number, default: 1 },
    excerpt: { type: String, required: true },
    relevanceScore: { type: Number, default: 0.9 },
    verificationStatus: {
      type: String,
      enum: ['verified', 'unverified', 'extrapolated'],
      default: 'verified'
    }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
      index: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    role: {
      type: String,
      enum: ['user', 'assistant', 'system'],
      required: true
    },
    content: {
      type: String,
      required: true
    },
    citations: [citationSchema],
    evidenceAnalysis: {
      directEvidenceCount: { type: Number, default: 0 },
      hypothesesCount: { type: Number, default: 0 },
      unsupportedCount: { type: Number, default: 0 },
      verdict: { type: String, default: 'grounded' }
    }
  },
  { timestamps: true }
);

export const Message = mongoose.model('Message', messageSchema);

