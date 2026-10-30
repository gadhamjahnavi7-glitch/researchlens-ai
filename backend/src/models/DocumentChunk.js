import mongoose from 'mongoose';

const documentChunkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    documentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Document',
      required: true,
      index: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResearchProject',
      required: true,
      index: true
    },
    chunkIndex: {
      type: Number,
      required: true
    },
    pageNumber: {
      type: Number,
      default: 1
    },
    text: {
      type: String,
      required: true
    },
    tokenCount: {
      type: Number,
      default: 0
    },
    keywords: [
      {
        type: String
      }
    ],
    embedding: [
      {
        type: Number
      }
    ]
  },
  { timestamps: true }
);

// Compound index for efficient project-wide and document-wide retrieval
documentChunkSchema.index({ projectId: 1, chunkIndex: 1 });
documentChunkSchema.index({ documentId: 1, chunkIndex: 1 });
documentChunkSchema.index({ text: 'text' });

export const DocumentChunk = mongoose.model('DocumentChunk', documentChunkSchema);

