import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionOrUnauthorized } from "@/lib/auth-utils";

const createNoteSchema = z.object({
  title: z.string().min(1),
  body: z.string().optional(),
});

export async function GET() {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  const notes = await prisma.note.findMany({
    where: { userId: session!.user.id },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ data: notes });
}

export async function POST(req: Request) {
  const { session, error } = await getSessionOrUnauthorized();
  if (error) return error;

  try {
    const body = await req.json();
    const { title, body: noteBody } = createNoteSchema.parse(body);

    const note = await prisma.note.create({
      data: { title, body: noteBody, userId: session!.user.id },
    });

    return NextResponse.json({ data: note });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid input", details: err.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
