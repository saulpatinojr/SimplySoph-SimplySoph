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

// In-memory store backing the mocked _rateLimits transaction so the
// Firestore-based rate limiter actually enforces quotas in tests.
const rateLimitStore = vi.hoisted(() => new Map<string, Record<string, unknown>>());

const firestoreMocks = vi.hoisted(() => ({
  newsletterGet: vi.fn(async () => ({ empty: true, docs: [] })),
  newsletterAdd: vi.fn(async () => ({ id: "sub-1" })),
  newsletterDocSet: vi.fn(async () => undefined),
  contactAdd: vi.fn(async () => ({ id: "contact-1" })),
  commentAdd: vi.fn(async () => ({ id: "comment-1" })),
  mailAdd: vi.fn(async () => ({ id: "mail-1" })),
  categoryGet: vi.fn(async () => ({ exists: false, data: () => undefined })),
}));

vi.mock("firebase-functions", () => ({
  https: {
    onRequest: (handler: unknown) => handler,
    onCall: (handler: unknown) => handler,
    HttpsError: class HttpsError extends Error {
      constructor(public code: string, message: string) {
        super(message);
      }
    },
  },
  firestore: {
    document: () => ({
      onWrite: (handler: unknown) => handler,
      onCreate: (handler: unknown) => handler,
    }),
  },
  logger: loggerMocks,
}));

