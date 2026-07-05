"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.customerController = exports.CustomerController = void 0;
const customerService_1 = require("../services/customerService");
class CustomerController {
    createCustomer = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { fullName, mobileNumber, alternateNumber, whatsappNumber, notes, addressLine1, addressLine2, city, state, pincode, } = req.body;
            const customerData = {
                fullName,
                mobileNumber,
                alternateNumber,
                whatsappNumber,
                notes,
                address: {
                    addressLine1,
                    addressLine2,
                    city,
                    state,
                    pincode,
                },
            };
            const customer = await customerService_1.customerService.registerCustomer(userId, customerData);
            return res.status(201).json({
                status: 'success',
                data: { customer },
            });
        }
        catch (error) {
            next(error);
        }
    };
    searchCustomers = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const query = req.query.query;
            const sortBy = req.query.sortBy;
            const month = req.query.month;
            const page = parseInt(req.query.page || '1', 10);
            const limit = parseInt(req.query.limit || '10', 10);
            const result = await customerService_1.customerService.searchCustomers(userId, { query, page, limit, sortBy, month });
            return res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    createVehicle = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const vehicle = await customerService_1.customerService.addVehicle(userId, req.body);
            return res.status(201).json({
                status: 'success',
                data: { vehicle },
            });
        }
        catch (error) {
            next(error);
        }
    };
    getCustomerProfile = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const result = await customerService_1.customerService.getProfile(userId, id);
            return res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    checkVehicleDuplicate = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { vehicleNumber } = req.query;
            if (!vehicleNumber || typeof vehicleNumber !== 'string') {
                return res.status(400).json({ status: 'error', message: 'Vehicle number is required' });
            }
            const result = await customerService_1.customerService.checkVehicleDuplicate(userId, vehicleNumber);
            return res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    deleteCustomer = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            await customerService_1.customerService.deleteCustomer(userId, id);
            return res.status(200).json({
                status: 'success',
                message: 'Customer deleted successfully',
            });
        }
        catch (error) {
            next(error);
        }
    };
    updateCustomer = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const { id } = req.params;
            const { fullName, mobileNumber, alternateNumber, whatsappNumber, notes, addressLine1, addressLine2, city, state, pincode, } = req.body;
            const customerData = {
                fullName,
                mobileNumber,
                alternateNumber,
                whatsappNumber,
                notes,
                address: addressLine1 ? {
                    addressLine1,
                    addressLine2,
                    city,
                    state,
                    pincode,
                } : null,
            };
            const customer = await customerService_1.customerService.updateCustomer(userId, id, customerData);
            return res.status(200).json({
                status: 'success',
                data: { customer },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.CustomerController = CustomerController;
exports.customerController = new CustomerController();
exports.default = exports.customerController;
