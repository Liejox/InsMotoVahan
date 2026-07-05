"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.documentController = exports.DocumentController = void 0;
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
const config_1 = __importDefault(require("../config"));
class DocumentController {
    uploadDocument = async (req, res, next) => {
        try {
            const userId = req.user.id;
            if (!req.file) {
                throw new errors_1.BadRequestError('No file uploaded or file rejected by security filters');
            }
            const { customerId, documentType } = req.body;
            if (!customerId || !documentType) {
                // Clean up the uploaded file if request body validation fails
                fs_1.default.unlinkSync(req.file.path);
                throw new errors_1.BadRequestError('customerId and documentType are required');
            }
            // Check customer exists and belongs to this user
            const customer = await db_1.default.customer.findFirst({
                where: { id: customerId, userId },
            });
            if (!customer) {
                fs_1.default.unlinkSync(req.file.path);
                throw new errors_1.NotFoundError('Customer not found');
            }
            const doc = await db_1.default.document.create({
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
            await db_1.default.activityLog.create({
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
        }
        catch (error) {
            next(error);
        }
    };
    getCustomerDocuments = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { customerId } = req.params;
            const documents = await db_1.default.document.findMany({
                where: { customerId, userId },
                orderBy: { uploadedAt: 'desc' },
            });
            return res.status(200).json({
                status: 'success',
                data: { documents },
            });
        }
        catch (error) {
            next(error);
        }
    };
    serveDocument = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const doc = await db_1.default.document.findFirst({
                where: { id, userId },
            });
            if (!doc) {
                throw new errors_1.NotFoundError('Document not found');
            }
            const absolutePath = path_1.default.resolve(config_1.default.UPLOAD_DIR, doc.filePath);
            // Ensure the resolved path remains inside the configured upload directory (prevent directory traversal)
            const uploadFolderRoot = path_1.default.resolve(config_1.default.UPLOAD_DIR);
            if (!absolutePath.startsWith(uploadFolderRoot)) {
                throw new errors_1.ForbiddenError('Path traversal detected');
            }
            if (!fs_1.default.existsSync(absolutePath)) {
                throw new errors_1.NotFoundError('Physical file not found on disk');
            }
            res.setHeader('Content-Type', doc.mimeType);
            if (req.query.download === 'true') {
                res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(doc.fileName)}"`);
            }
            else {
                res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(doc.fileName)}"`);
            }
            return res.sendFile(absolutePath);
        }
        catch (error) {
            next(error);
        }
    };
    deleteDocument = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const doc = await db_1.default.document.findFirst({
                where: { id, userId },
            });
            if (!doc) {
                throw new errors_1.NotFoundError('Document not found');
            }
            const absolutePath = path_1.default.resolve(config_1.default.UPLOAD_DIR, doc.filePath);
            if (fs_1.default.existsSync(absolutePath)) {
                fs_1.default.unlinkSync(absolutePath);
            }
            await db_1.default.document.delete({ where: { id } });
            return res.status(200).json({
                status: 'success',
                message: 'Document deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    replaceDocument = async (req, res, next) => {
        try {
            const userId = req.user.id;
            if (!req.file) {
                throw new errors_1.BadRequestError('No file uploaded or file rejected by security filters');
            }
            const { id } = req.params;
            const doc = await db_1.default.document.findFirst({
                where: { id, userId },
            });
            if (!doc) {
                fs_1.default.unlinkSync(req.file.path);
                throw new errors_1.NotFoundError('Document not found');
            }
            // Delete old file
            const oldAbsolutePath = path_1.default.resolve(config_1.default.UPLOAD_DIR, doc.filePath);
            if (fs_1.default.existsSync(oldAbsolutePath)) {
                fs_1.default.unlinkSync(oldAbsolutePath);
            }
            // Update document record
            const updated = await db_1.default.document.update({
                where: { id },
                data: {
                    fileName: req.file.originalname,
                    filePath: req.file.filename,
                    fileSize: req.file.size,
                    mimeType: req.file.mimetype,
                    uploadedAt: new Date(),
                },
            });
            await db_1.default.activityLog.create({
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
        }
        catch (error) {
            next(error);
        }
    };
}
exports.DocumentController = DocumentController;
exports.documentController = new DocumentController();
exports.default = exports.documentController;
