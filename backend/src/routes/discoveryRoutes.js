import express from 'express';
import { analyzeProject, getProjectDiscovery } from '../controllers/discoveryController.js';
import { authenticate } from '../middleware/auth.js';
import { aiResearchLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);

router.post('/analyze', aiResearchLimiter, analyzeProject);
router.get('/:projectId', getProjectDiscovery);

export default router;

