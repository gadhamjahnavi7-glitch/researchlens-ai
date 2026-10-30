import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
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
      default: 'New Research Inquiry',
      trim: true
    },
    selectedDocumentIds: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Document'
      }
    ]
  },
  { timestamps: true }
);

export const Conversation = mongoose.model('Conversation', conversationSchema);

