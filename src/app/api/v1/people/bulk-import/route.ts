import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { asyncHandler } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";
import { parsePeopleFromCSV } from "@/lib/csv-parser";
import { csvImportSchema } from "@/lib/validation";
import { ValidationError } from "@/lib/errors";

/**
 * POST /api/v1/people/bulk-import
 * Import multiple people from CSV
 *
 * Expected CSV format:
 * name,email,role,startDate,endDate
 * John Doe,john@example.com,FOUNDER,2020-01-01,
 * Jane Smith,jane@example.com,EMPLOYEE,2021-06-15,
 */
export const POST = asyncHandler(async (req: Request) => {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { error } = await getSessionOrUnauthorized();
  if (error) return error;

  const body = await req.json();
  const { csv } = csvImportSchema.parse(body);

  const { success, errors } = parsePeopleFromCSV(csv);

  if (success.length === 0) {
    throw new ValidationError("No valid rows to import", errors);
  }

  // Bulk insert in transaction
  const created = await prisma.$transaction(
    success.map((person) => prisma.person.create({ data: person }))
  );

  return NextResponse.json(
    {
      data: {
        imported: created.length,
        errors: errors.length > 0 ? errors : undefined,
        people: created,
      },
    },
    { status: 201 }
  );
});
