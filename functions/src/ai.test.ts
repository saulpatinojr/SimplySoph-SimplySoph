import assert from "node:assert/strict";
import test, { afterEach, beforeEach } from "node:test";
import type { Request, Response } from "firebase-functions";
import { handleAiGenerate, handlePersonaReplies } from "./ai";

type MockResponse = Response & {
  statusCode: number;
  body: unknown;
};

const originalFetch = globalThis.fetch;
const originalGeminiKey = process.env.GEMINI_API_KEY;

function createRequest(body: unknown): Request {
  return { body } as Request;
}

function createResponse(): MockResponse {
  const response = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };

  return response as MockResponse;
}

beforeEach(() => {
  delete process.env.GEMINI_API_KEY;
  globalThis.fetch = undefined as unknown as typeof fetch;
});

afterEach(() => {
  if (originalGeminiKey === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalGeminiKey;
  }

  globalThis.fetch = originalFetch;
});

test("handleAiGenerate rejects unsupported actions", async () => {
  const req = createRequest({ action: "bogus" });
  const res = createResponse();

  await handleAiGenerate(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, {
    error: "action is required and must be one of the supported actions",
    allowedActions: [
      "titleIdeas",
      "abVariants",
      "tags",
      "seoMeta",
      "videoDescription",
      "caption",
      "altText",
      "contentBrief",
    ],
  });
});

test("handleAiGenerate returns 503 when Gemini is not configured", async () => {
  const req = createRequest({ action: "caption", content: "hello" });
  const res = createResponse();

  await handleAiGenerate(req, res);

  assert.equal(res.statusCode, 503);
  assert.deepEqual(res.body, { error: "AI service not configured" });
});

test("handleAiGenerate returns 502 for invalid provider payloads", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = (async () => ({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ wrong: true }) }] } }],
    }),
  })) as unknown as typeof fetch;

  const req = createRequest({ action: "caption", content: "hello" });
  const res = createResponse();

  await handleAiGenerate(req, res);

  assert.equal(res.statusCode, 502);
  assert.deepEqual(res.body, { error: "AI provider returned an invalid payload" });
});

test("handleAiGenerate returns 500 when the provider request fails", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = (async () => ({
    ok: false,
    status: 500,
    json: async () => ({}),
  })) as unknown as typeof fetch;

  const req = createRequest({ action: "caption", content: "hello" });
  const res = createResponse();

  await handleAiGenerate(req, res);

  assert.equal(res.statusCode, 500);
  assert.deepEqual(res.body, { error: "AI generation failed" });
});

test("handlePersonaReplies rejects missing required fields", async () => {
  const req = createRequest({ personas: [], topic: "" });
  const res = createResponse();

  await handlePersonaReplies(req, res);

  assert.equal(res.statusCode, 400);
  assert.deepEqual(res.body, { error: "personas[] and topic are required" });
});

test("handlePersonaReplies falls back to empty replies when provider response cannot be parsed", async () => {
  process.env.GEMINI_API_KEY = "test-key";
  globalThis.fetch = (async () => ({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: "not-json" }] } }],
    }),
  })) as unknown as typeof fetch;

  const req = createRequest({ personas: ["preppy"], topic: "Summer outfits" });
  const res = createResponse();

  await handlePersonaReplies(req, res);

  assert.equal(res.statusCode, 200);
  assert.deepEqual(res.body, { replies: {} });
});
