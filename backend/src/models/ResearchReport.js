import mongoose from 'mongoose';

const researchReportSchema = new mongoose.Schema(
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
    researchQuestion: {
      type: String,
      default: ''
    },
    reportContent: {
      executiveSummary: { type: String, default: '' },
      background: { type: String, default: '' },
      majorFindings: [
        {
          heading: { type: String, default: '' },
          content: { type: String, default: '' },
          supportingSources: [{ type: String }]
        }
      ],
      sourceComparison: { type: String, default: '' },
      supportingEvidence: [
        {
          claim: { type: String, default: '' },
          sourceTitle: { type: String, default: '' },
          pageNumber: { type: Number, default: 1 },
          excerpt: { type: String, default: '' }
        }
      ],
      potentialDisagreements: [
        {
          topic: { type: String, default: '' },
          claimA: {
            text: { type: String, default: '' },
            source: { type: String, default: '' },
            page: { type: Number, default: 1 }
          },
          claimB: {
            text: { type: String, default: '' },
            source: { type: String, default: '' },
            page: { type: Number, default: 1 }
          },
          reason: { type: String, default: '' }
        }
      ],
      researchGaps: [{ type: String }],
      limitations: [{ type: String }],
      conclusion: { type: String, default: '' }
    },
    sourceReferences: [
      {
        documentId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Document'
        },
        title: { type: String, default: '' },
        filename: { type: String, default: '' },
        chunksUsed: { type: Number, default: 0 }
      }
    ],
    status: {
      type: String,
      enum: ['draft', 'final'],
      default: 'draft'
    }
  },
  { timestamps: true }
);

export const ResearchReport = mongoose.model('ResearchReport', researchReportSchema);

