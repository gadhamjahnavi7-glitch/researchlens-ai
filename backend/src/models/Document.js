import mongoose from 'mongoose';

const pageMetadataSchema = new mongoose.Schema(
  {
    pageNumber: { type: Number, required: true },
    charCount: { type: Number, default: 0 }
  },
  { _id: false }
);

const documentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ResearchProject',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true
    },
    originalFilename: {
      type: String,
      required: true
    },
    storedFileReference: {
      type: String,
      default: ''
    },
    fileType: {
      type: String,
      enum: ['pdf', 'txt', 'docx'],
      required: true
    },
    fileSize: {
      type: Number,
      required: true
    },
    processingStatus: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed'],
      default: 'pending',
      index: true
    },
    processingError: {
      type: String,
      default: null
    },
    pageCount: {
      type: Number,
      default: 1
    },
    pageMetadata: [pageMetadataSchema],
    chunkCount: {
      type: Number,
      default: 0
    },
    summary: {
      type: String,
      default: ''
    },
    keyThemes: [
      {
        type: String
      }
    ],
    // Store extracted text reference or preview (first 10,000 characters preview to avoid bloating)
    textPreview: {
      type: String,
      default: ''
    }
  },
  { timestamps: true }
);

export const Document = mongoose.model('Document', documentSchema);

