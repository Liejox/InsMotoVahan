"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const customers = await prisma.customer.findMany({
        include: {
            vehicles: {
                include: {
                    policies: {
                        include: {
                            status: true,
                            company: true,
                        }
                    }
                }
            }
        }
    });
    console.log('=== CUSTOMERS & THEIR VEHICLES/POLICIES ===');
    console.log(JSON.stringify(customers, null, 2));
    const statuses = await prisma.policyStatus.findMany();
    console.log('=== POLICY STATUSES ===');
    console.log(JSON.stringify(statuses, null, 2));
    const allPolicies = await prisma.insurancePolicy.findMany({
        include: {
            status: true,
        }
    });
    console.log('=== ALL INSURANCE POLICIES ===');
    console.log(JSON.stringify(allPolicies, null, 2));
}
main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
