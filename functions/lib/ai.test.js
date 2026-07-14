"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const strict_1 = __importDefault(require("node:assert/strict"));
const node_test_1 = __importStar(require("node:test"));
const ai_1 = require("./ai");
const originalFetch = globalThis.fetch;
const originalGeminiKey = process.env.GEMINI_API_KEY;
function createRequest(body) {
    return { body };
}
function createResponse() {
    const response = {
        statusCode: 200,
        body: undefined,
        status(code) {
            this.statusCode = code;
            return this;
        },
        json(payload) {
            this.body = payload;
            return this;
        },
    };
    return response;
}
(0, node_test_1.beforeEach)(() => {
    delete process.env.GEMINI_API_KEY;
    globalThis.fetch = undefined;
});
(0, node_test_1.afterEach)(() => {
    if (originalGeminiKey === undefined) {
        delete process.env.GEMINI_API_KEY;
    }
    else {
        process.env.GEMINI_API_KEY = originalGeminiKey;
    }
    globalThis.fetch = originalFetch;
});
(0, node_test_1.default)("handleAiGenerate rejects unsupported actions", async () => {
    const req = createRequest({ action: "bogus" });
    const res = createResponse();
    await (0, ai_1.handleAiGenerate)(req, res);
    strict_1.default.equal(res.statusCode, 400);
    strict_1.default.deepEqual(res.body, {
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
(0, node_test_1.default)("handleAiGenerate returns 503 when Gemini is not configured", async () => {
    const req = createRequest({ action: "caption", content: "hello" });
    const res = createResponse();
    await (0, ai_1.handleAiGenerate)(req, res);
    strict_1.default.equal(res.statusCode, 503);
    strict_1.default.deepEqual(res.body, { error: "AI service not configured" });
});
(0, node_test_1.default)("handleAiGenerate returns 502 for invalid provider payloads", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    globalThis.fetch = (async () => ({
        ok: true,
        json: async () => ({
            candidates: [{ content: { parts: [{ text: JSON.stringify({ wrong: true }) }] } }],
        }),
    }));
    const req = createRequest({ action: "caption", content: "hello" });
    const res = createResponse();
    await (0, ai_1.handleAiGenerate)(req, res);
    strict_1.default.equal(res.statusCode, 502);
    strict_1.default.deepEqual(res.body, { error: "AI provider returned an invalid payload" });
});
(0, node_test_1.default)("handleAiGenerate returns 500 when the provider request fails", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    globalThis.fetch = (async () => ({
        ok: false,
        status: 500,
        json: async () => ({}),
    }));
    const req = createRequest({ action: "caption", content: "hello" });
    const res = createResponse();
    await (0, ai_1.handleAiGenerate)(req, res);
    strict_1.default.equal(res.statusCode, 500);
    strict_1.default.deepEqual(res.body, { error: "AI generation failed" });
});
(0, node_test_1.default)("handlePersonaReplies rejects missing required fields", async () => {
    const req = createRequest({ personas: [], topic: "" });
    const res = createResponse();
    await (0, ai_1.handlePersonaReplies)(req, res);
    strict_1.default.equal(res.statusCode, 400);
    strict_1.default.deepEqual(res.body, { error: "personas[] and topic are required" });
});
(0, node_test_1.default)("handlePersonaReplies falls back to empty replies when provider response cannot be parsed", async () => {
    process.env.GEMINI_API_KEY = "test-key";
    globalThis.fetch = (async () => ({
        ok: true,
        json: async () => ({
            candidates: [{ content: { parts: [{ text: "not-json" }] } }],
        }),
    }));
    const req = createRequest({ personas: ["preppy"], topic: "Summer outfits" });
    const res = createResponse();
    await (0, ai_1.handlePersonaReplies)(req, res);
    strict_1.default.equal(res.statusCode, 200);
    strict_1.default.deepEqual(res.body, { replies: {} });
});
//# sourceMappingURL=ai.test.js.map