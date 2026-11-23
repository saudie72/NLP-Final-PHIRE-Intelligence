// "Ask the expert" function tests with a fake Claude client: no network, no API spend.
import { describe, expect, it } from "vitest";
import { MODEL, buildRequest, buildSystem, handle } from "../netlify/functions/chat.mjs";

const ticket = { id: "IN009001", title: "Sick leave paid as regular", description: "Code Enforcement inspectors' sick leave is paid as regular hours.",
  module: "TL", priority: "H", predictedModule: "TL", moduleConfidence: 0.8, issueArea: "Functional", areaConfidence: 0.9, suggestedPriority: "H" };
const body = (extra = {}) => ({ expert: "erp-functional-analyst", ticket, similar: [{ id: "IN009002", title: "Sick time", kind: "related", score: 0.7 }],
  messages: [{ role: "user", content: "Is this configuration or development?" }], ...extra });
const post = (b) => new Request("http://x/api/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) });

function fakeClient(calls, { text = "Observations: …\n\nSources: knowledge", stop = "end_turn" } = {}) {
  return () => ({
    beta: { messages: { stream(params) {
      calls.push(params);
      const events = text.match(/.{1,8}/gs).map((t) => ({ type: "content_block_delta", delta: { type: "text_delta", text: t } }));
      return { async *[Symbol.asyncIterator]() { yield* events; }, finalMessage: async () => ({ stop_reason: stop }) };
    } } },
  });
}

describe("chat function", () => {
  it("reports not configured without a key, and refuses POST with 503", async () => {
    const g = await (await handle(new Request("http://x/api/chat"), {})).json();
    expect(g).toMatchObject({ configured: false, passwordRequired: false, model: MODEL });
    expect(g.experts.map((e) => e.name)).toEqual(expect.arrayContaining(["Ray", "Kwame", "Dana", "Gloria", "Priya", "Marisol"]));
    expect((await handle(post(body()), {})).status).toBe(503);
  });
  it("requires the app password when one is set", async () => {
    const env = { ANTHROPIC_API_KEY: "k", APP_PASSWORD: "s3cret" };
    expect((await handle(post(body()), env, fakeClient([]))).status).toBe(401);
    expect((await handle(post(body({ password: "wrong" })), env, fakeClient([]))).status).toBe(401);
    expect((await handle(post(body({ password: "s3cret" })), env, fakeClient([]))).status).toBe(200);
  });
  it("rejects unknown experts, bad roles and oversized messages", () => {
    expect(buildRequest(body({ expert: "hacker" })).error).toMatch(/Unknown expert/);
    expect(buildRequest(body({ messages: [{ role: "system", content: "x" }] })).error).toBeTruthy();
    expect(buildRequest(body({ messages: [{ role: "user", content: "x".repeat(2001) }] })).error).toMatch(/limited/);
    expect(buildRequest(body({ messages: [{ role: "user", content: "a" }, { role: "user", content: "b" }] })).error).toMatch(/alternate/);
  });
  it("builds the request: Sonnet, cached system prompt with instructions + knowledge, ticket context first", () => {
    const { params } = buildRequest(body());
    expect(params.model).toBe("claude-sonnet-5-5");
    expect(params.fallbacks).toBe("default");
    expect(params.system[0].cache_control).toEqual({ type: "ephemeral" });
    expect(params.system[0].text).toContain("Your name is Ray");
    expect(params.system[0].text).toContain("SCKCE");                       // knowledge file is included
    expect(params.system[0].text).not.toContain("Mandatory first action");  // tool-only instruction removed
    expect(params.messages[0].content).toContain("IN009001");
    expect(params.messages[0].content).toContain("IN009002");
    expect(params.messages[0].content).toMatch(/Question: Is this configuration/);
  });
  it("the whole-team expert gets the team rules", () => {
    expect(buildSystem("orchestrator")).toContain("Whole-team chat");
    expect(buildSystem("erp-developer")).not.toContain("Whole-team chat");
  });
  it("streams the answer text and flags refusals", async () => {
    const calls = [];
    const res = await handle(post(body()), { ANTHROPIC_API_KEY: "k" }, fakeClient(calls, { stop: "refusal" }));
    const text = await res.text();
    expect(text).toContain("Observations: …");
    expect(text).toContain("declined");
    expect(calls).toHaveLength(1);
  });
});
