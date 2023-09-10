import { Result } from "neverthrow";
import { ApiResponse } from "../types";
import { AnyError } from "../types/errors";
import { Context } from "elysia";
import { match } from "ts-pattern";

export function wrapApiResponse<T>(
  result: Result<T, AnyError>,
  set: Context["set"],
): ApiResponse<T> {
  if (result.isOk()) {
    return {
      ok: true as const,
      data: result.value,
    };
  } else {
    return match(result.error)
      .with({ type: "NOT_FOUND" }, ({ message, type }) => {
        set.status = 404;
        return {
          ok: false as const,
          error: {
            message,
            type,
          },
        };
      })
      .otherwise(({ message, type }) => {
        set.status = 500;
        return {
          ok: false as const,
          error: {
            message,
            type,
          },
        };
      });
  }
}
