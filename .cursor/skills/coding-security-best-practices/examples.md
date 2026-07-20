# Examples

## Good: scoped fix with server-side auth

```typescript
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const milestone = await getChildIdFromMilestone(id);
  if (!milestone) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const auth = await requireParentSession(milestone.yearbook.childId);
  if (auth.error) return auth.error;

  const parsed = updateMilestoneSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });

  const updated = await milestoneService.update(id, parsed.data);
  return NextResponse.json(updated);
}
```

## Bad: trusting client role

```typescript
// ❌ Client sends canEdit: true — never sufficient
if (body.canEdit) {
  await prisma.milestone.update({ where: { id }, data: body });
}
```

## Good: path-constrained download

```typescript
const resolved = path.resolve(filePath);
const exportsRoot = path.resolve(STORAGE_ROOT, "exports");
if (!resolved.startsWith(exportsRoot)) {
  return NextResponse.json({ error: "Forbidden" }, { status: 403 });
}
```

## Bad: path traversal

```typescript
// ❌ User controls path query param
const file = path.join(STORAGE_ROOT, searchParams.get("path")!);
return createReadStream(file);
```

## Good: commit message (security fix)

```
fix(auth): enforce parent role on milestone updates

Add requireParentSession to PATCH /api/milestones/[id] so only
OWNER/PARENT can edit content regardless of client UI state.
```

## Review comment examples

**Critical**: `DELETE /api/media/[id]` does not verify the user owns the child linked to this asset — any logged-in user could delete another family's photos.

**Warning**: Upload handler accepts any MIME type when `file.type` is empty — infer from extension allowlist before storing.

**Suggestion**: Consider rate-limiting `POST /api/auth/callback/credentials` if this instance is exposed beyond localhost.
