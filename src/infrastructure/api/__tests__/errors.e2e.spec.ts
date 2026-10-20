import request from "supertest";
import { createApp } from "../express";

describe("E2E error envelope", () => {
  it("should return NOT_FOUND for an unknown route", async () => {
    const app = createApp({ corsOrigin: "http://localhost:5173" });

    const response = await request(app).get("/api/unknown");

    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(response.body.error.requestId).toBeDefined();
  });

  it("should return RATE_LIMITED after exceeding the limit", async () => {
    const app = createApp({ corsOrigin: "http://localhost:5173", rateLimitPerMinute: 2 });

    await request(app).get("/api/health");
    await request(app).get("/api/health");
    const response = await request(app).get("/api/health");

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe("RATE_LIMITED");
    expect(response.body.error.requestId).toBeDefined();
  });
});

describe("E2E logging", () => {
  it("should log each request with its requestId", async () => {
    const info = jest.fn();
    const app = createApp({
      corsOrigin: "http://localhost:5173",
      logger: { info, error: jest.fn() },
    });

    const response = await request(app).get("/api/health?x=1");

    expect(info).toHaveBeenCalledWith(
      "request",
      expect.objectContaining({
        requestId: response.headers["x-request-id"],
        method: "GET",
        path: "/api/health",
        status: 200,
      }),
    );
  });
});
