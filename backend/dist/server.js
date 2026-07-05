"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const config_1 = __importDefault(require("./config"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const apiRoutes_1 = __importDefault(require("./routes/apiRoutes"));
const error_1 = require("./middlewares/error");
const logger_1 = require("./utils/logger");
const rateLimiter_1 = require("./middlewares/rateLimiter");
const app = (0, express_1.default)();
// 1. Security Middlewares
app.use((0, helmet_1.default)({
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
// CORS Configuration
const allowedOrigins = config_1.default.ALLOWED_ORIGINS.split(',');
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
}));
// Apply API Rate Limiter
app.use('/api', rateLimiter_1.apiLimiter);
// 2. Request Parsing Middlewares
app.use((0, cookie_parser_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// 3. Logger Middleware
const morganFormat = config_1.default.NODE_ENV === 'production' ? 'combined' : 'dev';
app.use((0, morgan_1.default)(morganFormat, {
    stream: {
        write: (message) => logger_1.logger.http(message.trim()),
    },
}));
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'healthy', timestamp: new Date() });
});
// 4. API Routes
app.use('/api/auth', authRoutes_1.default);
app.use('/api', apiRoutes_1.default);
// Serve the hero profile image statically
app.use('/hero-image', express_1.default.static(config_1.default.HERO_IMAGE_DIR));
// 5. Global Error Handling
app.use(error_1.errorHandler);
// Start server
const PORT = config_1.default.PORT;
app.listen(PORT, () => {
    logger_1.logger.info(`🚀 CRM Server running in ${config_1.default.NODE_ENV} mode on port ${PORT}`);
});
