import { afterEach, describe, expect, it, vi } from "vitest";
import { extractBodyText, fetchBodyText, isAllowedArticleUrl } from "./article-content";

describe("isAllowedArticleUrl", () => {
  it("allows Qiita and Zenn article URLs", () => {
    expect(isAllowedArticleUrl("https://qiita.com/user/items/abc")).toBe(true);
    expect(isAllowedArticleUrl("https://zenn.dev/user/articles/abc")).toBe(true);
  });

  it("allows subdomains of supported article domains", () => {
    expect(isAllowedArticleUrl("https://team.qiita.com/posts/abc")).toBe(true);
  });

  it("rejects unsupported or invalid URLs", () => {
    expect(isAllowedArticleUrl("https://example.com/post")).toBe(false);
    expect(isAllowedArticleUrl("not a url")).toBe(false);
  });
});

describe("extractBodyText", () => {
  it("extracts visible body text and removes noisy elements", () => {
    const html = `
      <body>
        <header>Navigation</header>
        <article><h1>Title</h1><p>Main   text</p></article>
        <script>window.secret = true</script>
        <footer>Footer</footer>
      </body>
    `;

    expect(extractBodyText(html)).toBe("Title Main text");
  });

  it("limits extracted text length", () => {
    const html = `<body>${"a".repeat(20050)}</body>`;

    expect(extractBodyText(html)).toHaveLength(20000);
  });
});

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
});
