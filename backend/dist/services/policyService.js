"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyService = exports.PolicyService = void 0;
const policyRepository_1 = require("../repositories/policyRepository");
const customerRepository_1 = require("../repositories/customerRepository");
const errors_1 = require("../utils/errors");
const db_1 = __importDefault(require("../config/db"));
class PolicyService {
    async getStatusIdByName(name) {
        const status = await db_1.default.policyStatus.findUnique({ where: { name } });
        if (!status) {
            throw new errors_1.NotFoundError(`Policy status "${name}" not found. Run seed script.`);
        }
        return status.id;
    }
    async getCompanies() {
        return policyRepository_1.policyRepository.getInsuranceCompanies();
    }
    async getStatuses() {
        return policyRepository_1.policyRepository.getPolicyStatuses();
    }
    async createPolicy(userId, data) {
        // 1. Verify vehicle exists and belongs to user
        const vehicle = await customerRepository_1.customerRepository.findVehicleById(userId, data.vehicleId);
        if (!vehicle) {
            throw new errors_1.NotFoundError('Vehicle not found');
        }
        // 2. Validate duplicate policy number for this user
        const existing = await policyRepository_1.policyRepository.findPolicyByNumber(userId, data.policyNumber);
        if (existing) {
            throw new errors_1.ConflictError(`Policy number ${data.policyNumber} already exists`);
        }
        // 3. Dates validation
        const start = new Date(data.startDate);
        const expiry = new Date(data.expiryDate);
        if (expiry <= start) {
            throw new errors_1.BadRequestError('Expiry date must be after start date');
        }
        // 4. Calculate commission
        const commissionAmount = data.premiumAmount * (data.commissionRate / 100);
        // 5. Get ACTIVE status
        const activeStatusId = await this.getStatusIdByName('ACTIVE');
        const policy = await policyRepository_1.policyRepository.createPolicy(userId, {
            vehicleId: data.vehicleId,
            companyId: data.companyId,
            policyNumber: data.policyNumber,
            startDate: start,
            expiryDate: expiry,
            premiumAmount: data.premiumAmount,
            idv: data.idv,
            ncb: data.ncb,
            commissionRate: data.commissionRate,
            commissionAmount,
            statusId: activeStatusId,
        });
        // 6. Generate reminders
        await this.generateRemindersForPolicy(userId, policy.id, expiry);
        // 7. Create event notification
        await db_1.default.notification.create({
            data: {
                userId,
                title: 'New Policy Added',
                message: `Policy ${policy.policyNumber} has been added for vehicle ${vehicle.vehicleNumber} (${vehicle.brand} ${vehicle.model}).`,
                type: 'NEW_POLICY',
                relatedId: policy.id,
            },
        });
        await customerRepository_1.customerRepository.logActivity(userId, 'ADD_POLICY', {
            customerId: vehicle.customerId,
            vehicleId: vehicle.id,
            policyId: policy.id,
            policyNumber: policy.policyNumber,
        });
        return policy;
    }
    async renewPolicy(userId, data) {
        const oldPolicy = await policyRepository_1.policyRepository.findPolicyById(userId, data.oldPolicyId);
        if (!oldPolicy) {
            throw new errors_1.NotFoundError('Original policy not found');
        }
        // Validate duplicate policy number for this user
        const existing = await policyRepository_1.policyRepository.findPolicyByNumber(userId, data.policyNumber);
        if (existing) {
            throw new errors_1.ConflictError(`Policy number ${data.policyNumber} already exists`);
        }
        const start = new Date(data.startDate);
        const expiry = new Date(data.expiryDate);
        if (expiry <= start) {
            throw new errors_1.BadRequestError('Expiry date must be after start date');
        }
        const commissionAmount = data.premiumAmount * (data.commissionRate / 100);
        const activeStatusId = await this.getStatusIdByName('ACTIVE');
        const expiredStatusId = await this.getStatusIdByName('EXPIRED');
        const newPolicy = await policyRepository_1.policyRepository.renewPolicy(userId, {
            oldPolicyId: data.oldPolicyId,
            companyId: data.companyId,
            policyNumber: data.policyNumber,
            startDate: start,
            expiryDate: expiry,
            premiumAmount: data.premiumAmount,
            idv: data.idv,
            ncb: data.ncb,
            commissionRate: data.commissionRate,
            commissionAmount,
            statusId: activeStatusId,
            expiredStatusId,
        });
        // Generate reminders
        await this.generateRemindersForPolicy(userId, newPolicy.id, expiry);
        // Create event notification
        await db_1.default.notification.create({
            data: {
                userId,
                title: 'Policy Renewed',
                message: `Policy ${oldPolicy.policyNumber} has been successfully renewed to ${newPolicy.policyNumber}.`,
                type: 'NEW_POLICY',
                relatedId: newPolicy.id,
            },
        });
        await customerRepository_1.customerRepository.logActivity(userId, 'RENEW_POLICY', {
            customerId: oldPolicy.vehicle.customerId,
            vehicleId: oldPolicy.vehicleId,
            oldPolicyId: oldPolicy.id,
            newPolicyId: newPolicy.id,
            oldPolicyNumber: oldPolicy.policyNumber,
            newPolicyNumber: newPolicy.policyNumber,
        });
        return newPolicy;
    }
    async getDashboard(userId, nowString) {
        const now = nowString ? new Date(nowString) : new Date();
        return policyRepository_1.policyRepository.getDashboardStats(userId, now);
    }
    async getUpcomingRenewals(userId, params) {
        const now = params.nowString ? new Date(params.nowString) : new Date();
        let days = 30;
        if (params.range === 'today')
            days = 0;
        else if (params.range === 'tomorrow')
            days = 1;
        else if (params.range === '7days')
            days = 7;
        else if (params.range === '15days')
            days = 15;
        else if (params.range === '30days')
            days = 30;
        if (params.range === 'expired') {
            return policyRepository_1.policyRepository.getExpiredPoliciesList(userId, now);
        }
        return policyRepository_1.policyRepository.getUpcomingPoliciesList(userId, now, days);
    }
    async globalSearch(userId, query) {
        return policyRepository_1.policyRepository.searchGlobal(userId, query);
    }
    // Dynamic automatic reminder calculation
    async generateRemindersForPolicy(userId, policyId, expiryDate) {
        // Reminder rules: 30, 15, 7, 3, 1 day before, and expired
        const intervals = [
            { type: '30_DAYS', days: 30 },
            { type: '15_DAYS', days: 15 },
            { type: '7_DAYS', days: 7 },
            { type: '3_DAYS', days: 3 },
            { type: '1_DAY', days: 1 },
            { type: 'EXPIRED', days: 0 },
        ];
        const remindersData = intervals.map((interval) => {
            const dueDate = new Date(expiryDate);
            dueDate.setDate(dueDate.getDate() - interval.days);
            dueDate.setHours(9, 0, 0, 0); // Reminders set for 9:00 AM of that day
            return {
                userId,
                policyId,
                reminderType: interval.type,
                dueDate,
                status: 'PENDING',
            };
        });
        // Remove any existing reminders and create fresh ones
        await db_1.default.reminder.deleteMany({
            where: { policyId },
        });
        for (const r of remindersData) {
            await db_1.default.reminder.create({
                data: r,
            });
        }
    }
}
exports.PolicyService = PolicyService;
exports.policyService = new PolicyService();
exports.default = exports.policyService;
