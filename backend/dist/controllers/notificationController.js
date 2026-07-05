"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const db_1 = __importDefault(require("../config/db"));
const errors_1 = require("../utils/errors");
class NotificationController {
    getNotifications = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const notifications = await db_1.default.notification.findMany({
                where: { userId },
                orderBy: { createdAt: 'desc' },
                take: 50,
            });
            return res.status(200).json({
                status: 'success',
                data: { notifications },
            });
        }
        catch (error) {
            next(error);
        }
    };
    markAsRead = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const notification = await db_1.default.notification.findFirst({
                where: { id, userId },
            });
            if (!notification) {
                throw new errors_1.NotFoundError('Notification not found');
            }
            const updated = await db_1.default.notification.update({
                where: { id },
                data: { read: true },
            });
            return res.status(200).json({
                status: 'success',
                data: { notification: updated },
            });
        }
        catch (error) {
            next(error);
        }
    };
    markAllAsRead = async (req, res, next) => {
        try {
            const userId = req.user.id;
            await db_1.default.notification.updateMany({
                where: { read: false, userId },
                data: { read: true },
            });
            return res.status(200).json({
                status: 'success',
                message: 'All notifications marked as read',
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
exports.default = exports.notificationController;
