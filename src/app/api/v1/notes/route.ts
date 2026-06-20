import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";
import { parsePagination, paginatedResponse, handleApiError } from "@/lib/api-utils";
import { rateLimit } from "@/lib/rate-limit";

const createNoteSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
});

export async function GET(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const { page, limit, skip } = parsePagination(req);
  const where = { userId: session!.user.id };

  const [notes, total] = await Promise.all([
    prisma.note.findMany({
      where,
      orderBy: { updatedAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.note.count({ where }),
  ]);

  return paginatedResponse(notes, total, page, limit);
}

export async function POST(req: Request) {
  const limited = await rateLimit(req);
  if (limited) return limited;

  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  try {
    const body = await req.json();
    const { title, body: noteBody } = createNoteSchema.parse(body);

    const note = await prisma.note.create({
      data: { title, body: noteBody, userId: session!.user.id },
    });

    return NextResponse.json({ data: note }, { status: 201 });
  } catch (err) {
    return handleApiError(err);
  }
}
