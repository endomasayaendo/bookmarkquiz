import { afterEach, describe, expect, it, vi } from "vitest";
import { callApi } from "@/lib/client/api";

describe("callApi", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns parsed data on a successful JSON response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ id: "x" }), {
        status: 200,
        headers: { "content-type": "application/json" },
      }))
    );

    const result = await callApi<{ id: string }>("/api/thing");

    expect(result).toEqual({ ok: true, status: 200, data: { id: "x" }, error: null });
  });

  it("extracts the error message from a failed JSON response", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "Bad" }), {
        status: 400,
        headers: { "content-type": "application/json" },
      }))
    );

    const result = await callApi("/api/thing");

    expect(result).toEqual({ ok: false, status: 400, data: null, error: "Bad" });
  });

  it("falls back to null error when the body is not JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("oops", { status: 500 }))
    );

    const result = await callApi("/api/thing");

    expect(result).toEqual({ ok: false, status: 500, data: null, error: null });
  });

  it("tolerates an empty body on a successful response (e.g. 204)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(null, { status: 204 }))
    );

    const result = await callApi("/api/thing", { method: "DELETE" });

    expect(result).toEqual({ ok: true, status: 204, data: null, error: null });
  });
});
