import { readFile } from "node:fs/promises";
import path from "node:path";

/** Role names from the first column of the table in docs/roles.md, skipping the header and separator rows. */
export function parseRoles(md: string): string[] {
  const rows = md.split(/\r?\n/).filter((l) => l.trim().startsWith("|"));
  const roles: string[] = [];
  for (const row of rows.slice(2)) {
    const first = row.split("|")[1]?.trim() ?? "";
    if (first && !/^[-: ]+$/.test(first)) roles.push(first.replace(/\*\*/g, ""));
  }
  return [...new Set(roles)];
}

async function readDoc(name: string): Promise<string> {
  try {
    return await readFile(path.join(process.cwd(), "docs", name), "utf8");
  } catch {
    return "";
  }
}

export async function readGlossary(): Promise<string> {
  return (await readDoc("glossary.md")) || "No glossary found (docs/glossary.md).";
}

export async function readRoles(): Promise<string[]> {
  return parseRoles(await readDoc("roles.md"));
}
