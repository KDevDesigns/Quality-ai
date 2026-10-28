/** Only same-site paths, so a crafted `?next=` can't send someone off to another site after sign-in. */
export function safeNext(v: string | null | undefined): string {
  if (!v || !v.startsWith("/") || v.startsWith("//") || v.startsWith("/\\")) return "/";
  // Browsers strip tabs and newlines from URLs, which would turn "/\t/evil.example" into "//evil.example".
  if (/[\u0000-\u001f\u007f]/.test(v)) return "/";
  return v;
}
