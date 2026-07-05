"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = void 0;
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const zod_1 = require("zod");
const errorHandler = (err, req, res, _next) => {
    // 1. Zod Validation Error
    if (err instanceof zod_1.ZodError) {
        const errors = err.errors.map((e) => ({
            field: e.path.join('.'),
            message: e.message,
        }));
        logger_1.logger.warn(`Validation Error on ${req.method} ${req.originalUrl}: ${JSON.stringify(errors)}`);
        return res.status(400).json({
            status: 'error',
            message: 'Validation failed',
            errors,
        });
    }
    // 2. Custom App Error
    if (err instanceof errors_1.AppError) {
        logger_1.logger.warn(`Operational Error [${err.statusCode}] on ${req.method} ${req.originalUrl}: ${err.message}`);
        return res.status(err.statusCode).json({
            status: 'error',
            message: err.message,
        });
    }
    // 3. JWT specific errors
    if (err.name === 'JsonWebTokenError') {
        return res.status(401).json({
            status: 'error',
            message: 'Invalid authorization token',
        });
    }
    if (err.name === 'TokenExpiredError') {
        return res.status(401).json({
            status: 'error',
            message: 'Authorization token expired',
        });
    }
    // 4. Fallback Internal Server Error
    logger_1.logger.error(`Unhandled Exception on ${req.method} ${req.originalUrl}:`, err);
    return res.status(500).json({
        status: 'error',
        message: process.env.NODE_ENV === 'production' ? 'Internal server error' : err.message,
    });
};
exports.errorHandler = errorHandler;
