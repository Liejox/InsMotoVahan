"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const authService_1 = require("../services/authService");
class AuthController {
    login = async (req, res, next) => {
        try {
            const { email, password } = req.body;
            const result = await authService_1.authService.login(email, password);
            // Set refresh token in HttpOnly cookie for production security
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            return res.status(200).json({
                status: 'success',
                data: {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    user: result.user,
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
    refresh = async (req, res, next) => {
        try {
            const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
            const result = await authService_1.authService.refresh(refreshToken);
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.status(200).json({
                status: 'success',
                data: {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    user: result.user,
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
    logout = async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (userId) {
                await authService_1.authService.logout(userId);
            }
            res.clearCookie('refreshToken');
            return res.status(200).json({
                status: 'success',
                message: 'Logged out successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    me = async (req, res, next) => {
        try {
            const userId = req.user?.id;
            if (!userId) {
                return res.status(401).json({ status: 'error', message: 'Unauthorized' });
            }
            const user = await authService_1.authService.getProfile(userId);
            return res.status(200).json({
                status: 'success',
                data: { user },
            });
        }
        catch (error) {
            next(error);
        }
    };
    register = async (req, res, next) => {
        try {
            const { fullName, email, password } = req.body;
            const result = await authService_1.authService.register(fullName, email, password);
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000,
            });
            return res.status(201).json({
                status: 'success',
                data: {
                    accessToken: result.accessToken,
                    refreshToken: result.refreshToken,
                    user: result.user,
                },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
exports.default = exports.authController;
