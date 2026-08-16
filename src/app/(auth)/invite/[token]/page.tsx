import { InviteAcceptForm } from "./invite-accept-form";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  return <InviteAcceptForm token={token} />;
}
