// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const loggerMocks = vi.hoisted(() => ({
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
}));

const authMocks = vi.hoisted(() => ({
  verifyIdToken: vi.fn(async () => ({ uid: "admin-1", role: "admin" })),
}));

const appCheckMocks = vi.hoisted(() => ({
  verifyToken: vi.fn(async () => ({ appId: "app-1" })),
}));

vi.mock("firebase-functions", () => ({
  https: {
    onRequest: (handler: unknown) => handler,
  },
  firestore: {
    document: () => ({
      onWrite: (handler: unknown) => handler,
      onCreate: (handler: unknown) => handler,
    }),
  },
  logger: loggerMocks,
}));

vi.mock("firebase-admin", () => ({
  const firestoreFn = Object.assign(
    () => ({
      collection: () => ({
        doc: () => ({ get: vi.fn() }),
        add: vi.fn(),
        where: () => ({ limit: () => ({ get: vi.fn() }), get: vi.fn() }),
      }),
    }),
    {
      FieldValue: {
        serverTimestamp: vi.fn(() => "server-timestamp"),
        delete: vi.fn(() => "delete-field"),
      },
    }
  );

  return {
  initializeApp: vi.fn(),
  auth: () => authMocks,
  appCheck: () => appCheckMocks,
    firestore: firestoreFn,
  };
}));

vi.mock("algoliasearch", () => ({
  default: vi.fn(() => ({
    initIndex: vi.fn(() => ({
      deleteObject: vi.fn(),
      saveObject: vi.fn(),
    })),
  })),
}));

type MockRequest = {
  method: string;
  path: string;
  headers: Record<string, string | undefined>;
  body?: unknown;
  ip?: string;
};

type MockResponse = {
  headers: Record<string, string>;
  statusCode: number;
  body: unknown;
  headersSent: boolean;
  set: (name: string, value: string) => void;
  status: (code: number) => MockResponse;
  json: (payload: unknown) => MockResponse;
  send: (payload: unknown) => MockResponse;
};

const originalEnv = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  FUNCTIONS_EMULATOR: process.env.FUNCTIONS_EMULATOR,
};

const originalFetch = globalThis.fetch;

function createRequest(overrides: Partial<MockRequest> = {}): MockRequest {
  return {
    method: "POST",
    path: "/api/ai/generate",
    headers: {
      origin: "https://simplysoph.com",
      authorization: "Bearer valid-token",
      "x-firebase-appcheck": "valid-app-check",
    },
    body: {
      action: "caption",
      content: "Summer capsule wardrobe",
    },
    ip: "127.0.0.1",
    ...overrides,
  };
}

function createResponse(): MockResponse {
  return {
    headers: {},
    statusCode: 200,
    body: undefined,
    headersSent: false,
    set(name: string, value: string) {
      this.headers[name] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
    send(payload: unknown) {
      this.body = payload;
      this.headersSent = true;
      return this;
    },
  };
}

async function loadApi() {
  vi.resetModules();
  const mod = await import("../functions/src/index");
  return mod.api as (req: MockRequest, res: MockResponse) => Promise<void>;
}

beforeEach(() => {
  vi.clearAllMocks();
  process.env.GEMINI_API_KEY = "test-gemini-key";
  delete process.env.FUNCTIONS_EMULATOR;
  authMocks.verifyIdToken.mockResolvedValue({ uid: "admin-1", role: "admin" });
  appCheckMocks.verifyToken.mockResolvedValue({ appId: "app-1" });
  globalThis.fetch = vi.fn(async () => ({
    ok: true,
    json: async () => ({
      candidates: [{ content: { parts: [{ text: JSON.stringify({ caption: "ok" }) }] } }],
    }),
  })) as unknown as typeof fetch;
});

afterEach(() => {
  if (originalEnv.GEMINI_API_KEY === undefined) {
    delete process.env.GEMINI_API_KEY;
  } else {
    process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
  }

  if (originalEnv.FUNCTIONS_EMULATOR === undefined) {
    delete process.env.FUNCTIONS_EMULATOR;
  } else {
    process.env.FUNCTIONS_EMULATOR = originalEnv.FUNCTIONS_EMULATOR;
  }

  globalThis.fetch = originalFetch;
});

describe("AI API auth and quota enforcement", () => {
  it("rejects missing Firebase ID tokens", async () => {
    const api = await loadApi();
    const req = createRequest({ headers: { origin: "https://simplysoph.com" } });
    const res = createResponse();

    await api(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Missing Firebase ID token" });
  });

  it("rejects invalid Firebase ID tokens", async () => {
    authMocks.verifyIdToken.mockRejectedValueOnce(new Error("bad token"));
    const api = await loadApi();
    const res = createResponse();

    await api(createRequest(), res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Invalid Firebase ID token" });
  });

  it("rejects non-admin users", async () => {
    authMocks.verifyIdToken.mockResolvedValueOnce({ uid: "user-1", role: "user" });
    const api = await loadApi();
    const res = createResponse();

    await api(createRequest(), res);

    expect(res.statusCode).toBe(403);
    expect(res.body).toEqual({ error: "Admin role required" });
  });

  it("requires App Check outside the emulator", async () => {
    const api = await loadApi();
    const req = createRequest({
      headers: {
        origin: "https://simplysoph.com",
        authorization: "Bearer valid-token",
      },
    });
    const res = createResponse();

    await api(req, res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Missing App Check token" });
  });

  it("rejects invalid App Check tokens", async () => {
    appCheckMocks.verifyToken.mockRejectedValueOnce(new Error("bad appcheck"));
    const api = await loadApi();
    const res = createResponse();

    await api(createRequest(), res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Invalid App Check token" });
  });

  it("allows AI generate requests for admins with valid App Check", async () => {
    const api = await loadApi();
    const res = createResponse();

    await api(createRequest(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ result: { caption: "ok" } });
    expect(authMocks.verifyIdToken).toHaveBeenCalledTimes(1);
    expect(appCheckMocks.verifyToken).toHaveBeenCalledTimes(1);
  });

  it("enforces the per-IP AI quota", async () => {
    const api = await loadApi();

    for (let index = 0; index < 30; index += 1) {
      const res = createResponse();
      await api(createRequest({ ip: "10.0.0.1" }), res);
      expect(res.statusCode).toBe(200);
    }

    const blocked = createResponse();
    await api(createRequest({ ip: "10.0.0.1" }), blocked);

    expect(blocked.statusCode).toBe(429);
    expect(blocked.body).toEqual({ error: "Too many AI requests from this IP" });
  });

  it("enforces the per-user AI quota independently of IP", async () => {
    const api = await loadApi();

    for (let index = 0; index < 40; index += 1) {
      const res = createResponse();
      await api(createRequest({ ip: `10.0.0.${index}` }), res);
      expect(res.statusCode).toBe(200);
    }

    const blocked = createResponse();
    await api(createRequest({ ip: "10.0.1.1" }), blocked);

    expect(blocked.statusCode).toBe(429);
    expect(blocked.body).toEqual({ error: "Too many AI requests for this user" });
  });

  it("bypasses App Check in the emulator while still enforcing auth", async () => {
    process.env.FUNCTIONS_EMULATOR = "true";
    const api = await loadApi();
    const req = createRequest({
      headers: {
        origin: "https://simplysoph.com",
        authorization: "Bearer valid-token",
      },
    });
    const res = createResponse();

    await api(req, res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ result: { caption: "ok" } });
    expect(appCheckMocks.verifyToken).not.toHaveBeenCalled();
  });
});
