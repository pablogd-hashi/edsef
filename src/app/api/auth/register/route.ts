import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { registerSchema } from "@/lib/validators";

export async function POST(request: Request) {
  if (process.env.ALLOW_REGISTRATION === "false") {
    return NextResponse.json(
      { error: "Registration is disabled on this server." },
      { status: 403 },
    );
  }

  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email: parsed.data.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "This email is already registered" },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(parsed.data.password, 12);

    const user = await prisma.$transaction(async (tx) => {
      const newUser = await tx.user.create({
        data: {
          name: parsed.data.name,
          email: parsed.data.email,
          passwordHash,
        },
      });

      const family = await tx.family.create({
        data: { name: `${parsed.data.name}'s family` },
      });

      await tx.familyMember.create({
        data: {
          familyId: family.id,
          userId: newUser.id,
          role: "OWNER",
        },
      });

      return newUser;
    });

    return NextResponse.json(
      { id: user.id, email: user.email, name: user.name },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
