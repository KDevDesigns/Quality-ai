export type RedactionType = "EMAIL" | "ACCOUNT" | "METER" | "OR" | "TIN" | "GOV_ID" | "CUSTOM" | "PHONE" | "AMOUNT" | "NAME" | "NUMBER";

const TYPE_ORDER: RedactionType[] = ["EMAIL", "CUSTOM", "ACCOUNT", "METER", "OR", "TIN", "GOV_ID", "PHONE", "AMOUNT", "NAME", "NUMBER"];

export type CustomPattern = { label: string; pattern: string };

export type RedactOptions = {
  /** People to mask, e.g. "Juan Dela Cruz" or "Dela Cruz, Juan". Matched case- and accent-insensitively. */
  names?: readonly string[];
  /** Extra formats, e.g. { label: "ACCT", pattern: "\\b\\d{2}-\\d{3}-\\d{4}-\\d\\b" }. */
  patterns?: readonly CustomPattern[];
  /** Mask peso amounts (default true). */
  amounts?: boolean;
};

export type RedactFinding = { type: RedactionType; count: number };

export type RedactResult = {
  text: string;
  total: number;
  findings: RedactFinding[];
  /** placeholder -> original. Keep in memory only; never log or persist it. */
  mapping: ReadonlyMap<string, string>;
};

const PLACEHOLDER = /\[[A-Z][A-Z0-9_]*_\d+\]/g;

function normalizeKey(s: string): string {
  return s
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLowerCase()
    .replace(/[\s.,\-()+]+/g, "");
}

class Context {
  private counters = new Map<string, number>();
  private byKey = new Map<string, string>();
  readonly mapping = new Map<string, string>();
  readonly counts = new Map<RedactionType, number>();

  token(type: RedactionType, label: string, original: string, key = normalizeKey(original)): string {
    const k = `${label}:${key}`;
    let ph = this.byKey.get(k);
    if (!ph) {
      const n = (this.counters.get(label) ?? 0) + 1;
      this.counters.set(label, n);
      ph = `[${label}_${n}]`;
      this.byKey.set(k, ph);
      this.mapping.set(ph, original);
    }
    this.counts.set(type, (this.counts.get(type) ?? 0) + 1);
    return ph;
  }
}

/** Applies `re` only to the text between existing placeholders, so placeholders are never re-redacted. */
function replaceOutside(text: string, re: RegExp, fn: (match: string, ...groups: string[]) => string): string {
  let out = "";
  let last = 0;
  for (const m of text.matchAll(PLACEHOLDER)) {
    out += text.slice(last, m.index).replace(re, fn as (substring: string, ...args: unknown[]) => string);
    out += m[0];
    last = m.index + m[0].length;
  }
  return out + text.slice(last).replace(re, fn as (substring: string, ...args: unknown[]) => string);
}

// An identifier value: 4+ chars of letters/digits/hyphens containing at least one digit.
const VALUE = String.raw`((?=[A-Za-z0-9-]*\d)[A-Za-z0-9][A-Za-z0-9-]{2,}[A-Za-z0-9])`;
const SEP = String.raw`\s*(?:no\.?|nos\.?|number|num\.?|#)?\s*[:#.]?\s*`;

const LABELED: { type: RedactionType; label: string; re: RegExp }[] = [
  { type: "ACCOUNT", label: "ACCOUNT", re: new RegExp(String.raw`\b((?:account|acct|customer|cust|consumer|concessionaire)\.?` + SEP + ")" + VALUE, "gi") },
  { type: "METER", label: "METER", re: new RegExp(String.raw`\b((?:water\s+)?(?:meter|mtr)\.?(?:\s*serial)?` + SEP + ")" + VALUE, "gi") },
  // "OR" must be uppercase and followed by No./#/Number so the English word "or" is never matched.
  { type: "OR", label: "OR", re: new RegExp(String.raw`(?<![A-Za-z])((?:O\.R\.|OR|[Oo]fficial\s+[Rr]eceipt)\s*(?:[Nn][Oo][Ss]?\.?|[Nn]umber|#)\s*[:#.]?\s*)` + VALUE, "g") },
  { type: "TIN", label: "TIN", re: new RegExp(String.raw`\b(TIN` + SEP + ")" + VALUE, "gi") },
  { type: "GOV_ID", label: "GOV_ID", re: new RegExp(String.raw`\b((?:SSS|GSIS(?:\s+BP)?|BP|PhilHealth|PHIC|Pag-?IBIG|HDMF|MID|CRN|UMID)` + SEP + ")" + VALUE, "gi") },
];

const FORMATS: { type: RedactionType; label: string; re: RegExp }[] = [
  { type: "TIN", label: "TIN", re: /(?<![\d-])\d{3}-\d{3}-\d{3}(?:-\d{3,5})?(?![\d-])/g },
  { type: "GOV_ID", label: "GOV_ID", re: /(?<![\d-])(?:\d{2}-\d{7}-\d|\d{2}-\d{9}-\d|\d{4}-\d{4}-\d{4})(?![\d-])/g },
];

