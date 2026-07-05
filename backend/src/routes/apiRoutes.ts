import { Router } from 'express';
import { customerController } from '../controllers/customerController';
import { policyController } from '../controllers/policyController';
import { documentController } from '../controllers/documentController';
import { reportController } from '../controllers/reportController';
import { notificationController } from '../controllers/notificationController';
import { authenticate } from '../middlewares/auth';
import { validateRequest } from '../middlewares/validate';
import { upload } from '../middlewares/upload';
import {
  createCustomerSchema,
  updateCustomerSchema,
  createVehicleSchema,
  createPolicySchema,
} from '../utils/validationSchemas';

const router = Router();

// Secure all routes with authenticate middleware
router.use(authenticate as any);

// ----------------- Customer Routes -----------------
router.post('/customers', validateRequest(createCustomerSchema), customerController.createCustomer);
router.get('/customers', customerController.searchCustomers);
router.get('/customers/:id', customerController.getCustomerProfile);
router.patch('/customers/:id', validateRequest(updateCustomerSchema), customerController.updateCustomer);
router.delete('/customers/:id', customerController.deleteCustomer);

// ----------------- Vehicle Routes -----------------
router.post('/vehicles', validateRequest(createVehicleSchema), customerController.createVehicle);
router.get('/vehicles/check-duplicate', customerController.checkVehicleDuplicate);

// ----------------- Policy Routes -----------------
router.post('/policies', validateRequest(createPolicySchema), policyController.createPolicy);
router.post('/policies/renew', policyController.renewPolicy);
router.get('/policies/dashboard', policyController.getDashboard);
router.get('/policies/upcoming', policyController.getUpcomingRenewals);
router.get('/policies/search', policyController.globalSearch);
router.get('/policies/companies', policyController.getCompanies);
router.get('/policies/statuses', policyController.getStatuses);

// ----------------- Document Routes -----------------
router.post('/documents/upload', upload.single('file'), documentController.uploadDocument);
router.post('/documents/replace/:id', upload.single('file'), documentController.replaceDocument);
router.get('/documents/customer/:customerId', documentController.getCustomerDocuments);
router.get('/documents/file/:id', documentController.serveDocument);
router.delete('/documents/:id', documentController.deleteDocument);

// ----------------- Report Routes -----------------
router.get('/reports/renewals', reportController.getRenewalReports);
router.get('/reports/companies', reportController.getCompanyDistribution);
router.get('/reports/vehicles', reportController.getVehicleStatistics);
router.get('/reports/financials', reportController.getFinancialReports);

// ----------------- Notification Routes -----------------
router.get('/notifications', notificationController.getNotifications);
router.patch('/notifications/read-all', notificationController.markAllAsRead);
router.patch('/notifications/:id/read', notificationController.markAsRead);

export default router;
