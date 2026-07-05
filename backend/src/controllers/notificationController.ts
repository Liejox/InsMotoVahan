import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';
import { NotFoundError } from '../utils/errors';

export class NotificationController {
  getNotifications = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return res.status(200).json({
        status: 'success',
        data: { notifications },
      });
    } catch (error) {
      next(error);
    }
  };

  markAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const notification = await prisma.notification.findFirst({
        where: { id, userId },
      });

      if (!notification) {
        throw new NotFoundError('Notification not found');
      }

      const updated = await prisma.notification.update({
        where: { id },
        data: { read: true },
      });

      return res.status(200).json({
        status: 'success',
        data: { notification: updated },
      });
    } catch (error) {
      next(error);
    }
  };

  markAllAsRead = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      await prisma.notification.updateMany({
        where: { read: false, userId },
        data: { read: true },
      });

      return res.status(200).json({
        status: 'success',
        message: 'All notifications marked as read',
      });
    } catch (error) {
      next(error);
    }
  };
}

export const notificationController = new NotificationController();
export default notificationController;
