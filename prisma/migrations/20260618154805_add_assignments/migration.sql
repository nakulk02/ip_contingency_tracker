-- CreateEnum
CREATE TYPE "AgreementStatus" AS ENUM ('SIGNED', 'MISSING', 'PENDING');

-- CreateEnum
CREATE TYPE "AgreementScope" AS ENUM ('COMPANY_WIDE', 'ASSET_SPECIFIC');

-- CreateTable
CREATE TABLE "AssignmentAgreement" (
    "id" TEXT NOT NULL,
    "personId" TEXT NOT NULL,
    "ipAssetId" TEXT,
    "scope" "AgreementScope" NOT NULL DEFAULT 'COMPANY_WIDE',
    "signedDate" TIMESTAMP(3),
    "fileReference" TEXT,
    "status" "AgreementStatus" NOT NULL DEFAULT 'MISSING',
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AssignmentAgreement_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssignmentAgreement" ADD CONSTRAINT "AssignmentAgreement_personId_fkey" FOREIGN KEY ("personId") REFERENCES "Person"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AssignmentAgreement" ADD CONSTRAINT "AssignmentAgreement_ipAssetId_fkey" FOREIGN KEY ("ipAssetId") REFERENCES "IpAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;
