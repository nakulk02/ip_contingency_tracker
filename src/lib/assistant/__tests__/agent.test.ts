/**
 * @jest-environment node
 */
import { askAssistant, runAssistant, MAX_TOOL_ROUNDS, type AssistantLLM } from "../agent";
import { EVAL_GAPS } from "../../../../eval/fixtures";

type Block = { type: string; [k: string]: unknown };
// Recorded request bodies are plain JSON; tests index into them freely.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Json = any;

/** Fake Messages API: returns the queued responses in order and records each request. */
function fakeLLM(responses: Array<{ stop_reason: string; content: Block[] }>) {
  const requests: Json[] = [];
  const queue = [...responses];
  const create = jest.fn(async (params: Json) => {
    requests.push(JSON.parse(JSON.stringify(params)));
    const next = queue.shift();
    if (!next) throw new Error("no more fake responses");
    return {
      ...next,
      id: "msg",
      role: "assistant",
      model: params.model,
      usage: { input_tokens: 100, output_tokens: 20 },
    };
  });
  const llm = { beta: { messages: { create } } } as unknown as AssistantLLM;
  return { llm, requests, create };
}

const toolUse = (id: string, name: string, input: unknown): Block => ({
  type: "tool_use",
  id,
  name,
  input,
});
const text = (t: string): Block => ({ type: "text", text: t });

describe("runAssistant", () => {
  it("chains tools, feeds results back, and returns a trace", async () => {
    const { llm, requests } = fakeLLM([
      {
        stop_reason: "tool_use",
        content: [
          toolUse("t1", "rankPriorities", { filters: { riskLevel: ["HIGH", "CRITICAL"] } }),
        ],
      },
      {
        stop_reason: "tool_use",
        content: [toolUse("t2", "recommendActions", { gapId: "gap-cn-01" })],
      },
      {
        stop_reason: "end_turn",
        content: [text("Fix Li Wei's battery patent [gap-cn-01] first.")],
      },
    ]);
    const runTool = jest.fn(async ({ tool }: { tool: string }) =>
      tool === "rankPriorities"
        ? {
            success: true,
            data: [
              {
                ...EVAL_GAPS[0],
                priorityRank: 1,
                priorityScore: 97,
                urgencyFactors: ["CN"],
                estimatedResolutionTime: "2w",
              },
            ],
            usage: { inputTokens: 500, outputTokens: 80 },
          }
        : { success: true, data: { priority: "CRITICAL", actions: ["Get signature"] } }
    );
    const audited: unknown[] = [];

    const result = await runAssistant("Which high-risk gaps should I fix first and why?", {
      llm,
      loadGaps: async () => EVAL_GAPS,
      runTool,
      onToolCall: (r) => void audited.push(r),
    });

    expect(result.answer).toContain("gap-cn-01");
    expect(requests[0]).toMatchObject({
      model: "claude-opus-5-5",
      fallbacks: [{ model: "claude-opus-4-8" }],
    });
    expect(result.trace.map((t) => t.tool)).toEqual(["rankPriorities", "recommendActions"]);
    expect(result.usage).toMatchObject({
      agentInputTokens: 300,
      toolInputTokens: 500,
      toolOutputTokens: 80,
    });

    // rankPriorities only received HIGH/CRITICAL gaps from the database set.
    const rankInput = runTool.mock.calls[0][0] as unknown as {
      input: { gaps: Array<{ riskLevel: string }> };
    };
    expect(rankInput.input.gaps.every((g) => ["HIGH", "CRITICAL"].includes(g.riskLevel))).toBe(
      true
    );
    expect(result.trace[0].gapCount).toBe(rankInput.input.gaps.length);

    // The tool result went back to the model as a tool_result block.
    const secondRequest = requests[1];
    const lastMsg = secondRequest.messages[secondRequest.messages.length - 1];
    expect(lastMsg.content[0]).toMatchObject({ type: "tool_result", tool_use_id: "t1" });

    // Audit records are written per tool call and contain no names or emails.
    expect(audited).toHaveLength(2);
    expect(JSON.stringify(audited)).not.toMatch(/Li Wei|li\.wei@example\.com/);
  });

  it("returns an error tool_result for an unknown gap id without calling the tool", async () => {
    const { llm, requests } = fakeLLM([
      {
        stop_reason: "tool_use",
        content: [toolUse("t1", "checkCompliance", { gapId: "does-not-exist" })],
      },
      { stop_reason: "end_turn", content: [text("I couldn't find that gap.")] },
    ]);
    const runTool = jest.fn();

    const result = await runAssistant("Is gap does-not-exist compliant?", {
      llm,
      loadGaps: async () => EVAL_GAPS,
      runTool,
    });

    expect(runTool).not.toHaveBeenCalled();
    expect(result.trace[0]).toMatchObject({ tool: "checkCompliance", success: false });
    const toolResult = requests[1].messages.at(-1).content[0];
    expect(toolResult).toMatchObject({ is_error: true });
  });

  it("forces a final answer after the maximum number of tool rounds", async () => {
    const loop = Array.from({ length: MAX_TOOL_ROUNDS }, (_, i) => ({
      stop_reason: "tool_use",
      content: [toolUse(`t${i}`, "analyzeGaps", { filters: { jurisdiction: [`X${i}`] } })],
    }));
    const { llm, requests } = fakeLLM([
      ...loop,
      { stop_reason: "end_turn", content: [text("Done.")] },
    ]);

    const result = await runAssistant("What patterns do you see in our gaps?", {
      llm,
      loadGaps: async () => EVAL_GAPS,
      runTool: jest.fn(),
    });

    expect(result.answer).toBe("Done.");
    expect(requests.at(-1).tool_choice).toEqual({ type: "none" });
  });
});

describe("askAssistant", () => {
  it("refuses off-topic questions without calling the model", async () => {
    const { llm, create } = fakeLLM([]);
    const result = await askAssistant("What's the weather like in Paris?", {
      llm,
      loadGaps: async () => EVAL_GAPS,
      runTool: jest.fn(),
    });

    expect(result.refused).toBe(true);
    expect(result.refusalReason).toBe("off_topic");
    expect(create).not.toHaveBeenCalled();
  });
});
