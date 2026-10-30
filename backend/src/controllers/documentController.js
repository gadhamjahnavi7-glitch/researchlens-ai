import path from 'path';
import fs from 'fs';
import { Document } from '../models/Document.js';
import { DocumentChunk } from '../models/DocumentChunk.js';
import { ResearchProject } from '../models/ResearchProject.js';
import { extractDocumentText } from '../services/document/extractorService.js';
import { chunkDocumentPages } from '../services/document/chunkerService.js';
import { logActivity } from '../models/ActivityLog.js';

export const getDocuments = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id };
    if (req.query.projectId) {
      filter.projectId = req.query.projectId;
    }

    const documents = await Document.find(filter)
      .sort({ createdAt: -1 })
      .select('-__v')
      .lean();

    res.json({
      success: true,
      documents
    });
  } catch (error) {
    next(error);
  }
};

export const uploadDocument = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No file was uploaded. Please select a valid PDF, TXT, or DOCX document.'
      });
    }

    const { projectId, title } = req.body;
    if (!projectId) {
      return res.status(400).json({
        success: false,
        message: 'A valid Project ID must be specified for document upload.'
      });
    }

    // Verify project ownership
    const project = await ResearchProject.findOne({
      _id: projectId,
      userId: req.user._id
    });

    if (!project) {
      return res.status(404).json({
        success: false,
        message: 'Selected research project does not exist or you do not have permission to add documents to it.'
      });
    }

    const ext = path.extname(req.file.originalname).toLowerCase().replace('.', '');
    const documentTitle = (title && title.trim()) || path.basename(req.file.originalname, path.extname(req.file.originalname));

    // Create document record in 'processing' state
    const docRecord = await Document.create({
      userId: req.user._id,
      projectId: project._id,
      title: documentTitle,
      originalFilename: req.file.originalname,
      storedFileReference: req.file.path,
      fileType: ext,
      fileSize: req.file.size,
      processingStatus: 'processing'
    });

    try {
      // Extract text
      const extracted = await extractDocumentText(req.file.path, ext);

      // Chunk pages
      const chunks = chunkDocumentPages(extracted.pages);

      // Create chunks in database
      const chunkDocs = chunks.map(c => ({
        userId: req.user._id,
        documentId: docRecord._id,
        projectId: project._id,
        chunkIndex: c.chunkIndex,
        pageNumber: c.pageNumber,
        text: c.text,
        tokenCount: c.tokenCount,
        keywords: [documentTitle.toLowerCase()]
      }));

      if (chunkDocs.length > 0) {
        await DocumentChunk.insertMany(chunkDocs);
      }

      // Update document record to completed
      docRecord.processingStatus = 'completed';
      docRecord.pageCount = extracted.pageCount || 1;
      docRecord.pageMetadata = extracted.pages.map(p => ({
        pageNumber: p.pageNumber,
        charCount: p.text.length
      }));
      docRecord.chunkCount = chunkDocs.length;
      docRecord.textPreview = extracted.fullText.slice(0, 5000);
      if (extracted.warning) {
        docRecord.processingError = extracted.warning;
      }
      await docRecord.save();

      // Update project document count
      await ResearchProject.findByIdAndUpdate(project._id, {
        $inc: { documentCount: 1 }
      });

      await logActivity({
        userId: req.user._id,
        projectId: project._id,
        action: 'DOCUMENT_UPLOADED',
        title: 'Uploaded Research Document',
        description: `Uploaded and indexed "${docRecord.title}" (${chunkDocs.length} chunks, ${extracted.pageCount || 1} pages).`
      });

      res.status(201).json({
        success: true,
        message: 'Document uploaded and processed successfully into searchable evidence chunks.',
        document: docRecord,
        warning: extracted.warning || null
      });
    } catch (extractError) {
      console.error('Error during document extraction:', extractError);
      docRecord.processingStatus = 'failed';
      docRecord.processingError = extractError.message;
      await docRecord.save();

      res.status(500).json({
        success: false,
        message: `Failed to extract text from document: ${extractError.message}`,
        document: docRecord
      });
    }
  } catch (error) {
    next(error);
  }
};

export const getDocumentById = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    }).populate('projectId', 'title');

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.'
      });
    }

    res.json({
      success: true,
      document
    });
  } catch (error) {
    next(error);
  }
};

export const getDocumentContent = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.'
      });
    }

    const chunks = await DocumentChunk.find({
      documentId: document._id,
      userId: req.user._id
    }).sort({ chunkIndex: 1 });

    res.json({
      success: true,
      document,
      chunks
    });
  } catch (error) {
    next(error);
  }
};

export const deleteDocument = async (req, res, next) => {
  try {
    const document = await Document.findOne({
      _id: req.params.id,
      userId: req.user._id
    });

    if (!document) {
      return res.status(404).json({
        success: false,
        message: 'Document not found.'
      });
    }

    // Remove local file if exists
    if (document.storedFileReference && fs.existsSync(document.storedFileReference)) {
      try {
        fs.unlinkSync(document.storedFileReference);
      } catch (err) {
        console.warn('Could not delete physical file:', err.message);
      }
    }

    // Delete chunks and document
    await DocumentChunk.deleteMany({ documentId: document._id });
    await Document.deleteOne({ _id: document._id });

    // Decrement project document count
    await ResearchProject.findByIdAndUpdate(document.projectId, {
      $inc: { documentCount: -1 }
    });

    res.json({
      success: true,
      message: 'Document and its indexed chunks removed.'
    });
  } catch (error) {
    next(error);
  }
};

