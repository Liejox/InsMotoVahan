"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerService = exports.CustomerService = void 0;
const customerRepository_1 = require("../repositories/customerRepository");
const errors_1 = require("../utils/errors");
class CustomerService {
    async registerCustomer(userId, data) {
        const existing = await customerRepository_1.customerRepository.findCustomerByPhone(userId, data.mobileNumber);
        if (existing) {
            return existing;
        }
        const customer = await customerRepository_1.customerRepository.createCustomer(userId, data);
        await customerRepository_1.customerRepository.logActivity(userId, 'CREATE_CUSTOMER', {
            customerId: customer.id,
            customerName: customer.fullName,
        });
        return customer;
    }
    async searchCustomers(userId, params) {
        return customerRepository_1.customerRepository.searchCustomers(userId, params);
    }
    async addVehicle(userId, data) {
        // 1. Verify customer exists and belongs to the user
        const customer = await customerRepository_1.customerRepository.findCustomerById(userId, data.customerId);
        if (!customer) {
            throw new errors_1.NotFoundError('Customer not found');
        }
        // 2. Validate duplicate vehicle plate for this user
        const existingVehicle = await customerRepository_1.customerRepository.findVehicleByNumber(userId, data.vehicleNumber);
        if (existingVehicle) {
            if (existingVehicle.customerId === data.customerId) {
                return existingVehicle;
            }
            throw new errors_1.ConflictError(`Vehicle number ${data.vehicleNumber} is already registered to customer ${existingVehicle.customer.fullName}`);
        }
        const vehicle = await customerRepository_1.customerRepository.createVehicle(userId, data);
        await customerRepository_1.customerRepository.logActivity(userId, 'ADD_VEHICLE', {
            customerId: data.customerId,
            vehicleId: vehicle.id,
            vehicleNumber: vehicle.vehicleNumber,
        });
        return vehicle;
    }
    async getProfile(userId, id) {
        const profile = await customerRepository_1.customerRepository.getCustomerProfile(userId, id);
        if (!profile) {
            throw new errors_1.NotFoundError('Customer profile not found');
        }
        const activitiesRaw = await customerRepository_1.customerRepository.getCustomerActivities(userId, id);
        const activities = activitiesRaw.map((act) => {
            let detailsParsed = {};
            try {
                detailsParsed = act.details ? JSON.parse(act.details) : {};
            }
            catch (e) {
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
    async checkVehicleDuplicate(userId, vehicleNumber) {
        const vehicle = await customerRepository_1.customerRepository.findVehicleByNumber(userId, vehicleNumber);
        return {
            isDuplicate: !!vehicle,
            ownerName: vehicle?.customer.fullName || null,
        };
    }
    async deleteCustomer(userId, id) {
        const customer = await customerRepository_1.customerRepository.findCustomerById(userId, id);
        if (!customer) {
            throw new errors_1.NotFoundError('Customer not found');
        }
        await customerRepository_1.customerRepository.deleteCustomer(userId, id);
        await customerRepository_1.customerRepository.logActivity(userId, 'DELETE_CUSTOMER', {
            customerId: id,
            customerName: customer.fullName,
        });
    }
    async updateCustomer(userId, id, data) {
        const customer = await customerRepository_1.customerRepository.findCustomerById(userId, id);
        if (!customer) {
            throw new errors_1.NotFoundError('Customer not found');
        }
        if (data.mobileNumber && data.mobileNumber !== customer.mobileNumber) {
            const existing = await customerRepository_1.customerRepository.findCustomerByPhone(userId, data.mobileNumber);
            if (existing) {
                throw new errors_1.ConflictError(`Mobile number ${data.mobileNumber} is already registered to another customer`);
            }
        }
        const updated = await customerRepository_1.customerRepository.updateCustomer(userId, id, data);
        await customerRepository_1.customerRepository.logActivity(userId, 'UPDATE_CUSTOMER', {
            customerId: id,
            customerName: updated.fullName,
        });
        return updated;
    }
}
exports.CustomerService = CustomerService;
exports.customerService = new CustomerService();
