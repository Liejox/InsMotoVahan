import { policyRepository } from '../repositories/policyRepository';
import { customerRepository } from '../repositories/customerRepository';
import { ConflictError, NotFoundError, BadRequestError } from '../utils/errors';
import prisma from '../config/db';

export class PolicyService {
  private async getStatusIdByName(name: string) {
    const status = await prisma.policyStatus.findUnique({ where: { name } });
    if (!status) {
      throw new NotFoundError(`Policy status "${name}" not found. Run seed script.`);
    }
    return status.id;
  }

  async getCompanies() {
    return policyRepository.getInsuranceCompanies();
  }

  async getStatuses() {
    return policyRepository.getPolicyStatuses();
  }

  async createPolicy(
    userId: string,
    data: {
      vehicleId: string;
      companyId: string;
      policyNumber: string;
      startDate: string;
      expiryDate: string;
      premiumAmount: number;
      idv: number;
      ncb: number;
      commissionRate: number;
      policyPdfUrl?: string | null;
    }
  ) {
    // 1. Verify vehicle exists and belongs to user
    const vehicle = await customerRepository.findVehicleById(userId, data.vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found');
    }

    // 2. Validate duplicate policy number for this user
    const existing = await policyRepository.findPolicyByNumber(userId, data.policyNumber);
    if (existing) {
      throw new ConflictError(`Policy number ${data.policyNumber} already exists`);
    }

    // 3. Dates validation
    const start = new Date(data.startDate);
    const expiry = new Date(data.expiryDate);
    if (expiry <= start) {
      throw new BadRequestError('Expiry date must be after start date');
    }

    // 4. Calculate commission
    const commissionAmount = data.premiumAmount * (data.commissionRate / 100);

    // 5. Get ACTIVE status
    const activeStatusId = await this.getStatusIdByName('ACTIVE');

    const policy = await policyRepository.createPolicy(userId, {
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
    await prisma.notification.create({
      data: {
        userId,
        title: 'New Policy Added',
        message: `Policy ${policy.policyNumber} has been added for vehicle ${vehicle.vehicleNumber} (${vehicle.brand} ${vehicle.model}).`,
        type: 'NEW_POLICY',
        relatedId: policy.id,
      },
    });

    await customerRepository.logActivity(userId, 'ADD_POLICY', {
      customerId: vehicle.customerId,
      vehicleId: vehicle.id,
      policyId: policy.id,
      policyNumber: policy.policyNumber,
    });

    return policy;
  }

  async renewPolicy(
    userId: string,
    data: {
      oldPolicyId: string;
      companyId: string;
      policyNumber: string;
      startDate: string;
      expiryDate: string;
      premiumAmount: number;
      idv: number;
      ncb: number;
      commissionRate: number;
    }
  ) {
    const oldPolicy = await policyRepository.findPolicyById(userId, data.oldPolicyId);
    if (!oldPolicy) {
      throw new NotFoundError('Original policy not found');
    }

    // Validate duplicate policy number for this user
    const existing = await policyRepository.findPolicyByNumber(userId, data.policyNumber);
    if (existing) {
      throw new ConflictError(`Policy number ${data.policyNumber} already exists`);
    }

    const start = new Date(data.startDate);
    const expiry = new Date(data.expiryDate);
    if (expiry <= start) {
      throw new BadRequestError('Expiry date must be after start date');
    }

    const commissionAmount = data.premiumAmount * (data.commissionRate / 100);

    const activeStatusId = await this.getStatusIdByName('ACTIVE');
    const expiredStatusId = await this.getStatusIdByName('EXPIRED');

    const newPolicy = await policyRepository.renewPolicy(userId, {
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
    await prisma.notification.create({
      data: {
        userId,
        title: 'Policy Renewed',
        message: `Policy ${oldPolicy.policyNumber} has been successfully renewed to ${newPolicy.policyNumber}.`,
        type: 'NEW_POLICY',
        relatedId: newPolicy.id,
      },
    });

    await customerRepository.logActivity(userId, 'RENEW_POLICY', {
      customerId: oldPolicy.vehicle.customerId,
      vehicleId: oldPolicy.vehicleId,
      oldPolicyId: oldPolicy.id,
      newPolicyId: newPolicy.id,
      oldPolicyNumber: oldPolicy.policyNumber,
      newPolicyNumber: newPolicy.policyNumber,
    });

    return newPolicy;
  }

  async getDashboard(userId: string, nowString?: string) {
    const now = nowString ? new Date(nowString) : new Date();
    return policyRepository.getDashboardStats(userId, now);
  }

  async getUpcomingRenewals(userId: string, params: { range: string; nowString?: string }) {
    const now = params.nowString ? new Date(params.nowString) : new Date();
    let days = 30;
    if (params.range === 'today') days = 0;
    else if (params.range === 'tomorrow') days = 1;
    else if (params.range === '7days') days = 7;
    else if (params.range === '15days') days = 15;
    else if (params.range === '30days') days = 30;

    if (params.range === 'expired') {
      return policyRepository.getExpiredPoliciesList(userId, now);
    }

    return policyRepository.getUpcomingPoliciesList(userId, now, days);
  }

  async globalSearch(userId: string, query: string) {
    return policyRepository.searchGlobal(userId, query);
  }

  // Dynamic automatic reminder calculation
  async generateRemindersForPolicy(userId: string, policyId: string, expiryDate: Date) {
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
    await prisma.reminder.deleteMany({
      where: { policyId },
    });

    for (const r of remindersData) {
      await prisma.reminder.create({
        data: r,
      });
    }
  }
}

export const policyService = new PolicyService();
export default policyService;
