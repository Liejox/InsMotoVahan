import { Response, NextFunction } from 'express';
import prisma from '../config/db';
import { AuthenticatedRequest } from '../middlewares/auth';

export class ReportController {
  getRenewalReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const now = new Date();
      const currentYear = now.getFullYear();
      
      const startOfYear = new Date(currentYear, 0, 1);
      const endOfYear = new Date(currentYear, 11, 31, 23, 59, 59, 999);

      // Fetch all policies expiring this calendar year for this user
      const policiesExpiringThisYear = await prisma.insurancePolicy.findMany({
        where: {
          userId,
          expiryDate: {
            gte: startOfYear,
            lte: endOfYear,
          },
        },
        select: {
          expiryDate: true,
          premiumAmount: true,
        },
      });

      // Bucket them by month
      const monthlyRenewals = Array.from({ length: 12 }, (_, i) => ({
        month: new Date(currentYear, i).toLocaleString('default', { month: 'short' }),
        count: 0,
        volume: 0,
      }));

      policiesExpiringThisYear.forEach((policy) => {
        const month = new Date(policy.expiryDate).getMonth();
        monthlyRenewals[month].count++;
        monthlyRenewals[month].volume += Number(policy.premiumAmount);
      });

      return res.status(200).json({
        status: 'success',
        data: { monthlyRenewals },
      });
    } catch (error) {
      next(error);
    }
  };

  getCompanyDistribution = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const companyPolicies = await prisma.insurancePolicy.groupBy({
        by: ['companyId'],
        where: { userId },
        _count: { id: true },
        _sum: { premiumAmount: true, commissionAmount: true },
      });

      const companies = await prisma.insuranceCompany.findMany();
      const companyMap = new Map(companies.map((c) => [c.id, c.name]));

      const data = companyPolicies.map((cp) => ({
        companyName: companyMap.get(cp.companyId) || 'Unknown Company',
        policyCount: cp._count.id,
        totalPremium: cp._sum.premiumAmount ? Number(cp._sum.premiumAmount) : 0,
        totalCommission: cp._sum.commissionAmount ? Number(cp._sum.commissionAmount) : 0,
      }));

      return res.status(200).json({
        status: 'success',
        data,
      });
    } catch (error) {
      next(error);
    }
  };

  getVehicleStatistics = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const stats = await prisma.vehicle.groupBy({
        by: ['vehicleType'],
        where: { userId },
        _count: { id: true },
      });

      return res.status(200).json({
        status: 'success',
        data: stats.map((s) => ({
          vehicleType: s.vehicleType,
          count: s._count.id,
        })),
      });
    } catch (error) {
      next(error);
    }
  };

  getFinancialReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const now = new Date();
      // Fetch policies starting within last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setDate(1);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const policies = await prisma.insurancePolicy.findMany({
        where: {
          userId,
          startDate: { gte: sixMonthsAgo },
        },
        select: {
          startDate: true,
          premiumAmount: true,
          commissionAmount: true,
        },
      });

      // Prepare empty buckets
      const data: { [key: string]: { month: string; revenue: number; commission: number; sortKey: string } } = {};
      
      for (let i = 0; i < 6; i++) {
        const d = new Date();
        d.setMonth(now.getMonth() - i);
        const label = d.toLocaleString('default', { month: 'short', year: '2-digit' });
        const sortKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        data[label] = { month: label, revenue: 0, commission: 0, sortKey };
      }

      // Populate buckets
      policies.forEach((p) => {
        const label = new Date(p.startDate).toLocaleString('default', { month: 'short', year: '2-digit' });
        if (data[label]) {
          data[label].revenue += Number(p.premiumAmount);
          data[label].commission += Number(p.commissionAmount);
        }
      });

      // Sort chronologically
      const sortedFinancials = Object.values(data).sort((a, b) => a.sortKey.localeCompare(b.sortKey));

      return res.status(200).json({
        status: 'success',
        data: sortedFinancials,
      });
    } catch (error) {
      next(error);
    }
  };
}

export const reportController = new ReportController();
export default reportController;
