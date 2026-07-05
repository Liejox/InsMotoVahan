/*
  Warnings:

  - A unique constraint covering the columns `[user_id,mobile_number]` on the table `customers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,policy_number]` on the table `insurance_policies` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[user_id,vehicle_number]` on the table `vehicles` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "customers_mobile_number_key";

-- DropIndex
DROP INDEX "insurance_policies_policy_number_key";

-- DropIndex
DROP INDEX "vehicles_vehicle_number_key";

-- CreateIndex
CREATE UNIQUE INDEX "customers_user_id_mobile_number_key" ON "customers"("user_id", "mobile_number");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policies_user_id_policy_number_key" ON "insurance_policies"("user_id", "policy_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_user_id_vehicle_number_key" ON "vehicles"("user_id", "vehicle_number");
