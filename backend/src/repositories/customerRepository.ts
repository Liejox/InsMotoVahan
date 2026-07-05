import prisma from '../config/db';

export class CustomerRepository {
  async createCustomer(
    userId: string,
    data: {
      fullName: string;
      mobileNumber: string;
      alternateNumber?: string | null;
      whatsappNumber?: string | null;
      notes?: string | null;
      address?: {
        addressLine1?: string | null;
        addressLine2?: string | null;
        city?: string | null;
        state?: string | null;
        pincode?: string | null;
      } | null;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const customer = await tx.customer.create({
        data: {
          userId,
          fullName: data.fullName,
          mobileNumber: data.mobileNumber,
          alternateNumber: data.alternateNumber,
          whatsappNumber: data.whatsappNumber,
          notes: data.notes,
        },
      });

      if (data.address && data.address.addressLine1) {
        const address = await tx.customerAddress.create({
          data: {
            customerId: customer.id,
            addressLine1: data.address.addressLine1,
            addressLine2: data.address.addressLine2,
            city: data.address.city || '',
            state: data.address.state || '',
            pincode: data.address.pincode || '',
          },
        });
        return { ...customer, address };
      }

      return { ...customer, address: null };
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
      address?: {
        addressLine1: string;
        addressLine2?: string | null;
        city: string;
        state: string;
        pincode: string;
      } | null;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.customer.findFirst({
        where: { id, userId },
      });
      if (!existing) throw new Error('Customer not found or access denied');

      const customer = await tx.customer.update({
        where: { id },
        data: {
          fullName: data.fullName,
          mobileNumber: data.mobileNumber,
          alternateNumber: data.alternateNumber,
          whatsappNumber: data.whatsappNumber,
          notes: data.notes,
        },
      });

      if (data.address && data.address.addressLine1) {
        const address = await tx.customerAddress.upsert({
          where: { customerId: id },
          update: {
            addressLine1: data.address.addressLine1,
            addressLine2: data.address.addressLine2,
            city: data.address.city || '',
            state: data.address.state || '',
            pincode: data.address.pincode || '',
          },
          create: {
            customerId: id,
            addressLine1: data.address.addressLine1,
            addressLine2: data.address.addressLine2,
            city: data.address.city || '',
            state: data.address.state || '',
            pincode: data.address.pincode || '',
          },
        });
        return { ...customer, address };
      } else {
        await tx.customerAddress.deleteMany({
          where: { customerId: id },
        });
        return { ...customer, address: null };
      }
    });
  }

  async findCustomerById(userId: string, id: string) {
    return prisma.customer.findFirst({
      where: { id, userId },
      include: { address: true },
    });
  }

  async findCustomerByPhone(userId: string, mobileNumber: string) {
    return prisma.customer.findFirst({
      where: { mobileNumber, userId },
    });
  }

  async searchCustomers(
    userId: string,
    params: { query?: string; page: number; limit: number; sortBy?: string; month?: string }
  ) {
    const { query, page, limit, sortBy, month } = params;
    const skip = (page - 1) * limit;

    const cleanQuery = query ? query.trim() : '';

    const currentYear = new Date().getFullYear();
    let dateFilter: any = {};

    if (month && month !== 'overall') {
      const monthNum = parseInt(month, 10);
      if (monthNum >= 1 && monthNum <= 12) {
        const startDate = new Date(currentYear, monthNum - 1, 1, 0, 0, 0, 0);
        const endDate = new Date(currentYear, monthNum, 0, 23, 59, 59, 999);
        dateFilter = {
          createdAt: {
            gte: startDate,
            lte: endDate,
          },
        };
      }
    } else {
      const startDate = new Date(currentYear, 0, 1, 0, 0, 0, 0);
      const endDate = new Date(currentYear, 12, 0, 23, 59, 59, 999);
      dateFilter = {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      };
    }

    const whereClause: any = {
      userId,
      ...dateFilter,
    };

    if (cleanQuery) {
      whereClause.OR = [
        { fullName: { contains: cleanQuery } },
        { mobileNumber: { contains: cleanQuery } },
        {
          vehicles: {
            some: {
              vehicleNumber: { contains: cleanQuery.toUpperCase().replace(/\s/g, '') },
            },
          },
        },
      ];
    }

    let orderBy: any = { fullName: 'asc' };
    if (sortBy === 'name_desc') {
      orderBy = { fullName: 'desc' };
    } else if (sortBy === 'month' || sortBy === 'createdAt') {
      orderBy = { createdAt: 'desc' };
    } else if (sortBy === 'name_asc') {
      orderBy = { fullName: 'asc' };
    }

    const [customers, total] = await prisma.$transaction([
      prisma.customer.findMany({
        where: whereClause,
        include: {
          address: true,
          vehicles: {
            include: {
              policies: {
                include: {
                  status: true,
                },
              },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.customer.count({ where: whereClause }),
    ]);

    const customersWithStatus = customers.map((c) => {
      const hasActive = c.vehicles.some((v) =>
        v.policies.some((p) => p.status.name === 'ACTIVE')
      );
      return {
        ...c,
        policyStatus: hasActive ? 'Active' : 'Expired',
      };
    });

    return { customers: customersWithStatus, total };
  }

  async createVehicle(
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
    return prisma.vehicle.create({
      data: {
        userId,
        customerId: data.customerId,
        vehicleNumber: data.vehicleNumber.toUpperCase().replace(/\s/g, ''),
        vehicleType: data.vehicleType,
        brand: data.brand,
        model: data.model,
        fuelType: data.fuelType,
        manufacturingYear: data.manufacturingYear,
        engineNumber: data.engineNumber || null,
        chassisNumber: data.chassisNumber || null,
      },
    });
  }

  async findVehicleByNumber(userId: string, vehicleNumber: string) {
    const formatted = vehicleNumber.toUpperCase().replace(/\s/g, '');
    return prisma.vehicle.findFirst({
      where: { vehicleNumber: formatted, userId },
      include: { customer: true },
    });
  }

  async findVehicleById(userId: string, id: string) {
    return prisma.vehicle.findFirst({
      where: { id, userId },
      include: { customer: true },
    });
  }

  async getCustomerProfile(userId: string, id: string) {
    return prisma.customer.findFirst({
      where: { id, userId },
      include: {
        address: true,
        vehicles: {
          include: {
            policies: {
              orderBy: { expiryDate: 'desc' },
              include: {
                company: true,
                status: true,
              },
            },
            history: {
              orderBy: { createdAt: 'desc' },
              include: {
                policy: {
                  include: {
                    company: true,
                  },
                },
              },
            },
          },
        },
        documents: true,
      },
    });
  }

  async deleteCustomer(userId: string, id: string) {
    const existing = await prisma.customer.findFirst({
      where: { id, userId },
    });
    if (!existing) throw new Error('Customer not found or access denied');
    return prisma.customer.delete({
      where: { id },
    });
  }

  async logActivity(userId: string, action: string, details: object) {
    return prisma.activityLog.create({
      data: {
        userId,
        action,
        details: JSON.stringify(details),
      },
    });
  }

  async getCustomerActivities(userId: string, customerId: string) {
    return prisma.activityLog.findMany({
      where: {
        userId,
        details: {
          contains: customerId,
        },
      },
      include: {
        user: {
          select: {
            fullName: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }
}

export const customerRepository = new CustomerRepository();
