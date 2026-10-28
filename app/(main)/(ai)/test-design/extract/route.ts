import { getCurrentUser } from "@/lib/auth/session";
import { ExtractError, extractRequirementText, MAX_FILE_BYTES } from "@/lib/test-design/extract";
import { aiWorkbenchAllowed } from "@/lib/workspace";

// Node.js runtime (CLAUDE.md rule 5): Cache Components always uses it and rejects a `runtime` export.

/** POST multipart `file` → `{ text, fileName }`. Nothing is stored; the user reviews the text before saving. */
export async function POST(req: Request) {
  if (!(await aiWorkbenchAllowed(await getCurrentUser()))) return Response.json({ error: "Not found" }, { status: 404 });
  const len = Number(req.headers.get("content-length") ?? 0);
  if (len > MAX_FILE_BYTES + 64 * 1024) return Response.json({ error: "The file is larger than 5 MB." }, { status: 413 });

  let file: FormDataEntryValue | null;
  try {
    file = (await req.formData()).get("file");
  } catch {
    return Response.json({ error: "Upload a file in the \"file\" field." }, { status: 400 });
  }
  if (!(file instanceof File)) return Response.json({ error: "Upload a file in the \"file\" field." }, { status: 400 });

  try {
    const text = await extractRequirementText(file.name, new Uint8Array(await file.arrayBuffer()));
    return Response.json({ text, fileName: file.name.slice(0, 255) });
  } catch (e) {
    if (e instanceof ExtractError) return Response.json({ error: e.message }, { status: 422 });
    console.error(`[test-design] extract failed for a ${file.name.split(".").pop()} file: ${e instanceof Error ? e.message.slice(0, 200) : "unknown"}`);
    return Response.json({ error: "The file couldn't be read. Paste the text instead." }, { status: 500 });
  }
}
