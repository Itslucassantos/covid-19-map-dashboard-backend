import request from "supertest";
import { createApp } from "../express";
import { loadConfig, parseCorsOrigins } from "../config";

describe("E2E CORS", () => {
  const app = createApp({
    corsOrigin: parseCorsOrigins("http://localhost:5173, http://127.0.0.1:5173"),
  });

  it("should allow each configured origin", async () => {
    for (const origin of ["http://localhost:5173", "http://127.0.0.1:5173"]) {
      const response = await request(app).get("/api/health").set("Origin", origin);
      expect(response.headers["access-control-allow-origin"]).toBe(origin);
    }
  });

  it("should not allow other origins", async () => {
    const response = await request(app).get("/api/health").set("Origin", "http://evil.example");
    expect(response.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("should answer the preflight request and expose the request id", async () => {
    const response = await request(app)
      .options("/api/countries")
      .set("Origin", "http://localhost:5173")
      .set("Access-Control-Request-Method", "GET");
    expect(response.status).toBe(204);
    expect(response.headers["access-control-allow-methods"]).toContain("GET");

    const simple = await request(app).get("/api/health").set("Origin", "http://localhost:5173");
    expect(simple.headers["access-control-expose-headers"]).toContain("X-Request-Id");
  });

  it("should default to the Vite dev server origins", () => {
    const config = loadConfig({ DATABASE_URL: "postgres://x" });
    expect(parseCorsOrigins(config.CORS_ORIGIN)).toEqual([
      "http://localhost:5173",
      "http://127.0.0.1:5173",
    ]);
  });
});
