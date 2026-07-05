import { Response, NextFunction } from 'express';
import { policyService } from '../services/policyService';
import { AuthenticatedRequest } from '../middlewares/auth';

export class PolicyController {
  createPolicy = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const policy = await policyService.createPolicy(userId, req.body);
      return res.status(201).json({
        status: 'success',
        data: { policy },
      });
    } catch (error) {
      next(error);
    }
  };

  renewPolicy = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const policy = await policyService.renewPolicy(userId, req.body);
      return res.status(201).json({
        status: 'success',
        data: { policy },
      });
    } catch (error) {
      next(error);
    }
  };

  getDashboard = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const nowString = req.query.now as string | undefined;
      const stats = await policyService.getDashboard(userId, nowString);
      return res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  };

  getUpcomingRenewals = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const range = req.query.range as string || '30days';
      const nowString = req.query.now as string | undefined;
      const policies = await policyService.getUpcomingRenewals(userId, { range, nowString });
      return res.status(200).json({
        status: 'success',
        data: { policies },
      });
    } catch (error) {
      next(error);
    }
  };

  globalSearch = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const query = req.query.query as string || '';
      const result = await policyService.globalSearch(userId, query);
      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanies = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const companies = await policyService.getCompanies();
      return res.status(200).json({
        status: 'success',
        data: { companies },
      });
    } catch (error) {
      next(error);
    }
  };

  getStatuses = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const statuses = await policyService.getStatuses();
      return res.status(200).json({
        status: 'success',
        data: { statuses },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const policyController = new PolicyController();
export default policyController;
