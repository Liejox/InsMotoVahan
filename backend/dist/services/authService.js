"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authService = exports.AuthService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const userRepository_1 = require("../repositories/userRepository");
const errors_1 = require("../utils/errors");
const db_1 = __importDefault(require("../config/db"));
const logger_1 = require("../utils/logger");
class AuthService {
    generateAccessToken(user) {
        return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, config_1.default.JWT_SECRET, { expiresIn: config_1.default.JWT_ACCESS_EXPIRY });
    }
    generateRefreshToken(user) {
        return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, config_1.default.JWT_REFRESH_SECRET, { expiresIn: config_1.default.JWT_REFRESH_EXPIRY });
    }
    async login(email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const user = await userRepository_1.userRepository.findByEmail(normalizedEmail);
        if (!user) {
            logger_1.logger.warn(`Login failed: User with email "${normalizedEmail}" not found`);
            throw new errors_1.UserUnauthorizedError('Invalid email or password');
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            logger_1.logger.warn(`Login failed: Password mismatch for email "${normalizedEmail}"`);
            throw new errors_1.UserUnauthorizedError('Invalid email or password');
        }
        const roleName = user.role.name;
        const sessionUser = { id: user.id, email: user.email, role: roleName };
        const accessToken = this.generateAccessToken(sessionUser);
        const refreshToken = this.generateRefreshToken(sessionUser);
        await userRepository_1.userRepository.updateRefreshToken(user.id, refreshToken);
        logger_1.logger.info(`Login successful: User "${normalizedEmail}" logged in`);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: roleName,
            },
        };
    }
    async refresh(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, config_1.default.JWT_REFRESH_SECRET);
            const user = await userRepository_1.userRepository.findById(decoded.id);
            if (!user || user.refreshToken !== token) {
                throw new errors_1.UserUnauthorizedError('Invalid refresh token');
            }
            const roleName = user.role.name;
            const sessionUser = { id: user.id, email: user.email, role: roleName };
            const accessToken = this.generateAccessToken(sessionUser);
            const newRefreshToken = this.generateRefreshToken(sessionUser);
            await userRepository_1.userRepository.updateRefreshToken(user.id, newRefreshToken);
            return {
                accessToken,
                refreshToken: newRefreshToken,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.fullName,
                    role: roleName,
                },
            };
        }
        catch (error) {
            throw new errors_1.UserUnauthorizedError('Invalid or expired refresh token');
        }
    }
    async logout(userId) {
        await userRepository_1.userRepository.updateRefreshToken(userId, null);
        return { success: true };
    }
    async getProfile(userId) {
        const user = await userRepository_1.userRepository.findById(userId);
        if (!user) {
            throw new errors_1.BadRequestError('User not found');
        }
        return {
            id: user.id,
            email: user.email,
            fullName: user.fullName,
            role: user.role.name,
        };
    }
    async register(fullName, email, password) {
        const normalizedEmail = email.trim().toLowerCase();
        const existing = await userRepository_1.userRepository.findByEmail(normalizedEmail);
        if (existing) {
            logger_1.logger.warn(`Registration failed: User with email "${normalizedEmail}" already exists`);
            throw new errors_1.BadRequestError('User with this email already exists');
        }
        const passwordHash = await bcryptjs_1.default.hash(password, 10);
        let agentRole = await db_1.default.role.findUnique({ where: { name: 'AGENT' } });
        if (!agentRole) {
            agentRole = await db_1.default.role.create({ data: { name: 'AGENT' } });
        }
        const user = await userRepository_1.userRepository.createUser({
            email: normalizedEmail,
            fullName,
            passwordHash,
            roleId: agentRole.id,
        });
        const roleName = user.role.name;
        const sessionUser = { id: user.id, email: user.email, role: roleName };
        const accessToken = this.generateAccessToken(sessionUser);
        const refreshToken = this.generateRefreshToken(sessionUser);
        await userRepository_1.userRepository.updateRefreshToken(user.id, refreshToken);
        return {
            accessToken,
            refreshToken,
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: roleName,
            },
        };
    }
}
exports.AuthService = AuthService;
exports.authService = new AuthService();
