import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { rateLimitAuth } from "@/lib/rate-limit";
import { asyncHandler } from "@/lib/api-utils";
import { ValidationError } from "@/lib/errors";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1).optional(),
});

export const POST = asyncHandler(async (req: Request) => {
  const limited = await rateLimitAuth(req);
  if (limited) return limited;

  const body = await req.json();
  const { email, password, name } = registerSchema.parse(body);

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new ValidationError("Email already registered");
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { email, hashedPassword, name },
  });

  return NextResponse.json({
    data: { id: user.id, email: user.email, name: user.name },
  });
});
