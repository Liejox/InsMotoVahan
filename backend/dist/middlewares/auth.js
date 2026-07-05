"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.authenticate = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const errors_1 = require("../utils/errors");
const authenticate = (req, res, next) => {
    let token = '';
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
    }
    else if (req.query.token) {
        token = req.query.token;
    }
    if (!token) {
        return next(new errors_1.UserUnauthorizedError('Access token is missing or invalid'));
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.default.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        next(new errors_1.UserUnauthorizedError('Access token is expired or invalid'));
    }
};
exports.authenticate = authenticate;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new errors_1.UserUnauthorizedError('Authentication required'));
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new errors_1.ForbiddenError('You do not have permission to access this resource'));
        }
        next();
    };
};
exports.requireRole = requireRole;
