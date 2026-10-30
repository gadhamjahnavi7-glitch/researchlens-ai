import { ResearchProject } from '../models/ResearchProject.js';
import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { Conversation } from '../models/Conversation.js';
import { Message } from '../models/Message.js';
import { ResearchReport } from '../models/ResearchReport.js';
import { createProjectSchema, updateProjectSchema } from '../validators/projectSchemas.js';
import { seedSampleWorkspace } from '../utils/sampleData.js';
import { logActivity, ActivityLog } from '../models/ActivityLog.js';

export const getProjects = async (req, res, next) => {
  try {
    const projects = await ResearchProject.find({ userId: req.user._id })
      .sort({ updatedAt: -1 })
      .lean();

    // Attach up-to-date document and report counts
    const enriched = await Promise.all(
      projects.map(async p => {
        const docCount = await Document.countDocuments({ projectId: p._id, userId: req.user._id });
        const reportCount = await ResearchReport.countDocuments({ projectId: p._id, userId: req.user._id });
        return {
          ...p,
          documentCount: docCount,
          reportCount
        };
      })
    );

    res.json({
      success: true,
      projects: enriched
    });
  } catch (error) {
    next(error);
  }
};

export const createProject = async (req, res, next) => {
  try {
    const validated = createProjectSchema.parse(req.body);

    const project = await ResearchProject.create({
      userId: req.user._id,
      title: validated.title,
      description: validated.description,
      tags: validated.tags
    });

    await logActivity({
      userId: req.user._id,
      projectId: project._id,
      action: 'PROJECT_CREATED',
      title: 'Created Research Project',
      description: `Created project "${project.title}".`
    });

    res.status(201).json({
      success: true,
      message: 'Research project created successfully.',
      project
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectById = async (req, res, next) => {
  try {
    const project = await ResearchProject.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).lean();

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Research project not found or you do not have permission to access it.'
      });
    }

    const docCount = await Document.countDocuments({ projectId: project._id, userId: req.user._id });
    const reportCount = await ResearchReport.countDocuments({ projectId: project._id, userId: req.user._id });

    res.json({
      success: true,
      project: {
        ...project,
        documentCount: docCount,
        reportCount
      }
    });
  } catch (error) {
    next(error);
  }
};

export const updateProject = async (req, res, next) => {
  try {
    const validated = updateProjectSchema.parse(req.body);

    const project = await ResearchProject.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { $set: validated },
      { new: true }
    );

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Research project not found.'
      });
    }

    res.json({
      success: true,
      message: 'Project updated successfully.',
      project
    });
  } catch (error) {
    next(error);
  }
};

export const deleteProject = async (req, res, next) => {
  try {
    const project = await ResearchProject.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Research project not found.'
      });
    }

    // Cascade delete associated resources
    await Promise.all([
      Document.deleteMany({ projectId: project._id, userId: req.user._id }),
      DocumentChunk.deleteMany({ projectId: project._id, userId: req.user._id }),
      Conversation.deleteMany({ projectId: project._id, userId: req.user._id }),
      ResearchReport.deleteMany({ projectId: project._id, userId: req.user._id }),
      ResearchProject.deleteOne({ _id: project._id })
    ]);

    res.json({
      success: true,
      message: 'Research project and all associated documents and reports deleted.'
    });
  } catch (error) {
    next(error);
  }
};

export const seedSample = async (req, res, next) => {
  try {
    const result = await seedSampleWorkspace(req.user._id);

    await logActivity({
      userId: req.user._id,
      projectId: result.project?._id || null,
      action: 'SAMPLE_WORKSPACE_SEEDED',
      title: 'Seeded Demonstration Papers',
      description: `Loaded ${result.documents?.length || 3} scientific papers into MongoDB Atlas.`
    });

    res.json({
      success: true,
      message: 'Demonstration research workspace and sample scientific papers loaded successfully.',
      project: result.project,
      documentsCount: result.documents.length
    });
  } catch (error) {
    next(error);
  }
};

export const getActivities = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }

    const activities = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(30)
      .lean();

    res.json({
      success: true,
      activities
    });
  } catch (error) {
    next(error);
  }
};

