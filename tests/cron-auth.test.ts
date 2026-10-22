import { afterEach, describe, expect, it, vi } from "vitest";
import { isAuthorizedCronRequest } from "@/lib/api/cron-auth";

function req(authorization?: string) {
  return new Request("https://example.com/api/cron/test", {
    headers: authorization ? { Authorization: authorization } : {},
  });
}

describe("isAuthorizedCronRequest", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("returns false when CRON_SECRET is not configured", () => {
    vi.stubEnv("CRON_SECRET", "");
    expect(isAuthorizedCronRequest(req("secret"))).toBe(false);
  });

  it("accepts the raw secret value", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isAuthorizedCronRequest(req("s3cret"))).toBe(true);
  });

  it("accepts the secret with a Bearer prefix", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isAuthorizedCronRequest(req("Bearer s3cret"))).toBe(true);
  });

  it("rejects a wrong secret", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isAuthorizedCronRequest(req("nope"))).toBe(false);
  });

  it("rejects a secret that shares a prefix but differs in length", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isAuthorizedCronRequest(req("Bearer s3cret-extra"))).toBe(false);
    expect(isAuthorizedCronRequest(req("Bearer s3c"))).toBe(false);
  });

  it("rejects a missing Authorization header", () => {
    vi.stubEnv("CRON_SECRET", "s3cret");
    expect(isAuthorizedCronRequest(req())).toBe(false);
  });
});
