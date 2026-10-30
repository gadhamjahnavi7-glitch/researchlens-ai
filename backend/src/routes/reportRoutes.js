import express from 'express';
import {
  generateReport,
  getReports,
  getReportById,
  updateReport,
  deleteReport,
  exportReport
} from '../controllers/reportController.js';
import { authenticate } from '../middleware/auth.js';
import { aiResearchLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);

router.post('/generate', aiResearchLimiter, generateReport);
router.get('/', getReports);
router.get('/:id', getReportById);
router.patch('/:id', updateReport);
router.delete('/:id', deleteReport);
router.get('/:id/export', exportReport);

export default router;

