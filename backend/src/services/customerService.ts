import { customerRepository } from '../repositories/customerRepository';
import { ConflictError, NotFoundError } from '../utils/errors';

export class CustomerService {
  async registerCustomer(
    userId: string,
    data: {
      fullName: string;
      mobileNumber: string;
      alternateNumber?: string | null;
      whatsappNumber?: string | null;
      notes?: string | null;
      address: {
        addressLine1: string;
        addressLine2?: string | null;
        city: string;
        state: string;
        pincode: string;
      };
    }
  ) {
    const existing = await customerRepository.findCustomerByPhone(userId, data.mobileNumber);
    if (existing) {
      return existing;
    }

    const customer = await customerRepository.createCustomer(userId, data);
    await customerRepository.logActivity(userId, 'CREATE_CUSTOMER', {
      customerId: customer.id,
      customerName: customer.fullName,
    });

    return customer;
  }

  async searchCustomers(
    userId: string,
    params: { query?: string; page: number; limit: number; sortBy?: string; month?: string }
  ) {
    return customerRepository.searchCustomers(userId, params);
  }

  async addVehicle(
    userId: string,
    data: {
      customerId: string;
      vehicleNumber: string;
      vehicleType: string;
      brand: string;
      model: string;
      fuelType: string;
      manufacturingYear: number;
      engineNumber?: string | null;
      chassisNumber?: string | null;
    }
  ) {
    // 1. Verify customer exists and belongs to the user
    const customer = await customerRepository.findCustomerById(userId, data.customerId);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    // 2. Validate duplicate vehicle plate for this user
    const existingVehicle = await customerRepository.findVehicleByNumber(userId, data.vehicleNumber);
    if (existingVehicle) {
      if (existingVehicle.customerId === data.customerId) {
        return existingVehicle;
      }
      throw new ConflictError(
        `Vehicle number ${data.vehicleNumber} is already registered to customer ${existingVehicle.customer.fullName}`
      );
    }

    const vehicle = await customerRepository.createVehicle(userId, data);
    await customerRepository.logActivity(userId, 'ADD_VEHICLE', {
      customerId: data.customerId,
      vehicleId: vehicle.id,
      vehicleNumber: vehicle.vehicleNumber,
    });

    return vehicle;
  }

  async getProfile(userId: string, id: string) {
    const profile = await customerRepository.getCustomerProfile(userId, id);
    if (!profile) {
      throw new NotFoundError('Customer profile not found');
    }

    const activitiesRaw = await customerRepository.getCustomerActivities(userId, id);
    const activities = activitiesRaw.map((act) => {
      let detailsParsed = {};
      try {
        detailsParsed = act.details ? JSON.parse(act.details) : {};
      } catch (e) {
        detailsParsed = { raw: act.details };
      }
      return {
        id: act.id,
        action: act.action,
        details: detailsParsed,
        createdAt: act.createdAt,
        agentName: act.user.fullName,
      };
    });

    return {
      profile,
      activities,
    };
  }

  async checkVehicleDuplicate(userId: string, vehicleNumber: string) {
    const vehicle = await customerRepository.findVehicleByNumber(userId, vehicleNumber);
    return {
      isDuplicate: !!vehicle,
      ownerName: vehicle?.customer.fullName || null,
    };
  }

  async deleteCustomer(userId: string, id: string) {
    const customer = await customerRepository.findCustomerById(userId, id);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    await customerRepository.deleteCustomer(userId, id);

    await customerRepository.logActivity(userId, 'DELETE_CUSTOMER', {
      customerId: id,
      customerName: customer.fullName,
    });
  }

  async updateCustomer(
    userId: string,
    id: string,
    data: {
      fullName: string;
      mobileNumber: string;
      alternateNumber?: string | null;
      whatsappNumber?: string | null;
      notes?: string | null;
      address: {
        addressLine1: string;
        addressLine2?: string | null;
        city: string;
        state: string;
        pincode: string;
      } | null;
    }
  ) {
    const customer = await customerRepository.findCustomerById(userId, id);
    if (!customer) {
      throw new NotFoundError('Customer not found');
    }

    if (data.mobileNumber && data.mobileNumber !== customer.mobileNumber) {
      const existing = await customerRepository.findCustomerByPhone(userId, data.mobileNumber);
      if (existing) {
        throw new ConflictError(`Mobile number ${data.mobileNumber} is already registered to another customer`);
      }
    }

    const updated = await customerRepository.updateCustomer(userId, id, data);
    await customerRepository.logActivity(userId, 'UPDATE_CUSTOMER', {
      customerId: id,
      customerName: updated.fullName,
    });

    return updated;
  }
}

export const customerService = new CustomerService();