const PHONES: RegExp[] = [
  // Mobile: 09171234567, 0917-123-4567, +63 917 123 4567, 639171234567
  /(?<![\d+])(?:\+?63|0)[\s-]?9\d{2}[\s-]?\d{3}[\s-]?\d{4}(?!\d)/g,
  // Landline: (082) 221-0021, 082-221-0021, +63 82 221 0021, (02) 8123-4567
  /(?<![\d+])(?:\+?63[\s-]?\(?\d{1,2}\)?[\s-]?|\(0?\d{1,2}\)\s?|0\d{1,2}[\s-])\d{3,4}[\s-]?\d{4}(?!\d)/g,
];

const NUMBER_BODY = String.raw`(?:\d{1,3}(?:,\d{3})+|\d+)(?:\.\d{1,2})?`;
const AMOUNT = new RegExp(
  String.raw`(?:₱|\bPHP|\bPhp|\bP(?=\s?\d))\s?` + NUMBER_BODY + String.raw`(?![\d\w])|\b` + NUMBER_BODY + String.raw`\s?(?:pesos|PHP)\b`,
  "g",
);

const LONG_NUMBER = /(?<![\w-])\d(?:-?\d){6,}(?![\w-])/g;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

const VARIANTS: Record<string, string> = {
  a: "aáàâäã",
  e: "eéèêë",
  i: "iíìîï",
  o: "oóòôöõ",
  u: "uúùûü",
  n: "nñ",
  c: "cç",
};

function escapeRe(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function nameCharPattern(ch: string): string {
  if (/\s/.test(ch)) return String.raw`[\s ]+`;
  if (ch === "-") return String.raw`[-\s]?`;
  if (ch === ".") return String.raw`\.?`;
  if (ch === ",") return String.raw`\s*,\s*`;
  const base = ch.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const v = VARIANTS[base];
  return v ? `[${v}]` : escapeRe(ch);
}

function nameVariants(entry: string): string[] {
  // Commas carry their own flexible spacing in the pattern, so strip the spaces around them here.
  const clean = entry.trim().replace(/\s+/g, " ").replace(/\s*,\s*/g, ",");
  if (clean.length < 2) return [];
  const out = new Set<string>([clean]);
  if (clean.includes(",")) {
    const [surname, given] = clean.split(",");
    if (surname && given) out.add(`${given} ${surname}`);
  } else {
    const tokens = clean.split(" ");
    for (let k = 1; k < tokens.length; k++) out.add(`${tokens.slice(k).join(" ")},${tokens.slice(0, k).join(" ")}`);
  }
  return [...out].sort((a, b) => b.length - a.length);
}

function nameRegex(entry: string): RegExp | null {
  const variants = nameVariants(entry);
  if (!variants.length) return null;
  const body = variants.map((v) => [...v].map(nameCharPattern).join("")).join("|");
  return new RegExp(String.raw`(?<![\p{L}\p{N}])(?:` + body + String.raw`)(?![\p{L}\p{N}])`, "giu");
}

export function sanitizeLabel(label: string): string {
  const s = label.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 20);
  return s && /^[A-Z]/.test(s) ? s : "ID";
}

/** Throws if a custom pattern is not a valid regex; used when Settings are saved. */
export function compileCustomPattern(p: CustomPattern): RegExp {
  const re = new RegExp(p.pattern, "g");
  if (re.test("")) throw new Error(`Pattern "${p.label}" matches empty text`);
  re.lastIndex = 0;
  return re;
}

export function redact(input: string, opts: RedactOptions = {}): RedactResult {
  const ctx = new Context();
  let text = input;

  text = replaceOutside(text, /[A-Za-z0-9._%+-]+@[A-Za-z0-9-]+(?:\.[A-Za-z0-9-]+)*\.[A-Za-z]{2,}/g, (m) => ctx.token("EMAIL", "EMAIL", m));

  // Custom formats are exact and user-defined, so they take precedence over the generic labeled rules.
  for (const p of opts.patterns ?? []) {
    const label = sanitizeLabel(p.label);
    text = replaceOutside(text, compileCustomPattern(p), (m) => ctx.token("CUSTOM", label, m));
  }

  for (const rule of LABELED) {
    text = replaceOutside(text, rule.re, (_m, label, value) => label + ctx.token(rule.type, rule.label, value));
  }

  for (const rule of FORMATS) {
    text = replaceOutside(text, rule.re, (m) => ctx.token(rule.type, rule.label, m));
  }

  for (const re of PHONES) {
    text = replaceOutside(text, re, (m) => ctx.token("PHONE", "PHONE", m));
  }

  if (opts.amounts !== false) {
    text = replaceOutside(text, AMOUNT, (m) => ctx.token("AMOUNT", "AMOUNT", m));
  }

  const entries = [...new Set((opts.names ?? []).map((n) => n.trim()).filter(Boolean))].sort((a, b) => b.length - a.length);
  for (const entry of entries) {
    const re = nameRegex(entry);
    if (re) text = replaceOutside(text, re, (m) => ctx.token("NAME", "NAME", m, normalizeKey(entry)));
  }

  text = replaceOutside(text, LONG_NUMBER, (m) => (ISO_DATE.test(m) ? m : ctx.token("NUMBER", "NUMBER", m)));

  const findings = TYPE_ORDER.filter((t) => ctx.counts.has(t)).map((type) => ({ type, count: ctx.counts.get(type)! }));
  return { text, total: findings.reduce((s, f) => s + f.count, 0), findings, mapping: ctx.mapping };
}
