import { folderSlug, UNASSIGNED_DIR } from "./paths";

export type InboxChild = {
  id: string;
  fullName: string;
  nickname: string | null;
  birthDate?: Date;
};

export function matchChildFolder(
  folderName: string,
  children: InboxChild[]
): InboxChild | "unassigned" | null {
  const slug = folderSlug(folderName);
  if (!slug) return null;
  if (slug === UNASSIGNED_DIR) return "unassigned";

  const matches = children.filter((child) => {
    const names = [child.nickname, child.fullName].filter(Boolean) as string[];
    return names.some((name) => folderSlug(name) === slug);
  });

  return matches[0] ?? null;
}

export function resolveChildForFile(
  folderName: string | null,
  children: InboxChild[]
): InboxChild | null {
  if (folderName) {
    const matched = matchChildFolder(folderName, children);
    if (matched && matched !== "unassigned") return matched;
    if (matched === "unassigned") {
      return children.length === 1 ? children[0] : null;
    }
  }
  if (!folderName && children.length === 1) return children[0];
  return null;
}
