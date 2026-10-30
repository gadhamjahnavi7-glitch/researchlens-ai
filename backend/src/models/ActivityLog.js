import mongoose from 'mongoose';

const activityLogSchema = new mongoose.Schema(
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
      default: null,
      index: true
    },
    action: {
      type: String,
      required: true,
      enum: [
        'USER_REGISTERED',
        'USER_LOGIN',
        'PROJECT_CREATED',
        'PROJECT_UPDATED',
        'PROJECT_DELETED',
        'DOCUMENT_UPLOADED',
        'DOCUMENT_DELETED',
        'CHAT_INQUIRY',
        'EVIDENCE_INSPECTED',
        'CONTRADICTIONS_COMPARED',
        'KNOWLEDGE_DISCOVERY_RUN',
        'REPORT_GENERATED',
        'REPORT_UPDATED',
        'REPORT_DELETED',
        'SAMPLE_WORKSPACE_SEEDED'
      ],
      index: true
    },
    title: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  { timestamps: true }
);

export const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);

/**
 * Utility helper to record an activity log in MongoDB asynchronously
 */
export const logActivity = async ({ userId, projectId = null, action, title, description = '', metadata = {} }) => {
  try {
    if (!userId) return null;
    return await ActivityLog.create({
      userId,
      projectId,
      action,
      title,
      description,
      metadata
    });
  } catch (err) {
    console.error('Failed to write activity log to MongoDB:', err.message);
    return null;
  }
};

