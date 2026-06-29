import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { parsePeopleFromCSV } from "@/lib/csv-parser";

/**
 * POST /api/v1/people/bulk-import
 * Import multiple people from CSV
 * 
 * Expected CSV format:
 * name,email,role,startDate,endDate
 * John Doe,john@example.com,FOUNDER,2020-01-01,
 * Jane Smith,jane@example.com,EMPLOYEE,2021-06-15,
 */
export async function POST(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  try {
    const body = await req.json();
    const { csv } = body;

    if (!csv || typeof csv !== "string") {
      return NextResponse.json({ error: "CSV content required" }, { status: 400 });
    }

    const { success, errors } = parsePeopleFromCSV(csv);

    if (success.length === 0) {
      return NextResponse.json(
        { error: "No valid rows to import", details: errors },
        { status: 400 }
      );
    }

    // Bulk insert in transaction
    const created = await prisma.$transaction(
      success.map((person) =>
        prisma.person.create({ data: person })
      )
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
  } catch (err) {
    console.error("[Bulk Import Error]", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
