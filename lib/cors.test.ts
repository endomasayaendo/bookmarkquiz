import { describe, expect, it } from "vitest";
import { CORS_HEADERS, corsPreflightResponse } from "./cors";

describe("corsPreflightResponse", () => {
  it("returns a 204 response with bookmarklet CORS headers", () => {
    const res = corsPreflightResponse();

    expect(res.status).toBe(204);
    expect(res.headers.get("Access-Control-Allow-Origin")).toBe(CORS_HEADERS["Access-Control-Allow-Origin"]);
    expect(res.headers.get("Access-Control-Allow-Methods")).toBe(CORS_HEADERS["Access-Control-Allow-Methods"]);
    expect(res.headers.get("Access-Control-Allow-Headers")).toBe(CORS_HEADERS["Access-Control-Allow-Headers"]);
  });
});
