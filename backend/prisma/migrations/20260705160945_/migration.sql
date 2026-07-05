-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_renewal_logs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "old_policy_id" TEXT NOT NULL,
    "new_policy_id" TEXT,
    "renewed_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "renewed_by_user_id" TEXT NOT NULL,
    "notes" TEXT,
    CONSTRAINT "renewal_logs_old_policy_id_fkey" FOREIGN KEY ("old_policy_id") REFERENCES "insurance_policies" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "renewal_logs_new_policy_id_fkey" FOREIGN KEY ("new_policy_id") REFERENCES "insurance_policies" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "renewal_logs_renewed_by_user_id_fkey" FOREIGN KEY ("renewed_by_user_id") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_renewal_logs" ("id", "new_policy_id", "notes", "old_policy_id", "renewed_at", "renewed_by_user_id") SELECT "id", "new_policy_id", "notes", "old_policy_id", "renewed_at", "renewed_by_user_id" FROM "renewal_logs";
DROP TABLE "renewal_logs";
ALTER TABLE "new_renewal_logs" RENAME TO "renewal_logs";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "customers_user_id_idx" ON "customers"("user_id");

-- CreateIndex
CREATE INDEX "documents_user_id_idx" ON "documents"("user_id");

-- CreateIndex
CREATE INDEX "insurance_history_user_id_idx" ON "insurance_history"("user_id");

-- CreateIndex
CREATE INDEX "insurance_policies_user_id_idx" ON "insurance_policies"("user_id");

-- CreateIndex
CREATE INDEX "notifications_user_id_idx" ON "notifications"("user_id");

-- CreateIndex
CREATE INDEX "reminders_user_id_idx" ON "reminders"("user_id");

-- CreateIndex
CREATE INDEX "vehicles_user_id_idx" ON "vehicles"("user_id");
