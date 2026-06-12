import { describe, expect, it } from "vitest";
import { extractBodyText } from "../lib/articles/extract";

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
