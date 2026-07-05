"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyRepository = exports.PolicyRepository = void 0;
const db_1 = __importDefault(require("../config/db"));
class PolicyRepository {
    async getInsuranceCompanies() {
        return db_1.default.insuranceCompany.findMany({
            orderBy: { name: 'asc' },
        });
    }
    async getPolicyStatuses() {
        return db_1.default.policyStatus.findMany();
    }
    async findPolicyByNumber(userId, policyNumber) {
        return db_1.default.insurancePolicy.findFirst({
            where: { policyNumber, userId },
            include: { vehicle: { include: { customer: true } } },
        });
    }
    async findPolicyById(userId, id) {
        return db_1.default.insurancePolicy.findFirst({
            where: { id, userId },
            include: {
                vehicle: { include: { customer: true } },
                company: true,
                status: true,
            },
        });
    }
    async createPolicy(userId, data) {
        return db_1.default.$transaction(async (tx) => {
            // Verify vehicle ownership
            const vehicle = await tx.vehicle.findFirst({
                where: { id: data.vehicleId, userId },
            });
            if (!vehicle)
                throw new Error('Vehicle not found or access denied');
            const policy = await tx.insurancePolicy.create({
                data: {
                    userId,
                    vehicleId: data.vehicleId,
                    companyId: data.companyId,
                    policyNumber: data.policyNumber,
                    startDate: data.startDate,
                    expiryDate: data.expiryDate,
                    premiumAmount: data.premiumAmount,
                    idv: data.idv,
                    ncb: data.ncb,
                    commissionRate: data.commissionRate,
                    commissionAmount: data.commissionAmount,
                    statusId: data.statusId,
                },
            });
            await tx.insuranceHistory.create({
                data: {
                    userId,
                    vehicleId: data.vehicleId,
                    policyId: policy.id,
                    action: 'CREATED',
                    notes: `Policy issued with number ${data.policyNumber} through company.`,
                },
            });
            return policy;
        });
    }
    async renewPolicy(userId, params) {
        return db_1.default.$transaction(async (tx) => {
            // 1. Get old policy details and verify ownership
            const oldPolicy = await tx.insurancePolicy.findFirst({
                where: { id: params.oldPolicyId, userId },
            });
            if (!oldPolicy)
                throw new Error('Old policy not found or access denied');
            // 2. Mark old policy as EXPIRED
            await tx.insurancePolicy.update({
                where: { id: params.oldPolicyId },
                data: { statusId: params.expiredStatusId },
            });
            // 3. Create new policy
            const newPolicy = await tx.insurancePolicy.create({
                data: {
                    userId,
                    vehicleId: oldPolicy.vehicleId,
                    companyId: params.companyId,
                    policyNumber: params.policyNumber,
                    startDate: params.startDate,
                    expiryDate: params.expiryDate,
                    premiumAmount: params.premiumAmount,
                    idv: params.idv,
                    ncb: params.ncb,
                    commissionRate: params.commissionRate,
                    commissionAmount: params.commissionAmount,
                    statusId: params.statusId,
                },
            });
            // 4. Log renewal relation
            await tx.renewalLog.create({
                data: {
                    oldPolicyId: oldPolicy.id,
                    newPolicyId: newPolicy.id,
                    renewedByUserId: userId,
                    notes: `Policy renewed from ${oldPolicy.policyNumber} to ${newPolicy.policyNumber}`,
                },
            });
            // 5. Add to vehicle history
            await tx.insuranceHistory.create({
                data: {
                    userId,
                    vehicleId: oldPolicy.vehicleId,
                    policyId: newPolicy.id,
                    action: 'RENEWED',
                    notes: `Policy renewed. Previous policy was ${oldPolicy.policyNumber}.`,
                },
            });
            return newPolicy;
        });
    }
    async getDashboardStats(userId, now) {
        // Today
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date(now);
        endOfToday.setHours(23, 59, 59, 999);
        // Tomorrow
        const startOfTomorrow = new Date(startOfToday);
        startOfTomorrow.setDate(startOfTomorrow.getDate() + 1);
        const endOfTomorrow = new Date(endOfToday);
        endOfTomorrow.setDate(endOfTomorrow.getDate() + 1);
        // Upcoming bounds
        const endOf7Days = new Date(endOfToday);
        endOf7Days.setDate(endOf7Days.getDate() + 7);
        const endOf15Days = new Date(endOfToday);
        endOf15Days.setDate(endOf15Days.getDate() + 15);
        const endOf30Days = new Date(endOfToday);
        endOf30Days.setDate(endOf30Days.getDate() + 30);
        // Current month bounds for revenue/commission
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        // Fetch ACTIVE status ID
        const activeStatus = await db_1.default.policyStatus.findUnique({ where: { name: 'ACTIVE' } });
        const expiredStatus = await db_1.default.policyStatus.findUnique({ where: { name: 'EXPIRED' } });
        const activeStatusId = activeStatus?.id || '';
        const expiredStatusId = expiredStatus?.id || '';
        // Queries isolated by userId
        const [todayRenewalsCount, tomorrowRenewalsCount, next7DaysRenewalsCount, next15DaysRenewalsCount, next30DaysRenewalsCount, expiredPoliciesCount, totalCustomers, totalVehicles, activePolicies, financials,] = await Promise.all([
            // Today's renewals
            db_1.default.insurancePolicy.count({
                where: { userId, expiryDate: { gte: startOfToday, lte: endOfToday }, oldRenewals: { none: {} } },
            }),
            // Tomorrow's renewals
            db_1.default.insurancePolicy.count({
                where: { userId, expiryDate: { gte: startOfTomorrow, lte: endOfTomorrow }, oldRenewals: { none: {} } },
            }),
            // Next 7 days
            db_1.default.insurancePolicy.count({
                where: { userId, expiryDate: { gte: startOfToday, lte: endOf7Days }, oldRenewals: { none: {} } },
            }),
            // Next 15 days
            db_1.default.insurancePolicy.count({
                where: { userId, expiryDate: { gte: startOfToday, lte: endOf15Days }, oldRenewals: { none: {} } },
            }),
            // Next 30 days
            db_1.default.insurancePolicy.count({
                where: { userId, expiryDate: { gte: startOfToday, lte: endOf30Days }, oldRenewals: { none: {} } },
            }),
            // Expired policies
            db_1.default.insurancePolicy.count({
                where: {
                    userId,
                    oldRenewals: { none: {} },
                    OR: [
                        { statusId: expiredStatusId },
                        { expiryDate: { lt: startOfToday } },
                    ],
                },
            }),
            // Totals
            db_1.default.customer.count({ where: { userId } }),
            db_1.default.vehicle.count({ where: { userId } }),
            db_1.default.insurancePolicy.count({
                where: { userId, statusId: activeStatusId },
            }),
            // Financials (policies created/effective this month)
            db_1.default.insurancePolicy.aggregate({
                where: {
                    userId,
                    startDate: { gte: startOfMonth, lte: endOfMonth },
                },
                _sum: {
                    premiumAmount: true,
                    commissionAmount: true,
                },
            }),
        ]);
        return {
            todayRenewalsCount,
            tomorrowRenewalsCount,
            next7DaysRenewalsCount,
            next15DaysRenewalsCount,
            next30DaysRenewalsCount,
            expiredPoliciesCount,
            totalCustomers,
            totalVehicles,
            activePolicies,
            monthlyRevenue: financials._sum.premiumAmount ? Number(financials._sum.premiumAmount) : 0,
            monthlyCommission: financials._sum.commissionAmount ? Number(financials._sum.commissionAmount) : 0,
        };
    }
    async getUpcomingPoliciesList(userId, now, days) {
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const endOfPeriod = new Date(startOfToday);
        endOfPeriod.setDate(endOfPeriod.getDate() + days);
        endOfPeriod.setHours(23, 59, 59, 999);
        return db_1.default.insurancePolicy.findMany({
            where: {
                userId,
                oldRenewals: { none: {} },
                expiryDate: {
                    gte: startOfToday,
                    lte: endOfPeriod,
                },
            },
            include: {
                vehicle: { include: { customer: true } },
                company: true,
                status: true,
            },
            orderBy: { expiryDate: 'asc' },
        });
    }
    async getExpiredPoliciesList(userId, now) {
        const startOfToday = new Date(now);
        startOfToday.setHours(0, 0, 0, 0);
        const expiredStatus = await db_1.default.policyStatus.findUnique({ where: { name: 'EXPIRED' } });
        const expiredStatusId = expiredStatus?.id || '';
        return db_1.default.insurancePolicy.findMany({
            where: {
                userId,
                oldRenewals: { none: {} },
                OR: [
                    { statusId: expiredStatusId },
                    { expiryDate: { lt: startOfToday } },
                ],
            },
            include: {
                vehicle: { include: { customer: true } },
                company: true,
                status: true,
            },
            orderBy: { expiryDate: 'desc' },
        });
    }
    async searchGlobal(userId, queryStr) {
        const clean = queryStr.trim();
        if (!clean)
            return { customers: [], vehicles: [], policies: [] };
        const formattedVehicle = clean.toUpperCase().replace(/\s/g, '');
        const [customers, vehicles, policies] = await Promise.all([
            // 1. Search Customers by name/phone
            db_1.default.customer.findMany({
                where: {
                    userId,
                    OR: [
                        { fullName: { contains: clean } },
                        { mobileNumber: { contains: clean } },
                    ],
                },
                include: {
                    vehicles: {
                        include: {
                            policies: {
                                include: {
                                    status: true,
                                },
                            },
                        },
                    },
                },
                take: 5,
                orderBy: { fullName: 'asc' },
            }),
            // 2. Search Vehicles by plate
            db_1.default.vehicle.findMany({
                where: {
                    userId,
                    vehicleNumber: { contains: formattedVehicle },
                },
                include: {
                    customer: true,
                    policies: {
                        include: {
                            status: true,
                        },
                    },
                },
                take: 5,
            }),
            // 3. Search Policies by policy number
            db_1.default.insurancePolicy.findMany({
                where: {
                    userId,
                    policyNumber: { contains: clean },
                },
                include: {
                    vehicle: { include: { customer: true } },
                    company: true,
                    status: true,
                },
                take: 5,
            }),
        ]);
        const customersWithStatus = customers.map((c) => {
            const hasActive = c.vehicles.some((v) => v.policies.some((p) => p.status.name === 'ACTIVE'));
            return {
                id: c.id,
                fullName: c.fullName,
                mobileNumber: c.mobileNumber,
                policyStatus: hasActive ? 'Active' : 'Expired',
            };
        });
        const vehiclesWithStatus = vehicles.map((v) => {
            const hasActive = v.policies.some((p) => p.status.name === 'ACTIVE');
            return {
                id: v.id,
                customerId: v.customerId,
                vehicleNumber: v.vehicleNumber,
                brand: v.brand,
                model: v.model,
                customer: v.customer,
                policyStatus: hasActive ? 'Active' : 'Expired',
            };
        });
        const policiesWithStatus = policies.map((p) => {
            return {
                id: p.id,
                policyNumber: p.policyNumber,
                vehicle: p.vehicle,
                company: p.company,
                policyStatus: p.status.name === 'ACTIVE' ? 'Active' : 'Expired',
            };
        });
        return { customers: customersWithStatus, vehicles: vehiclesWithStatus, policies: policiesWithStatus };
    }
}
exports.PolicyRepository = PolicyRepository;
exports.policyRepository = new PolicyRepository();
exports.default = exports.policyRepository;
