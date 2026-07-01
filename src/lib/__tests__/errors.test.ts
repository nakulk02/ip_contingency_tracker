import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
  RateLimitError,
} from "../errors";

describe("AppError", () => {
  it("sets message, statusCode, code, and details", () => {
    const err = new AppError("something broke", 500, "BROKEN", { extra: true });
    expect(err.message).toBe("something broke");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("BROKEN");
    expect(err.details).toEqual({ extra: true });
  });

  it("is an instance of Error", () => {
    const err = new AppError("x", 500, "X");
    expect(err).toBeInstanceOf(Error);
  });

  it("sets name to the concrete subclass name", () => {
    const err = new NotFoundError("Widget");
    expect(err.name).toBe("NotFoundError");
  });
});

describe("NotFoundError", () => {
  it("defaults to a generic 'Resource not found' message", () => {
    const err = new NotFoundError();
    expect(err.message).toBe("Resource not found");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("NOT_FOUND");
  });

  it("includes the resource name when provided", () => {
    const err = new NotFoundError("IP asset");
    expect(err.message).toBe("IP asset not found");
  });
});

describe("ValidationError", () => {
  it("defaults to 400 with a generic message", () => {
    const err = new ValidationError();
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("VALIDATION_ERROR");
    expect(err.message).toBe("Invalid input");
  });

  it("carries field-level details when provided", () => {
    const details = [{ path: "email", message: "Invalid email" }];
    const err = new ValidationError("Invalid input", details);
    expect(err.details).toEqual(details);
  });
});

describe("UnauthorizedError", () => {
  it("defaults to 401", () => {
    const err = new UnauthorizedError();
    expect(err.statusCode).toBe(401);
    expect(err.code).toBe("UNAUTHORIZED");
  });
});

describe("ForbiddenError", () => {
  it("defaults to 403", () => {
    const err = new ForbiddenError();
    expect(err.statusCode).toBe(403);
    expect(err.code).toBe("FORBIDDEN");
  });
});

describe("ConflictError", () => {
  it("defaults to 409", () => {
    const err = new ConflictError();
    expect(err.statusCode).toBe(409);
    expect(err.code).toBe("CONFLICT");
  });
});

describe("RateLimitError", () => {
  it("defaults to 429", () => {
    const err = new RateLimitError();
    expect(err.statusCode).toBe(429);
    expect(err.code).toBe("RATE_LIMITED");
  });
});
