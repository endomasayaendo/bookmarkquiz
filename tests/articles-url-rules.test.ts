import { describe, expect, it } from "vitest";
import { isAllowedArticleUrl } from "../lib/articles/url-rules";

describe("isAllowedArticleUrl", () => {
  it("allows Qiita and Zenn article URLs", () => {
    expect(isAllowedArticleUrl("https://qiita.com/user/items/abc")).toBe(true);
    expect(isAllowedArticleUrl("https://zenn.dev/user/articles/abc")).toBe(true);
  });

  it("allows subdomains of supported article domains", () => {
    expect(isAllowedArticleUrl("https://team.qiita.com/posts/abc")).toBe(true);
  });

  it("rejects top pages and listing pages of supported sites", () => {
    expect(isAllowedArticleUrl("https://qiita.com/")).toBe(false);
    expect(isAllowedArticleUrl("https://qiita.com/tags/javascript")).toBe(false);
    expect(isAllowedArticleUrl("https://zenn.dev/")).toBe(false);
    expect(isAllowedArticleUrl("https://zenn.dev/someuser")).toBe(false);
  });

  it("rejects unsupported or invalid URLs", () => {
    expect(isAllowedArticleUrl("https://example.com/post")).toBe(false);
    expect(isAllowedArticleUrl("not a url")).toBe(false);
  });
});
