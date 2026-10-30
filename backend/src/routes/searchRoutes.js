import express from 'express';
import { search } from '../controllers/searchController.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticate);

router.get('/', search);

export default router;

