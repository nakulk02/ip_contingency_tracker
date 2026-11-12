/**
 * Personal-information redaction for anything the assistant logs or audits.
 *
 * Audit rows and log lines record which tool ran on which gap ids, never the
 * names or emails of the people involved. Tool inputs from the model are
 * mostly ids and filters already. Free text (the user's question, or a
 * question the model passes to queryAssignments) goes through redactText().
 */

const EMAIL = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi;
const PHONE =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(\d{2,4}\)[\s.-]?)?\d{3,4}[\s.-]\d{3,4}(?:[\s.-]\d{2,4})?/g;
const US_SSN = /\b\d{3}-\d{2}-\d{4}\b/g;
const LONG_NUMBER = /\b\d{9,}\b/g;

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Replace emails, phone numbers, SSN-like and long numeric ids, and any of
 * the given known names (for example the people in the gap set) with
 * placeholders.
 */
export function redactText(text: string, knownNames: string[] = []): string {
  let out = text
    .replace(EMAIL, "[email]")
    .replace(US_SSN, "[id-number]")
    .replace(PHONE, "[phone]")
    .replace(LONG_NUMBER, "[number]");

  const names = [...new Set(knownNames.filter((n) => n && n.trim().length > 1))].sort(
    (a, b) => b.length - a.length
  );
  for (const name of names) {
    out = out.replace(new RegExp(`\\b${escapeRegExp(name.trim())}\\b`, "gi"), "[person]");
    // Also catch a first name or surname used on its own.
    for (const part of name.trim().split(/\s+/)) {
      if (part.length > 2)
        out = out.replace(new RegExp(`\\b${escapeRegExp(part)}\\b`, "gi"), "[person]");
    }
  }
  return out;
}

/**
 * Redact every string value in a JSON-like object. Keys are kept, so the
 * audit row still shows which arguments were passed.
 */
export function redactValue(value: unknown, knownNames: string[] = []): unknown {
  if (typeof value === "string") return redactText(value, knownNames);
  if (Array.isArray(value)) return value.map((v) => redactValue(v, knownNames));
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k,
        redactValue(v, knownNames),
      ])
    );
  }
  return value;
}
