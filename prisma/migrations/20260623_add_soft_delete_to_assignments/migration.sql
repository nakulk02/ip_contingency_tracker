-- AddColumn
ALTER TABLE "AssignmentAgreement" ADD COLUMN "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "AssignmentAgreement_deletedAt_idx" ON "AssignmentAgreement"("deletedAt");
