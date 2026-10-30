import { discoverKnowledge } from '../services/research/discoveryService.js';
import { discoveryAnalyzeSchema } from '../validators/researchSchemas.js';

export const analyzeProject = async (req, res, next) => {
  try {
    const validated = discoveryAnalyzeSchema.parse(req.body);

    const discovery = await discoverKnowledge({
      userId: req.user._id,
      projectId: validated.projectId,
      documentIds: validated.documentIds
    });

    res.json({
      success: true,
      discovery
    });
  } catch (error) {
    next(error);
  }
};

export const getProjectDiscovery = async (req, res, next) => {
  try {
    const projectId = req.params.projectId;

    const discovery = await discoverKnowledge({
      userId: req.user._id,
      projectId
    });

    res.json({
      success: true,
      discovery
    });
  } catch (error) {
    next(error);
  }
};

