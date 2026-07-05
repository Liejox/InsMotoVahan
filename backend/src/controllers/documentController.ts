import { Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { NotFoundError, BadRequestError, ForbiddenError } from '../utils/errors';
import config from '../config';

export class DocumentController {
  uploadDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      if (!req.file) {
        throw new BadRequestError('No file uploaded or file rejected by security filters');
      }

      const { customerId, documentType } = req.body;
      if (!customerId || !documentType) {
        // Clean up the uploaded file if request body validation fails
        fs.unlinkSync(req.file.path);
        throw new BadRequestError('customerId and documentType are required');
      }

      // Check customer exists and belongs to this user
      const customer = await prisma.customer.findFirst({
        where: { id: customerId, userId },
      });
      if (!customer) {
        fs.unlinkSync(req.file.path);
        throw new NotFoundError('Customer not found');
      }

      const doc = await prisma.document.create({
        data: {
          userId,
          customerId,
          documentType,
          fileName: req.file.originalname,
          filePath: req.file.filename,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
        },
      });

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPLOAD_DOCUMENT',
          details: JSON.stringify({
            customerId,
            documentId: doc.id,
            documentType,
            fileName: doc.fileName,
          }),
        },
      });

      return res.status(201).json({
        status: 'success',
        data: { document: doc },
      });
    } catch (error) {
      next(error);
    }
  };

  getCustomerDocuments = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { customerId } = req.params;
      const documents = await prisma.document.findMany({
        where: { customerId, userId },
        orderBy: { uploadedAt: 'desc' },
      });

      return res.status(200).json({
        status: 'success',
        data: { documents },
      });
    } catch (error) {
      next(error);
    }
  };

  serveDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const doc = await prisma.document.findFirst({
        where: { id, userId },
      });

      if (!doc) {
        throw new NotFoundError('Document not found');
      }

      const absolutePath = path.resolve(config.UPLOAD_DIR, doc.filePath);
      
      // Ensure the resolved path remains inside the configured upload directory (prevent directory traversal)
      const uploadFolderRoot = path.resolve(config.UPLOAD_DIR);
      if (!absolutePath.startsWith(uploadFolderRoot)) {
        throw new ForbiddenError('Path traversal detected');
      }

      if (!fs.existsSync(absolutePath)) {
        throw new NotFoundError('Physical file not found on disk');
      }

      res.setHeader('Content-Type', doc.mimeType);
      if (req.query.download === 'true') {
        res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.fileName)}"`);
      } else {
        res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
      }
      return res.sendFile(absolutePath);
    } catch (error) {
      next(error);
    }
  };

  deleteDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const doc = await prisma.document.findFirst({
        where: { id, userId },
      });

      if (!doc) {
        throw new NotFoundError('Document not found');
      }

      const absolutePath = path.resolve(config.UPLOAD_DIR, doc.filePath);
      if (fs.existsSync(absolutePath)) {
        fs.unlinkSync(absolutePath);
      }

      await prisma.document.delete({ where: { id } });

      return res.status(200).json({
        status: 'success',
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  replaceDocument = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      if (!req.file) {
        throw new BadRequestError('No file uploaded or file rejected by security filters');
      }

      const { id } = req.params;
      const doc = await prisma.document.findFirst({
        where: { id, userId },
      });
      if (!doc) {
        fs.unlinkSync(req.file.path);
        throw new NotFoundError('Document not found');
      }

      // Delete old file
      const oldAbsolutePath = path.resolve(config.UPLOAD_DIR, doc.filePath);
      if (fs.existsSync(oldAbsolutePath)) {
        fs.unlinkSync(oldAbsolutePath);
      }

      // Update document record
      const updated = await prisma.document.update({
        where: { id },
        data: {
          fileName: req.file.originalname,
          filePath: req.file.filename,
          fileSize: req.file.size,
          mimeType: req.file.mimetype,
          uploadedAt: new Date(),
        },
      });

      await prisma.activityLog.create({
        data: {
          userId,
          action: 'UPLOAD_DOCUMENT',
          details: JSON.stringify({
            customerId: doc.customerId,
            documentId: doc.id,
            documentType: doc.documentType,
            fileName: updated.fileName,
            actionDetails: 'REPLACED_FILE',
          }),
        },
      });

      return res.status(200).json({
        status: 'success',
        data: { document: updated },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const documentController = new DocumentController();
export default documentController;
