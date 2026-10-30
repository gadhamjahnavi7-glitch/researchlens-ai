import express from 'express';
import {
  getDocuments,
  uploadDocument,
  getDocumentById,
  getDocumentContent,
  deleteDocument
} from '../controllers/documentController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../middleware/upload.js';

const router = express.Router();

router.use(authenticate);

router.get('/', getDocuments);
router.post('/upload', upload.single('file'), uploadDocument);
router.get('/:id', getDocumentById);
router.get('/:id/content', getDocumentContent);
router.delete('/:id', deleteDocument);

export default router;

