import request from "supertest";
import { createApp } from "../express";

describe("E2E health", () => {
  const app = createApp({ corsOrigin: "http://localhost:5173" });

  it("should return ok", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ status: "ok" });
  });

  it("should return a stable error envelope for unknown routes", async () => {
    const response = await request(app).get("/api/nope");
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe("NOT_FOUND");
    expect(response.body.error.requestId).toBeDefined();
  });
});
