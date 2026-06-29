import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { rateLimit } from "@/lib/rate-limit";
import { parseAssetsFromCSV } from "@/lib/csv-parser";

/**
 * POST /api/v1/ip-assets/bulk-import
 * Import multiple IP assets from CSV
 * 
 * Expected CSV format:
 * type,title,jurisdiction,filingDate,status,registrationNumber,description
 * PATENT,Machine Learning Algorithm,US,2020-01-15,FILED,US123456,AI patent
 * TRADEMARK,TechCorp Logo,US,2021-06-01,REGISTERED,TM789012,Company logo
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

    const { success, errors } = parseAssetsFromCSV(csv);

    if (success.length === 0) {
      return NextResponse.json(
        { error: "No valid rows to import", details: errors },
        { status: 400 }
      );
    }

    // Bulk insert in transaction
    const created = await prisma.$transaction(
      success.map((asset) =>
        prisma.ipAsset.create({ data: asset })
      )
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
  } catch (err) {
    console.error("[Bulk Import Error]", err);
    return NextResponse.json({ error: "Import failed" }, { status: 500 });
  }
}
