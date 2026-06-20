-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('PATENT', 'TRADEMARK');

-- CreateEnum
CREATE TYPE "AssetStatus" AS ENUM ('DRAFT', 'FILED', 'PUBLISHED', 'REGISTERED', 'EXPIRED', 'ABANDONED');

-- CreateEnum
CREATE TYPE "PersonRole" AS ENUM ('FOUNDER', 'EMPLOYEE', 'CONTRACTOR', 'ADVISOR');

-- CreateTable
CREATE TABLE "IpAsset" (
    "id" TEXT NOT NULL,
    "type" "AssetType" NOT NULL,
    "title" TEXT NOT NULL,
    "jurisdiction" TEXT NOT NULL,
    "filingDate" TIMESTAMP(3),
    "status" "AssetStatus" NOT NULL DEFAULT 'DRAFT',
    "registrationNumber" TEXT,
    "description" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "IpAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Person" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "role" "PersonRole" NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL,
    "endDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);
