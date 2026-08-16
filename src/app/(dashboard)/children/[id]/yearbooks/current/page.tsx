import { auth } from "@/lib/auth/config";
import { yearbookService } from "@/lib/services";
import { accessService } from "@/lib/services/access.service";
import { redirect, notFound } from "next/navigation";

export default async function CurrentYearbookPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id || !session.user.familyId) redirect("/login");

  const { id: childId } = await params;
  const canAccess = await accessService.assertChildAccess(session.user.id, childId);
  if (!canAccess) notFound();

  const yearbook = await yearbookService.getOrCreateCurrent(childId, session.user.id);
  redirect(`/children/${childId}/yearbooks/${yearbook.id}?section=timeline`);
}
