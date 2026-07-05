import { z } from 'zod';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});

export const createCustomerSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
    alternateNumber: z.string().regex(/^\d{10}$/, 'Alternate number must be exactly 10 digits').optional().nullable().or(z.literal('')),
    whatsappNumber: z.string().regex(/^\d{10}$/, 'WhatsApp number must be exactly 10 digits').optional().nullable().or(z.literal('')),
    addressLine1: z.string().optional().nullable().or(z.literal('')),
    addressLine2: z.string().optional().nullable().or(z.literal('')),
    city: z.string().optional().nullable().or(z.literal('')),
    state: z.string().optional().nullable().or(z.literal('')),
    pincode: z.string().optional().nullable().or(z.literal('')).refine(val => !val || /^\d{6}$/.test(val), {
      message: 'Pincode must be exactly 6 digits',
    }),
    notes: z.string().optional().nullable().or(z.literal('')),
  }),
});

export const updateCustomerSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid customer ID'),
  }),
  body: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    mobileNumber: z.string().regex(/^\d{10}$/, 'Mobile number must be exactly 10 digits'),
    alternateNumber: z.string().regex(/^\d{10}$/, 'Alternate number must be exactly 10 digits').optional().nullable().or(z.literal('')),
    whatsappNumber: z.string().regex(/^\d{10}$/, 'WhatsApp number must be exactly 10 digits').optional().nullable().or(z.literal('')),
    addressLine1: z.string().optional().nullable().or(z.literal('')),
    addressLine2: z.string().optional().nullable().or(z.literal('')),
    city: z.string().optional().nullable().or(z.literal('')),
    state: z.string().optional().nullable().or(z.literal('')),
    pincode: z.string().optional().nullable().or(z.literal('')).refine(val => !val || /^\d{6}$/.test(val), {
      message: 'Pincode must be exactly 6 digits',
    }),
    notes: z.string().optional().nullable().or(z.literal('')),
  }),
});

export const createVehicleSchema = z.object({
  body: z.object({
    customerId: z.string().uuid('Invalid customer ID'),
    vehicleNumber: z.string()
      .transform(val => val.toUpperCase().replace(/[^A-Z0-9]/g, ''))
      .pipe(z.string().regex(/^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$|^[A-Z]{2}[0-9]{1,2}[0-9]{4}$/, 'Invalid Indian vehicle plate format (e.g. TN07CP1234 or TN071234)')),
    vehicleType: z.enum(['BIKE', 'CAR', 'TRUCK', 'BUS', 'OTHER']),
    brand: z.string().min(1, 'Brand is required'),
    model: z.string().min(1, 'Model is required'),
    fuelType: z.enum(['PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID']),
    manufacturingYear: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    engineNumber: z.string().min(5, 'Engine number must be at least 5 chars').optional().nullable().or(z.literal('')),
    chassisNumber: z.string().min(5, 'Chassis number must be at least 5 chars').optional().nullable().or(z.literal('')),
  }),
});

export const createPolicySchema = z.object({
  body: z.object({
    vehicleId: z.string().uuid('Invalid vehicle ID'),
    companyId: z.string().uuid('Invalid company ID'),
    policyNumber: z.string().min(1, 'Policy number is required'),
    startDate: z.string().datetime('Start date must be a valid ISO datetime'),
    expiryDate: z.string().datetime('Expiry date must be a valid ISO datetime'),
    premiumAmount: z.number().positive('Premium amount must be positive'),
    idv: z.number().positive('IDV must be positive'),
    ncb: z.number().int().min(0).max(50).default(0),
    commissionRate: z.number().min(0).max(100).default(15),
    policyPdfUrl: z.string().url('Invalid URL format').optional().nullable().or(z.literal('')),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    fullName: z.string().min(1, 'Full name is required'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
  }),
});
