-- CreateTable
CREATE TABLE "Role" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "refresh_token" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "Role" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "customers" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "full_name" TEXT NOT NULL,
    "mobile_number" TEXT NOT NULL,
    "alternate_number" TEXT,
    "whatsapp_number" TEXT,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "customer_addresses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "address_line1" TEXT NOT NULL,
    "address_line2" TEXT,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "pincode" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "customer_addresses_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "vehicles" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "vehicles_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "insurance_companies" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "logo_url" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "policy_statuses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "insurance_policies" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    CONSTRAINT "insurance_policies_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "insurance_policies_company_id_fkey" FOREIGN KEY ("company_id") REFERENCES "insurance_companies" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "insurance_policies_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "policy_statuses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "insurance_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "vehicle_id" TEXT NOT NULL,
    "policy_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "insurance_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicles" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "insurance_history_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "insurance_policies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "reminders" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "policy_id" TEXT NOT NULL,
    "reminder_type" TEXT NOT NULL,
    "due_date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "reminders_policy_id_fkey" FOREIGN KEY ("policy_id") REFERENCES "insurance_policies" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "related_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "customer_id" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "file_path" TEXT NOT NULL,
    "file_size" INTEGER NOT NULL,
    "mime_type" TEXT NOT NULL,
    "uploaded_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "customers" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "renewal_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "old_policy_id" TEXT NOT NULL,
    "new_policy_id" TEXT,
    "renewed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewed_by_user_id" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "renewal_logs_old_policy_id_fkey" FOREIGN KEY ("old_policy_id") REFERENCES "insurance_policies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "renewal_logs_new_policy_id_fkey" FOREIGN KEY ("new_policy_id") REFERENCES "insurance_policies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "renewal_logs_renewed_by_user_id_fkey" FOREIGN KEY ("renewed_by_user_id") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "activity_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "user_id" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "details" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "activity_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role"("name");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_email_idx" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "customers_mobile_number_key" ON "customers"("mobile_number");

-- CreateIndex
CREATE INDEX "customers_full_name_idx" ON "customers"("full_name");

-- CreateIndex
CREATE INDEX "customers_mobile_number_idx" ON "customers"("mobile_number");

-- CreateIndex
CREATE UNIQUE INDEX "customer_addresses_customer_id_key" ON "customer_addresses"("customer_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_vehicle_number_key" ON "vehicles"("vehicle_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_engine_number_key" ON "vehicles"("engine_number");

-- CreateIndex
CREATE UNIQUE INDEX "vehicles_chassis_number_key" ON "vehicles"("chassis_number");

-- CreateIndex
CREATE INDEX "vehicles_vehicle_number_idx" ON "vehicles"("vehicle_number");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_companies_name_key" ON "insurance_companies"("name");

-- CreateIndex
CREATE UNIQUE INDEX "policy_statuses_name_key" ON "policy_statuses"("name");

-- CreateIndex
CREATE UNIQUE INDEX "insurance_policies_policy_number_key" ON "insurance_policies"("policy_number");

-- CreateIndex
CREATE INDEX "insurance_policies_expiry_date_idx" ON "insurance_policies"("expiry_date");

-- CreateIndex
CREATE INDEX "insurance_policies_policy_number_idx" ON "insurance_policies"("policy_number");

-- CreateIndex
CREATE UNIQUE INDEX "reminders_policy_id_reminder_type_key" ON "reminders"("policy_id", "reminder_type");