vi.mock("firebase-admin", () => {
  const firestoreFn = Object.assign(
    () => ({
      runTransaction: async (
        fn: (tx: {
          get: (ref: { id: string }) => Promise<{ exists: boolean; data: () => Record<string, unknown> | undefined }>;
          set: (ref: { id: string }, data: Record<string, unknown>) => void;
        }) => Promise<unknown>
      ) =>
        fn({
          get: async (ref: { id: string }) => ({
            exists: rateLimitStore.has(ref.id),
            data: () => rateLimitStore.get(ref.id),
          }),
          set: (ref: { id: string }, data: Record<string, unknown>) => {
            rateLimitStore.set(ref.id, data);
          },
        }),
      collection: (name: string) => {
        switch (name) {
        case "_rateLimits":
          return {
            doc: (id: string) => ({ id }),
          };
        case "newsletterSubscribers":
          return {
            where: () => ({
              limit: () => ({ get: firestoreMocks.newsletterGet }),
              get: firestoreMocks.newsletterGet,
            }),
            add: firestoreMocks.newsletterAdd,
          };
        case "contact_messages":
          return {
            add: firestoreMocks.contactAdd,
          };
        case "comments":
          return {
            add: firestoreMocks.commentAdd,
          };
        case "categories":
          return {
            doc: () => ({ get: firestoreMocks.categoryGet }),
          };
        case "mail":
          return {
            add: firestoreMocks.mailAdd,
          };
        default:
          return {
            doc: () => ({ get: firestoreMocks.categoryGet }),
            add: vi.fn(),
            where: () => ({
              limit: () => ({ get: vi.fn(async () => ({ empty: true, docs: [] })) }),
              get: vi.fn(async () => ({ empty: true, docs: [] })),
            }),
          };
        }
      },
    }),
    {
      FieldValue: {
        serverTimestamp: vi.fn(() => "server-timestamp"),
        delete: vi.fn(() => "delete-field"),
      },
      Timestamp: {
        fromMillis: vi.fn((ms: number) => ({ toMillis: () => ms })),
      },
    }
  );

  return {
    initializeApp: vi.fn(),
    auth: () => authMocks,
    appCheck: () => appCheckMocks,
    firestore: firestoreFn,
  };
});

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
  ENFORCE_PUBLIC_APPCHECK: process.env.ENFORCE_PUBLIC_APPCHECK,
  UNSUBSCRIBE_TOKEN_SECRET: process.env.UNSUBSCRIBE_TOKEN_SECRET,
  NEWSLETTER_CONFIRM_TOKEN_SECRET: process.env.NEWSLETTER_CONFIRM_TOKEN_SECRET,
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
  rateLimitStore.clear();
  process.env.GEMINI_API_KEY = "test-gemini-key";
  // Newsletter subscribe returns 503 without these HMAC secrets configured.
  process.env.UNSUBSCRIBE_TOKEN_SECRET = "test-unsubscribe-secret";
  process.env.NEWSLETTER_CONFIRM_TOKEN_SECRET = "test-confirm-secret";
  delete process.env.FUNCTIONS_EMULATOR;
  delete process.env.ENFORCE_PUBLIC_APPCHECK;
  authMocks.verifyIdToken.mockResolvedValue({ uid: "admin-1", role: "admin" });
  appCheckMocks.verifyToken.mockResolvedValue({ appId: "app-1" });
  firestoreMocks.newsletterGet.mockResolvedValue({ empty: true, docs: [] });
  firestoreMocks.newsletterAdd.mockResolvedValue({ id: "sub-1" });
  firestoreMocks.newsletterDocSet.mockResolvedValue(undefined);
  firestoreMocks.contactAdd.mockResolvedValue({ id: "contact-1" });
  firestoreMocks.commentAdd.mockResolvedValue({ id: "comment-1" });
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

  if (originalEnv.ENFORCE_PUBLIC_APPCHECK === undefined) {
    delete process.env.ENFORCE_PUBLIC_APPCHECK;
  } else {
    process.env.ENFORCE_PUBLIC_APPCHECK = originalEnv.ENFORCE_PUBLIC_APPCHECK;
  }

  if (originalEnv.UNSUBSCRIBE_TOKEN_SECRET === undefined) {
    delete process.env.UNSUBSCRIBE_TOKEN_SECRET;
  } else {
    process.env.UNSUBSCRIBE_TOKEN_SECRET = originalEnv.UNSUBSCRIBE_TOKEN_SECRET;
  }

  if (originalEnv.NEWSLETTER_CONFIRM_TOKEN_SECRET === undefined) {
    delete process.env.NEWSLETTER_CONFIRM_TOKEN_SECRET;
  } else {
    process.env.NEWSLETTER_CONFIRM_TOKEN_SECRET = originalEnv.NEWSLETTER_CONFIRM_TOKEN_SECRET;
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

  it("requires App Check outside the emulator when enforcement is enabled", async () => {
    process.env.ENFORCE_PUBLIC_APPCHECK = "true";
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

  it("rejects invalid App Check tokens when enforcement is enabled", async () => {
    process.env.ENFORCE_PUBLIC_APPCHECK = "true";
    appCheckMocks.verifyToken.mockRejectedValueOnce(new Error("bad appcheck"));
    const api = await loadApi();
    const res = createResponse();

    await api(createRequest(), res);

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Invalid App Check token" });
  });

  it("allows AI generate requests for admins with valid App Check", async () => {
    process.env.ENFORCE_PUBLIC_APPCHECK = "true";
    const api = await loadApi();
    const res = createResponse();

    await api(createRequest(), res);

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ result: { caption: "ok" } });
    expect(authMocks.verifyIdToken).toHaveBeenCalledTimes(1);
    expect(appCheckMocks.verifyToken).toHaveBeenCalledTimes(1);
  });

  it("skips App Check by default while still requiring the admin token", async () => {
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

describe("public-write API CRUD behavior", () => {
  it("rejects invalid newsletter emails", async () => {
    const api = await loadApi();
    const res = createResponse();

    await api(
      createRequest({
        path: "/api/newsletter/subscribe",
        body: { email: "not-an-email" },
      }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Valid email is required" });
  });

  it("creates a new newsletter subscriber", async () => {
    const api = await loadApi();
    const res = createResponse();

    await api(
      createRequest({
        path: "/api/newsletter/subscribe",
        body: { email: " Fan@Example.com ", name: "Fan", source: "footer" },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, alreadySubscribed: false, pendingConfirmation: true });
    expect(firestoreMocks.newsletterAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "fan@example.com",
        name: "Fan",
        source: "footer",
        active: false,
        status: "pending_confirm",
      })
    );
    expect(firestoreMocks.mailAdd).toHaveBeenCalled();
  });

  it("re-requests confirmation for an existing pending subscriber", async () => {
    firestoreMocks.newsletterGet.mockResolvedValueOnce({
      empty: false,
      docs: [{
        ref: { set: firestoreMocks.newsletterDocSet },
        data: () => ({ status: "pending_confirm" }),
      }],
    });

    const api = await loadApi();
    const res = createResponse();

    await api(
      createRequest({
        path: "/api/newsletter/subscribe",
        body: { email: "fan@example.com", name: "Fan" },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, alreadySubscribed: false, pendingConfirmation: true });
    expect(firestoreMocks.newsletterDocSet).toHaveBeenCalled();
    expect(firestoreMocks.mailAdd).toHaveBeenCalled();
  });

  it("returns already subscribed for active newsletter subscribers", async () => {
    firestoreMocks.newsletterGet.mockResolvedValueOnce({
      empty: false,
      docs: [{
        ref: { set: firestoreMocks.newsletterDocSet },
        data: () => ({ status: "active" }),
      }],
    });

    const api = await loadApi();
    const res = createResponse();

    await api(
      createRequest({
        path: "/api/newsletter/subscribe",
        body: { email: "fan@example.com", name: "Fan" },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, alreadySubscribed: true, pendingConfirmation: false });
  });

  it("enforces App Check for public writes when configured", async () => {
    process.env.ENFORCE_PUBLIC_APPCHECK = "true";
    const api = await loadApi();
    const res = createResponse();

    await api(
      createRequest({
        path: "/api/contact/submit",
        headers: { origin: "https://simplysoph.com" },
        body: {
          name: "Visitor",
          email: "visitor@example.com",
          subject: "Hello",
          message: "Hi",
        },
      }),
      res
    );

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Missing App Check token" });
  });

  it("requires auth for passport saved destinations", async () => {
    const api = await loadApi();
    const res = createResponse();

    await api(
      createRequest({
        method: "GET",
        path: "/api/passport/saved",
        headers: { origin: "https://simplysoph.com" },
      }),
      res
    );

    expect(res.statusCode).toBe(401);
    expect(res.body).toEqual({ error: "Missing Firebase ID token" });
  });

  it("validates attribution event payload", async () => {
    const api = await loadApi();
    const res = createResponse();

    await api(
      createRequest({
        path: "/api/attribution/event",
        body: { subjectType: "destination", subjectId: "dest-1" },
      }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "eventType is required" });
  });

  it("creates a contact message for valid submissions", async () => {
    const api = await loadApi();
    const res = createResponse();

    await api(
      createRequest({
        path: "/api/contact/submit",
        body: {
          name: "Visitor",
          email: "visitor@example.com",
          subject: "Partnership",
          message: "Hello there",
          source: "contact-page",
        },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true });
    expect(firestoreMocks.contactAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Visitor",
        email: "visitor@example.com",
        subject: "Partnership",
        message: "Hello there",
        source: "contact-page",
        status: "unread",
      })
    );
  });

  it("rejects guest comments without a guest name", async () => {
    const api = await loadApi();
    const res = createResponse();

    await api(
      createRequest({
        path: "/api/comments/create",
        headers: { origin: "https://simplysoph.com" },
        body: {
          postId: "post-1",
          postType: "blog",
          content: "Great post",
        },
      }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Guest name is required" });
  });

  it("creates an authenticated comment with resolved author fields", async () => {
    authMocks.verifyIdToken.mockResolvedValueOnce({
      uid: "user-42",
      name: "User Forty Two",
      picture: "https://example.com/avatar.jpg",
      role: "user",
    });

    const api = await loadApi();
    const res = createResponse();

    await api(
      createRequest({
        path: "/api/comments/create",
        body: {
          postId: "post-1",
          postType: "blog",
          content: "Great post",
        },
      }),
      res
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toEqual({ ok: true, id: "comment-1" });
    expect(firestoreMocks.commentAdd).toHaveBeenCalledWith(
      expect.objectContaining({
        postId: "post-1",
        postType: "blog",
        content: "Great post",
        authorId: "user-42",
        authorName: "User Forty Two",
        authorPhotoURL: "https://example.com/avatar.jpg",
        status: "pending",
      })
    );
  });

  it("rejects invalid unsubscribe tokens", async () => {
    const api = await loadApi();
    const res = createResponse();

    await api(
      createRequest({
        path: "/api/newsletter/unsubscribe",
        body: { email: "fan@example.com", token: "bad-token" },
      }),
      res
    );

    expect(res.statusCode).toBe(400);
    expect(res.body).toEqual({ error: "Invalid unsubscribe token" });
  });
});
