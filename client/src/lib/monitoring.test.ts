import { describe, expect, it } from "vitest";
import { sanitizeTelemetryText, toSafeErrorPayload } from "./monitoring";

describe("monitoring redaction", () => {
  it("redacts emails and sensitive query params", () => {
    const value =
      "user john@example.com token=abcd1234abcd1234abcd1234 apiKey=secret-value";

    const sanitized = sanitizeTelemetryText(value);

    expect(sanitized).not.toContain("john@example.com");
    expect(sanitized).toContain("[redacted-email]");
    expect(sanitized).toContain("token=[redacted]");
    expect(sanitized).toContain("apiKey=[redacted]");
  });

  it("converts Error to safe payload", () => {
    const error = new Error("Failure for jane@example.com with password=hunter2");
    const safe = toSafeErrorPayload(error);

    expect(safe.name).toBe("Error");
    expect(safe.message).not.toContain("jane@example.com");
    expect(safe.message).toContain("[redacted-email]");
    expect(safe.message).toContain("password=[redacted]");
  });

  it("supports non-error rejections", () => {
    const safe = toSafeErrorPayload({
      reason: "request failed",
      token: "abcd1234abcd1234abcd1234",
    });

    expect(safe.name).toBe("UnknownError");
    expect(safe.message).toContain("reason");
    expect(safe.message).toContain("[redacted-token]");
  });
});
