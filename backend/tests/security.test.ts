/**
 * Security middleware tests — input sanitisation and request ID
 */
import { sanitizeBody, requestId } from "../src/middleware/security.js";
import type { Request, Response, NextFunction } from "express";

function mockReq(body: unknown): Partial<Request> {
  return { body } as Partial<Request>;
}

const mockRes = {} as Response;
const mockNext: NextFunction = jest.fn();

describe("sanitizeBody middleware", () => {
  beforeEach(() => (mockNext as jest.Mock).mockClear());

  it("removes null bytes from string values", () => {
    const req = mockReq({ message: "hello\x00world" });
    sanitizeBody(req as Request, mockRes, mockNext);
    expect((req as Request).body.message).toBe("helloworld");
    expect(mockNext).toHaveBeenCalled();
  });

  it("removes control characters from nested objects", () => {
    const req = mockReq({ profile: { location: "Delhi\x01\x02" } });
    sanitizeBody(req as Request, mockRes, mockNext);
    expect((req as Request).body.profile.location).toBe("Delhi");
  });

  it("sanitizes array string values", () => {
    const req = mockReq({ concerns: ["smog\x00", "PM2.5"] });
    sanitizeBody(req as Request, mockRes, mockNext);
    expect((req as Request).body.concerns[0]).toBe("smog");
    expect((req as Request).body.concerns[1]).toBe("PM2.5");
  });

  it("passes through non-string values unchanged", () => {
    const req = mockReq({ count: 42, active: true, nothing: null });
    sanitizeBody(req as Request, mockRes, mockNext);
    expect((req as Request).body.count).toBe(42);
    expect((req as Request).body.active).toBe(true);
    expect((req as Request).body.nothing).toBeNull();
  });

  it("handles empty body gracefully", () => {
    const req = mockReq({});
    expect(() => sanitizeBody(req as Request, mockRes, mockNext)).not.toThrow();
  });

  it("always calls next()", () => {
    const req = mockReq({ x: "clean" });
    sanitizeBody(req as Request, mockRes, mockNext);
    expect(mockNext).toHaveBeenCalledTimes(1);
  });
});

describe("requestId middleware", () => {
  it("adds X-Request-ID header to response", () => {
    const headers: Record<string, string> = {};
    const res = {
      setHeader: (k: string, v: string) => { headers[k] = v; },
    } as unknown as Response;
    const req = { body: {} } as Request;
    requestId(req, res, mockNext as NextFunction);
    expect(headers["X-Request-ID"]).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
    );
  });
});
