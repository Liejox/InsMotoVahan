import { Response, NextFunction } from 'express';
import { customerService } from '../services/customerService';
import { AuthenticatedRequest } from '../middlewares/auth';

export class CustomerController {
  createCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const {
        fullName,
        mobileNumber,
        alternateNumber,
        whatsappNumber,
        notes,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
      } = req.body;

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

      const customer = await customerService.registerCustomer(userId, customerData);
      return res.status(201).json({
        status: 'success',
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  };

  searchCustomers = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const query = req.query.query as string | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const month = req.query.month as string | undefined;
      const page = parseInt(req.query.page as string || '1', 10);
      const limit = parseInt(req.query.limit as string || '10', 10);

      const result = await customerService.searchCustomers(userId, { query, page, limit, sortBy, month });
      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  createVehicle = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const vehicle = await customerService.addVehicle(userId, req.body);
      return res.status(201).json({
        status: 'success',
        data: { vehicle },
      });
    } catch (error) {
      next(error);
    }
  };

  getCustomerProfile = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const result = await customerService.getProfile(userId, id);
      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  checkVehicleDuplicate = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { vehicleNumber } = req.query;
      if (!vehicleNumber || typeof vehicleNumber !== 'string') {
        return res.status(400).json({ status: 'error', message: 'Vehicle number is required' });
      }
      const result = await customerService.checkVehicleDuplicate(userId, vehicleNumber);
      return res.status(200).json({
        status: 'success',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      await customerService.deleteCustomer(userId, id);
      return res.status(200).json({
        status: 'success',
        message: 'Customer deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  updateCustomer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.id;
      const { id } = req.params;
      const {
        fullName,
        mobileNumber,
        alternateNumber,
        whatsappNumber,
        notes,
        addressLine1,
        addressLine2,
        city,
        state,
        pincode,
      } = req.body;

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

      const customer = await customerService.updateCustomer(userId, id, customerData);
      return res.status(200).json({
        status: 'success',
        data: { customer },
      });
    } catch (error) {
      next(error);
    }
  };
}

export const customerController = new CustomerController();
export default customerController;
