import express from 'express';
import {
  chat,
  getConversations,
  getConversationMessages,
  deleteConversation,
  compareClaims,
  getEvidence
} from '../controllers/researchController.js';
import { authenticate } from '../middleware/auth.js';
import { aiResearchLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(authenticate);

router.post('/chat', aiResearchLimiter, chat);
router.get('/conversations', getConversations);
router.get('/conversations/:id', getConversationMessages);
router.delete('/conversations/:id', deleteConversation);
router.post('/compare-claims', aiResearchLimiter, compareClaims);
router.get('/evidence', getEvidence);

export default router;

