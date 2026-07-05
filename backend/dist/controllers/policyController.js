"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.policyController = exports.PolicyController = void 0;
const policyService_1 = require("../services/policyService");
class PolicyController {
    createPolicy = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const policy = await policyService_1.policyService.createPolicy(userId, req.body);
            return res.status(201).json({
                status: 'success',
                data: { policy },
            });
        }
        catch (error) {
            next(error);
        }
    };
    renewPolicy = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const policy = await policyService_1.policyService.renewPolicy(userId, req.body);
            return res.status(201).json({
                status: 'success',
                data: { policy },
            });
        }
        catch (error) {
            next(error);
        }
    };
    getDashboard = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const nowString = req.query.now;
            const stats = await policyService_1.policyService.getDashboard(userId, nowString);
            return res.status(200).json({
                status: 'success',
                data: stats,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getUpcomingRenewals = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const range = req.query.range || '30days';
            const nowString = req.query.now;
            const policies = await policyService_1.policyService.getUpcomingRenewals(userId, { range, nowString });
            return res.status(200).json({
                status: 'success',
                data: { policies },
            });
        }
        catch (error) {
            next(error);
        }
    };
    globalSearch = async (req, res, next) => {
        try {
            const userId = req.user.id;
            const query = req.query.query || '';
            const result = await policyService_1.policyService.globalSearch(userId, query);
            return res.status(200).json({
                status: 'success',
                data: result,
            });
        }
        catch (error) {
            next(error);
        }
    };
    getCompanies = async (req, res, next) => {
        try {
            const companies = await policyService_1.policyService.getCompanies();
            return res.status(200).json({
                status: 'success',
                data: { companies },
            });
        }
        catch (error) {
            next(error);
        }
    };
    getStatuses = async (req, res, next) => {
        try {
            const statuses = await policyService_1.policyService.getStatuses();
            return res.status(200).json({
                status: 'success',
                data: { statuses },
            });
        }
        catch (error) {
            next(error);
        }
    };
}
exports.PolicyController = PolicyController;
exports.policyController = new PolicyController();
exports.default = exports.policyController;
