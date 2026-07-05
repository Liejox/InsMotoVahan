"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSchema = exports.createPolicySchema = exports.createVehicleSchema = exports.updateCustomerSchema = exports.createCustomerSchema = exports.loginSchema = void 0;
const zod_1 = require("zod");
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    }),
});
exports.createCustomerSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(1, 'Full name is required'),
        mobileNumber: zod_1.z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
        alternateNumber: zod_1.z.string().regex(/^\d{10}$/, 'Alternate number must be exactly 10 digits').optional().nullable().or(zod_1.z.literal('')),
        whatsappNumber: zod_1.z.string().regex(/^\d{10}$/, 'WhatsApp number must be exactly 10 digits').optional().nullable().or(zod_1.z.literal('')),
        addressLine1: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
        addressLine2: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
        city: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
        state: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
        pincode: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')).refine(val => !val || /^\d{6}$/.test(val), {
            message: 'Pincode must be exactly 6 digits',
        }),
        notes: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
    }),
});
exports.updateCustomerSchema = zod_1.z.object({
    params: zod_1.z.object({
        id: zod_1.z.string().uuid('Invalid customer ID'),
    }),
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(1, 'Full name is required'),
        mobileNumber: zod_1.z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
        alternateNumber: zod_1.z.string().regex(/^\d{10}$/, 'Alternate number must be exactly 10 digits').optional().nullable().or(zod_1.z.literal('')),
        whatsappNumber: zod_1.z.string().regex(/^\d{10}$/, 'WhatsApp number must be exactly 10 digits').optional().nullable().or(zod_1.z.literal('')),
        addressLine1: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
        addressLine2: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
        city: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
        state: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
        pincode: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')).refine(val => !val || /^\d{6}$/.test(val), {
            message: 'Pincode must be exactly 6 digits',
        }),
        notes: zod_1.z.string().optional().nullable().or(zod_1.z.literal('')),
    }),
});
exports.createVehicleSchema = zod_1.z.object({
    body: zod_1.z.object({
        customerId: zod_1.z.string().uuid('Invalid customer ID'),
        vehicleNumber: zod_1.z.string()
            .transform(val => val.toUpperCase().replace(/[^A-Z0-9]/g, ''))
            .pipe(zod_1.z.string().regex(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$|^[A-Z]{2}[0-9]{1,2}[0-9]{4}$/, 'Invalid Indian vehicle plate format (e.g. TN07CP1234 or TN071234)')),
        vehicleType: zod_1.z.enum(['BIKE', 'CAR', 'TRUCK', 'BUS', 'OTHER']),
        brand: zod_1.z.string().min(1, 'Brand is required'),
        model: zod_1.z.string().min(1, 'Model is required'),
        fuelType: zod_1.z.enum(['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID']),
        manufacturingYear: zod_1.z.number().int().min(1900).max(new Date().getFullYear() + 1),
        engineNumber: zod_1.z.string().min(5, 'Engine number must be at least 5 chars').optional().nullable().or(zod_1.z.literal('')),
        chassisNumber: zod_1.z.string().min(5, 'Chassis number must be at least 5 chars').optional().nullable().or(zod_1.z.literal('')),
    }),
});
exports.createPolicySchema = zod_1.z.object({
    body: zod_1.z.object({
        vehicleId: zod_1.z.string().uuid('Invalid vehicle ID'),
        companyId: zod_1.z.string().uuid('Invalid company ID'),
        policyNumber: zod_1.z.string().min(1, 'Policy number is required'),
        startDate: zod_1.z.string().datetime('Start date must be a valid ISO datetime'),
        expiryDate: zod_1.z.string().datetime('Expiry date must be a valid ISO datetime'),
        premiumAmount: zod_1.z.number().positive('Premium amount must be positive'),
        idv: zod_1.z.number().positive('IDV must be positive'),
        ncb: zod_1.z.number().int().min(0).max(50).default(0),
        commissionRate: zod_1.z.number().min(0).max(100).default(15),
        policyPdfUrl: zod_1.z.string().url('Invalid URL format').optional().nullable().or(zod_1.z.literal('')),
    }),
});
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        fullName: zod_1.z.string().min(1, 'Full name is required'),
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
    }),
});
