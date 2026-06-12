import { describe, expect, it } from "vitest";
import {
  articleHostname,
  articleBorderClass,
  toggleButtonClass,
  toggleButtonLabel,
} from "@/app/(private)/articles/article-style";

describe("articleHostname", () => {
  it("extracts the hostname from a valid URL", () => {
    expect(articleHostname("https://qiita.com/user/items/abc")).toBe("qiita.com");
  });

  it("returns an empty string for an invalid URL", () => {
    expect(articleHostname("not a url")).toBe("");
  });
});

describe("status-derived styles", () => {
  it("uses green border and blue toggle for done articles", () => {
    expect(articleBorderClass("done")).toBe("border-green-400");
    expect(toggleButtonClass("done")).toContain("text-blue-600");
    expect(toggleButtonLabel("done")).toBe("未読に戻す");
  });

  it("uses blue border and green toggle for unread articles", () => {
    expect(articleBorderClass("unread")).toBe("border-blue-400");
    expect(toggleButtonClass("unread")).toContain("text-green-600");
    expect(toggleButtonLabel("unread")).toBe("読んだにする");
  });
});
