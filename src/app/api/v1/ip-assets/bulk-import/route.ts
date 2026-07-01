import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { asyncHandler } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { parseAssetsFromCSV } from "@/lib/csv-parser";
import { csvImportSchema } from "@/lib/validation";
import { ValidationError } from "@/lib/errors";

/**
 * POST /api/v1/ip-assets/bulk-import
 * Import multiple IP assets from CSV
 *
 * Expected CSV format:
 * type,title,jurisdiction,filingDate,status,registrationNumber,description
 * PATENT,Machine Learning Algorithm,US,2020-01-15,FILED,US123456,AI patent
 * TRADEMARK,TechCorp Logo,US,2021-06-01,REGISTERED,TM789012,Company logo
 */
export const POST = asyncHandler(async (req: Request) => {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await req.json();
  const { csv } = csvImportSchema.parse(body);

  const { success, errors } = parseAssetsFromCSV(csv);

  if (success.length === 0) {
    throw new ValidationError("No valid rows to import", errors);
  }

  // Bulk insert in transaction
  const created = await prisma.$transaction(
    success.map((asset) => prisma.ipAsset.create({ data: asset }))
  );

  return NextResponse.json(
    {
      data: {
        imported: created.length,
        errors: errors.length > 0 ? errors : undefined,
        assets: created,
      },
    },
    { status: 201 }
  );
});
