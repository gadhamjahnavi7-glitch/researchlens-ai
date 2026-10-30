import mongoose from 'mongoose';

const researchProjectSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: 2000
    },
    tags: [
      {
        type: String,
        trim: true
      }
    ],
    documentCount: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

export const ResearchProject = mongoose.model('ResearchProject', researchProjectSchema);

