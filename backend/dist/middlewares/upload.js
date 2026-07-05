"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const errors_1 = require("../utils/errors");
const config_1 = __importDefault(require("../config"));
// Ensure upload directory exists
const uploadDir = config_1.default.UPLOAD_DIR;
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    },
});
const fileFilter = (req, file, cb) => {
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png'];
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const mime = file.mimetype;
    if (allowedExtensions.includes(ext) && allowedMimeTypes.includes(mime)) {
        cb(null, true);
    }
    else {
        cb(new errors_1.BadRequestError('Only PDF, JPG, JPEG, and PNG files are allowed'));
    }
};
exports.upload = (0, multer_1.default)({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});
