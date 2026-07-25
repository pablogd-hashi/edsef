import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db/prisma";
import { requireParentSession } from "@/lib/api/require-parent";

const createLocationSchema = z.object({
  childId: z.string().cuid(),
  name: z.string().min(1).max(200),
  city: z.string().max(200).optional(),
  country: z.string().max(200).optional(),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export async function POST(request: Request) {
  const body = await request.json();
  const parsed = createLocationSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { childId, name, city, country, latitude, longitude } = parsed.data;
  const auth = await requireParentSession(childId);
  if (auth.error) return auth.error;

  const child = await prisma.child.findUnique({
    where: { id: childId },
    select: { familyId: true },
  });
  if (!child) {
    return NextResponse.json({ error: "Child not found" }, { status: 404 });
  }

  const existing = await prisma.location.findFirst({
    where: {
      familyId: child.familyId,
      name,
      city: city ?? null,
      latitude: latitude ?? null,
      longitude: longitude ?? null,
    },
  });

  if (existing) {
    return NextResponse.json(existing);
  }

  const location = await prisma.location.create({
    data: {
      familyId: child.familyId,
      name,
      city,
      country,
      latitude,
      longitude,
    },
  });

  return NextResponse.json(location, { status: 201 });
}
