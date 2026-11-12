import { z } from "zod";

/**
 * Input guardrails for the intelligence assistant.
 *
 * These run before any model call, so a rejected question costs nothing. The
 * assistant's system prompt adds a second, model-side layer: it tells the
 * model to decline anything outside IP assignment compliance and to answer
 * only from tool results.
 */

export const MAX_QUESTION_LENGTH = 1_000;
export const MIN_QUESTION_LENGTH = 5;

export const assistantRequestSchema = z.object({
  question: z
    .string()
    .trim()
    .min(MIN_QUESTION_LENGTH, `question must be at least ${MIN_QUESTION_LENGTH} characters`)
    .max(
      MAX_QUESTION_LENGTH,
      `question exceeds maximum length of ${MAX_QUESTION_LENGTH} characters`
    ),
});

/** Strip control characters and collapse whitespace. */
export function normalizeQuestion(raw: string): string {
  return raw
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Words that signal a question is about this app's domain. A question has to
 * contain at least one of them. The list is deliberately broad: it is cheaper
 * to let a borderline question through to the model (which can still decline)
 * than to block a real one.
 */
const TOPIC_PATTERN = new RegExp(
  [
    "\\bip\\b",
    "intellectual property",
    "patent",
    "trademark",
    "assign",
    "\\bgaps?\\b",
    "complian",
    "jurisdiction",
    "contractor",
    "employee",
    "founder",
    "advisor",
    "inventor",
    "\\brisk",
    "agreement",
    "ownership",
    "\\bfil(e|ed|ing)\\b",
    "advisory",
    "anomal",
    "priorit",
    "overdue",
    "\\bassets?\\b",
    "portfolio",
    "unsigned",
    "\\bsign(ed)?\\b",
    "missing",
    "pending",
    "due diligence",
    "counsel",
    "fix first",
    "resolve",
  ].join("|"),
  "i"
);

/** Common prompt-injection phrasings. Matching one rejects the question outright. */
const INJECTION_PATTERN =
  /(ignore (all |any |the )?(previous|prior|above|earlier) (instructions|prompts|rules)|disregard (your|the) (instructions|rules)|(reveal|print|show) (your|the) (system )?prompt|you are now\b|developer mode|jailbreak)/i;

export type GuardrailResult =
  | { ok: true; question: string }
  | { ok: false; reason: "off_topic" | "prompt_injection"; message: string };

export const OFF_TOPIC_MESSAGE =
  "I can only help with IP assignment compliance: ownership gaps, assignment agreements, " +
  "jurisdiction rules, risk and priorities for this company's patents and trademarks.";

export function checkQuestion(raw: string): GuardrailResult {
  const question = normalizeQuestion(raw);

  if (INJECTION_PATTERN.test(question)) {
    return {
      ok: false,
      reason: "prompt_injection",
      message:
        "This request looks like an attempt to change the assistant's instructions, so it was not run.",
    };
  }

  if (!TOPIC_PATTERN.test(question)) {
    return { ok: false, reason: "off_topic", message: OFF_TOPIC_MESSAGE };
  }

  return { ok: true, question };
}
