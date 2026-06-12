import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchBodyText } from "../lib/articles/fetch-body";

describe("fetchBodyText", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches HTML and extracts body text", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("<body><p>Hello article</p></body>", {
        headers: { "content-type": "text/html; charset=utf-8" },
      }))
    );

    await expect(fetchBodyText("https://qiita.com/user/items/abc")).resolves.toBe("Hello article");
  });

  it("rejects non-HTML responses", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response("{}", {
        headers: { "content-type": "application/json" },
      }))
    );

    await expect(fetchBodyText("https://qiita.com/user/items/abc")).rejects.toThrow("Unexpected content-type");
  });

  it("rejects disallowed URLs before fetching", async () => {
    const fetchFn = vi.fn();

    await expect(fetchBodyText("https://example.com/post", fetchFn as unknown as typeof fetch))
      .rejects.toThrow("Disallowed URL");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("uses an injected fetch implementation when provided", async () => {
    const fetchFn = vi.fn(async () => new Response("<body><p>Injected</p></body>", {
      headers: { "content-type": "text/html" },
    }));

    await expect(
      fetchBodyText("https://zenn.dev/user/articles/abc", fetchFn as unknown as typeof fetch)
    ).resolves.toBe("Injected");
    expect(fetchFn).toHaveBeenCalledOnce();
  });
});
