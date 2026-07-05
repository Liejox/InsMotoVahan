/*
  Warnings:

  - Added the required column `user_id` to the `customers` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `documents` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `insurance_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `insurance_policies` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `notifications` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `reminders` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_id` to the `vehicles` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "mobile_number" TEXT NOT NULL,
    "alternate_number" TEXT,
    "whatsapp_number" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "customers_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_customers" ("alternate_number", "created_at", "full_name", "id", "mobile_number", "notes", "updated_at", "whatsapp_number") SELECT "alternate_number", "created_at", "full_name", "id", "mobile_number", "notes", "updated_at", "whatsapp_number" FROM "customers";
DROP TABLE "customers";
ALTER TABLE "new_customers" RENAME TO "customers";
CREATE UNIQUE INDEX "customers_mobile_number_key" ON "customers"("mobile_number");
CREATE INDEX "customers_full_name_idx" ON "customers"("full_name");
CREATE INDEX "customers_mobile_number_idx" ON "customers"("mobile_number");
CREATE TABLE "new_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_documents" ("customer_id", "document_type", "file_name", "file_path", "file_size", "id", "mime_type", "uploaded_at") SELECT "customer_id", "document_type", "file_name", "file_path", "file_size", "id", "mime_type", "uploaded_at" FROM "documents";
DROP TABLE "documents";
ALTER TABLE "new_documents" RENAME TO "documents";
CREATE TABLE "new_insurance_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "insurance_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "insurance_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "insurance_history_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "insurance_policies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_insurance_history" ("action", "created_at", "id", "notes", "policy_id", "vehicle_id") SELECT "action", "created_at", "id", "notes", "policy_id", "vehicle_id" FROM "insurance_history";
DROP TABLE "insurance_history";
ALTER TABLE "new_insurance_history" RENAME TO "insurance_history";
CREATE TABLE "new_insurance_policies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "company_id" TEXT NOT NULL,
    "policy_number" TEXT NOT NULL,
    "start_date" DATETIME NOT NULL,
    "expiry_date" DATETIME NOT NULL,
    "premium_amount" DECIMAL NOT NULL,
    "idv" DECIMAL NOT NULL,
    "ncb" INTEGER NOT NULL DEFAULT 0,
    "commission_rate" DECIMAL NOT NULL,
    "commission_amount" DECIMAL NOT NULL,
    "status_id" TEXT NOT NULL,
    "policy_pdf_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "insurance_policies_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "insurance_policies_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "insurance_policies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "insurance_companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "insurance_policies_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "policy_statuses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_insurance_policies" ("commission_amount", "commission_rate", "company_id", "created_at", "expiry_date", "id", "idv", "ncb", "policy_number", "policy_pdf_url", "premium_amount", "start_date", "status_id", "updated_at", "vehicle_id") SELECT "commission_amount", "commission_rate", "company_id", "created_at", "expiry_date", "id", "idv", "ncb", "policy_number", "policy_pdf_url", "premium_amount", "start_date", "status_id", "updated_at", "vehicle_id" FROM "insurance_policies";
DROP TABLE "insurance_policies";
ALTER TABLE "new_insurance_policies" RENAME TO "insurance_policies";
CREATE UNIQUE INDEX "insurance_policies_policy_number_key" ON "insurance_policies"("policy_number");
CREATE INDEX "insurance_policies_expiry_date_idx" ON "insurance_policies"("expiry_date");
CREATE INDEX "insurance_policies_policy_number_idx" ON "insurance_policies"("policy_number");
CREATE TABLE "new_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "related_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "notifications_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_notifications" ("created_at", "id", "message", "read", "related_id", "title", "type") SELECT "created_at", "id", "message", "read", "related_id", "title", "type" FROM "notifications";
DROP TABLE "notifications";
ALTER TABLE "new_notifications" RENAME TO "notifications";
CREATE TABLE "new_reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "due_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reminders_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "reminders_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "insurance_policies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_reminders" ("created_at", "due_date", "id", "policy_id", "reminder_type", "status", "updated_at") SELECT "created_at", "due_date", "id", "policy_id", "reminder_type", "status", "updated_at" FROM "reminders";
DROP TABLE "reminders";
ALTER TABLE "new_reminders" RENAME TO "reminders";
CREATE UNIQUE INDEX "reminders_policy_id_reminder_type_key" ON "reminders"("policy_id", "reminder_type");
CREATE TABLE "new_vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "customer_id" TEXT NOT NULL,
    "vehicle_number" TEXT NOT NULL,
    "vehicle_type" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "manufacturing_year" INTEGER NOT NULL,
    "engine_number" TEXT,
    "chassis_number" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "vehicles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_vehicles" ("brand", "chassis_number", "created_at", "customer_id", "engine_number", "fuel_type", "id", "manufacturing_year", "model", "updated_at", "vehicle_number", "vehicle_type") SELECT "brand", "chassis_number", "created_at", "customer_id", "engine_number", "fuel_type", "id", "manufacturing_year", "model", "updated_at", "vehicle_number", "vehicle_type" FROM "vehicles";
DROP TABLE "vehicles";
ALTER TABLE "new_vehicles" RENAME TO "vehicles";
CREATE UNIQUE INDEX "vehicles_vehicle_number_key" ON "vehicles"("vehicle_number");
CREATE UNIQUE INDEX "vehicles_engine_number_key" ON "vehicles"("engine_number");
CREATE UNIQUE INDEX "vehicles_chassis_number_key" ON "vehicles"("chassis_number");
CREATE INDEX "vehicles_vehicle_number_idx" ON "vehicles"("vehicle_number");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
