import { NextResponse } from "next/server";
import { ZodError } from "zod";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export function apiError(message: string, status = 400, details?: unknown) {
  return NextResponse.json({ error: message, details }, { status });
}

export function apiSuccess<T>(data: T, status = 200) {
  return NextResponse.json({ data }, { status });
}

/**
 * Wraps a route handler so unexpected errors never leak stack traces or
 * internal details to the client — they're logged server-side and the
 * client gets a generic, friendly message instead.
 */
export function withErrorHandling<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
) {
  return async (...args: Args): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (error) {
      if (error instanceof ApiError) {
        return apiError(error.message, error.status);
      }
      if (error instanceof ZodError) {
        return apiError("Invalid request data", 422, error.flatten());
      }
      console.error("[api] unhandled error:", error);
      return apiError("Something went wrong. Please try again in a moment.", 500);
    }
  };
}
