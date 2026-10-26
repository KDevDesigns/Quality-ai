import mammoth from "mammoth";
import { extractText as extractPdfText, getDocumentProxy } from "unpdf";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_TEXT_CHARS = 60_000;
export const ACCEPTED_EXTENSIONS = [".md", ".txt", ".docx", ".pdf"] as const;

/** A problem with the uploaded file that the user can fix; the message is shown as is. */
export class ExtractError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExtractError";
  }
}

function extension(name: string): string {
  const i = name.lastIndexOf(".");
  return i < 0 ? "" : name.slice(i).toLowerCase();
}

export function cleanText(s: string): string {
  return s
    .replace(/^﻿/, "")
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

async function readPdf(data: Uint8Array): Promise<string> {
  let doc;
  try {
    doc = await getDocumentProxy(data);
  } catch {
    throw new ExtractError("This PDF couldn't be opened. It may be damaged or password-protected.");
  }
  const { text } = await extractPdfText(doc, { mergePages: true });
  return text;
}

async function readDocx(data: Uint8Array): Promise<string> {
  try {
    const { value } = await mammoth.extractRawText({ buffer: Buffer.from(data) });
    return value;
  } catch {
    throw new ExtractError("This .docx file couldn't be read. Save it again from Word, or paste the text instead.");
  }
}

/** Plain text from an uploaded requirement document (.md, .txt, .docx, or a PDF that has a text layer). */
export async function extractRequirementText(fileName: string, data: Uint8Array): Promise<string> {
  const ext = extension(fileName);
  if (!(ACCEPTED_EXTENSIONS as readonly string[]).includes(ext)) {
    throw new ExtractError(`Unsupported file type "${ext || "none"}". Upload ${ACCEPTED_EXTENSIONS.join(", ")}.`);
  }
  if (data.byteLength > MAX_FILE_BYTES) throw new ExtractError("The file is larger than 5 MB. Split it or paste the relevant part.");
  if (data.byteLength === 0) throw new ExtractError("The file is empty.");

  let raw: string;
  if (ext === ".pdf") raw = await readPdf(data);
  else if (ext === ".docx") raw = await readDocx(data);
  else raw = new TextDecoder("utf-8").decode(data);

  const text = cleanText(raw);
  if (!text) {
    throw new ExtractError(ext === ".pdf" ? "No text found. This looks like a scanned PDF; paste the text instead." : "The file has no text.");
  }
  if (text.length > MAX_TEXT_CHARS) {
    throw new ExtractError(`The text is ${text.length.toLocaleString("en-US")} characters; the limit is ${MAX_TEXT_CHARS.toLocaleString("en-US")}. Split the document and upload one part at a time.`);
  }
  return text;
}
