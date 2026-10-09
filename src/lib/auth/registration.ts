import { prisma } from "@/lib/db/prisma";

/**
 * ALLOW_REGISTRATION="true" keeps sign-up open, "false" closes it.
 * Unset (the default) allows only the very first account — the family owner.
 * Everyone else joins through a one-time invite link.
 */
export async function isRegistrationOpen(): Promise<boolean> {
  const flag = process.env.ALLOW_REGISTRATION;
  if (flag === "true") return true;
  if (flag === "false") return false;
  return (await prisma.user.count()) === 0;
}
