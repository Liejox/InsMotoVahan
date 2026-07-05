"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLimiter = exports.loginLimiter = exports.apiLimiter = void 0;
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const config_1 = __importDefault(require("../config"));
const logger_1 = require("../utils/logger");
const isDev = config_1.default.NODE_ENV === 'development';
// 1. General API rate limiter
exports.apiLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 10000 : 100, // 10000 requests in dev, 100 in prod
    message: { status: 'error', message: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger_1.logger.warn(`Rate limit exceeded for IP ${req.ip} on API route ${req.originalUrl}`);
        res.status(options.statusCode).send(options.message);
    }
});
// 2. Login rate limiter
exports.loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: isDev ? 1000 : 10, // 1000 attempts in dev, 10 in prod
    message: { status: 'error', message: 'Too many login attempts. Please try again after 15 minutes.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger_1.logger.warn(`Rate limit exceeded for IP ${req.ip} on login attempts`);
        res.status(options.statusCode).send(options.message);
    }
});
// 3. Register rate limiter
exports.registerLimiter = (0, express_rate_limit_1.default)({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: isDev ? 1000 : 5, // 1000 attempts in dev, 5 in prod
    message: { status: 'error', message: 'Too many accounts created from this IP. Please try again after an hour.' },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res, next, options) => {
        logger_1.logger.warn(`Rate limit exceeded for IP ${req.ip} on registration attempts`);
        res.status(options.statusCode).send(options.message);
    }
});
