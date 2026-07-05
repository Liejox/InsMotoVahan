"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.config = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const zod_1 = require("zod");
// Load environment variables
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
const envSchema = zod_1.z.object({
    PORT: zod_1.z.string().transform((v) => parseInt(v, 10)).default('5000'),
    NODE_ENV: zod_1.z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: zod_1.z.string().min(1, 'DATABASE_URL is required'),
    JWT_SECRET: zod_1.z.string().min(8, 'JWT_SECRET must be at least 8 characters'),
    JWT_REFRESH_SECRET: zod_1.z.string().min(8, 'JWT_REFRESH_SECRET must be at least 8 characters'),
    JWT_ACCESS_EXPIRY: zod_1.z.string().default('15m'),
    JWT_REFRESH_EXPIRY: zod_1.z.string().default('7d'),
    ALLOWED_ORIGINS: zod_1.z.string().default('http://localhost:5173'),
    UPLOAD_DIR: zod_1.z.string().default('./uploads'),
    HERO_IMAGE_DIR: zod_1.z.string().default('C:\\Lj\\Imageee'),
});
const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
    console.error('❌ Invalid environment configuration:', parsed.error.format());
    process.exit(1);
}
exports.config = parsed.data;
exports.default = exports.config;
