/**
 * Assistant eval: npm run eval
 *
 * Runs every question in eval/cases.ts through askAssistant() (guardrails,
 * then the tool-calling agent) against the fixed gap set in eval/fixtures.ts,
 * checks each case's expectations, and prints pass/fail, tools called and
 * latency. Results are also written to eval/results/latest.json.
 *
 *   npm run eval              # all cases (needs ANTHROPIC_API_KEY)
 *   npm run eval -- --offline # guardrail cases only, no API calls
 *
 * Cases that need the model make real API calls, both for the agent and for
 * the ip-contingency-mcp tools it runs.
 */
import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import Anthropic from "@anthropic-ai/sdk";
import { processTool } from "ip-contingency-mcp";
import { askAssistant, type AskResult } from "@/lib/assistant/agent";
import { EVAL_CASES, type EvalCase } from "./cases";
import { EVAL_GAPS } from "./fixtures";

const offline = process.argv.includes("--offline") || !process.env.ANTHROPIC_API_KEY;

function check(c: EvalCase, r: AskResult): string[] {
  const failures: string[] = [];
  const tools = r.trace.map((t) => t.tool);
  const answer = r.answer.toLowerCase();
  const e = c.expect;

  if (e.refused !== undefined && r.refused !== e.refused)
    failures.push(`refused=${r.refused}, expected ${e.refused}`);
  for (const t of e.tools ?? []) if (!tools.includes(t)) failures.push(`did not call ${t}`);
  if (e.anyTool && !e.anyTool.some((t) => tools.includes(t)))
    failures.push(`called none of ${e.anyTool.join("/")}`);
  if (e.minTools !== undefined && tools.length < e.minTools)
    failures.push(`${tools.length} tool calls < ${e.minTools}`);
  if (e.maxTools !== undefined && tools.length > e.maxTools)
    failures.push(`${tools.length} tool calls > ${e.maxTools}`);
  if (e.mentionsAny && !e.mentionsAny.some((m) => answer.includes(m.toLowerCase())))
    failures.push(`answer mentions none of ${e.mentionsAny.join(", ")}`);
  if (
    e.toolInputIncludes &&
    !r.trace.some((t) => JSON.stringify(t.input).includes(e.toolInputIncludes!))
  )
    failures.push(`no tool input contained ${e.toolInputIncludes}`);
  if (r.trace.some((t) => !t.success))
    failures.push(`tool error: ${r.trace.find((t) => !t.success)?.error}`);
  return failures;
}

async function main() {
  const llm = offline ? null : new Anthropic();
  const cases = EVAL_CASES.filter((c) => !offline || !c.needsLLM);
  const rows: Array<{
    id: string;
    pass: boolean;
    tools: string[];
    latencyMs: number;
    failures: string[];
    answer: string;
  }> = [];

  console.log(
    `Assistant eval: ${cases.length} cases${offline ? " (offline: guardrail cases only)" : ""}\n`
  );

  for (const c of cases) {
    let result: AskResult;
    try {
      result = await askAssistant(c.question, {
        llm:
          llm ??
          ({ beta: { messages: { create: () => Promise.reject(new Error("offline")) } } } as never),
        loadGaps: async () => EVAL_GAPS,
        runTool: processTool,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      rows.push({
        id: c.id,
        pass: false,
        tools: [],
        latencyMs: 0,
        failures: [`threw: ${msg}`],
        answer: "",
      });
      console.log(`FAIL  ${c.id.padEnd(24)} threw: ${msg}`);
      continue;
    }
    const failures = check(c, result);
    const tools = result.trace.map((t) => t.tool);
    rows.push({
      id: c.id,
      pass: failures.length === 0,
      tools,
      latencyMs: result.latencyMs,
      failures,
      answer: result.answer,
    });
    console.log(
      `${failures.length === 0 ? "PASS" : "FAIL"}  ${c.id.padEnd(24)} ${String(result.latencyMs).padStart(6)} ms  tools: ${tools.join(", ") || "-"}` +
        (failures.length ? `\n      ${failures.join("; ")}` : "")
    );
  }

  const passed = rows.filter((r) => r.pass).length;
  const llmRows = rows.filter((r) => EVAL_CASES.find((c) => c.id === r.id)?.needsLLM);
  const avg = (xs: number[]) =>
    xs.length ? Math.round(xs.reduce((a, b) => a + b, 0) / xs.length) : 0;
  const summary = {
    ranAt: new Date().toISOString(),
    offline,
    model: process.env.ASSISTANT_MODEL ?? "claude-opus-5-5",
    passed,
    total: rows.length,
    passRate: rows.length ? Math.round((passed / rows.length) * 100) : 0,
    avgLatencyMs: avg(rows.map((r) => r.latencyMs)),
    avgLatencyMsModelCases: avg(llmRows.map((r) => r.latencyMs)),
    avgToolCallsModelCases: llmRows.length
      ? +(llmRows.reduce((a, r) => a + r.tools.length, 0) / llmRows.length).toFixed(2)
      : 0,
  };

  console.log(`\n${passed}/${rows.length} passed (${summary.passRate}%)`);
  console.log(
    `Average latency: ${summary.avgLatencyMs} ms (model cases: ${summary.avgLatencyMsModelCases} ms)`
  );

  mkdirSync("eval/results", { recursive: true });
  writeFileSync("eval/results/latest.json", JSON.stringify({ summary, rows }, null, 2));
  process.exitCode = passed === rows.length ? 0 : 1;
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
