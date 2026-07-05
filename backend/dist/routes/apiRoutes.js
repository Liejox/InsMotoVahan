"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const customerController_1 = require("../controllers/customerController");
const policyController_1 = require("../controllers/policyController");
const documentController_1 = require("../controllers/documentController");
const reportController_1 = require("../controllers/reportController");
const notificationController_1 = require("../controllers/notificationController");
const auth_1 = require("../middlewares/auth");
const validate_1 = require("../middlewares/validate");
const upload_1 = require("../middlewares/upload");
const validationSchemas_1 = require("../utils/validationSchemas");
const router = (0, express_1.Router)();
// Secure all routes with authenticate middleware
router.use(auth_1.authenticate);
// ----------------- Customer Routes -----------------
router.post('/customers', (0, validate_1.validateRequest)(validationSchemas_1.createCustomerSchema), customerController_1.customerController.createCustomer);
router.get('/customers', customerController_1.customerController.searchCustomers);
router.get('/customers/:id', customerController_1.customerController.getCustomerProfile);
router.patch('/customers/:id', (0, validate_1.validateRequest)(validationSchemas_1.updateCustomerSchema), customerController_1.customerController.updateCustomer);
router.delete('/customers/:id', customerController_1.customerController.deleteCustomer);
// ----------------- Vehicle Routes -----------------
router.post('/vehicles', (0, validate_1.validateRequest)(validationSchemas_1.createVehicleSchema), customerController_1.customerController.createVehicle);
router.get('/vehicles/check-duplicate', customerController_1.customerController.checkVehicleDuplicate);
// ----------------- Policy Routes -----------------
router.post('/policies', (0, validate_1.validateRequest)(validationSchemas_1.createPolicySchema), policyController_1.policyController.createPolicy);
router.post('/policies/renew', policyController_1.policyController.renewPolicy);
router.get('/policies/dashboard', policyController_1.policyController.getDashboard);
router.get('/policies/upcoming', policyController_1.policyController.getUpcomingRenewals);
router.get('/policies/search', policyController_1.policyController.globalSearch);
router.get('/policies/companies', policyController_1.policyController.getCompanies);
router.get('/policies/statuses', policyController_1.policyController.getStatuses);
// ----------------- Document Routes -----------------
router.post('/documents/upload', upload_1.upload.single('file'), documentController_1.documentController.uploadDocument);
router.post('/documents/replace/:id', upload_1.upload.single('file'), documentController_1.documentController.replaceDocument);
router.get('/documents/customer/:customerId', documentController_1.documentController.getCustomerDocuments);
router.get('/documents/file/:id', documentController_1.documentController.serveDocument);
router.delete('/documents/:id', documentController_1.documentController.deleteDocument);
// ----------------- Report Routes -----------------
router.get('/reports/renewals', reportController_1.reportController.getRenewalReports);
router.get('/reports/companies', reportController_1.reportController.getCompanyDistribution);
router.get('/reports/vehicles', reportController_1.reportController.getVehicleStatistics);
router.get('/reports/financials', reportController_1.reportController.getFinancialReports);
// ----------------- Notification Routes -----------------
router.get('/notifications', notificationController_1.notificationController.getNotifications);
router.patch('/notifications/read-all', notificationController_1.notificationController.markAllAsRead);
router.patch('/notifications/:id/read', notificationController_1.notificationController.markAsRead);
exports.default = router;
