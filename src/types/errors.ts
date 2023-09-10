type ErrorType = "NOT_FOUND" | "DATABASE_ERROR" | "UNKNOWN";

export type AnyError = {
  type: ErrorType;
  message: string;
};

export interface UnknownError extends AnyError {
  type: "UNKNOWN";
}

export interface NotFoundError extends AnyError {
  type: "NOT_FOUND";
}

export interface DBError extends AnyError {
  type: "DATABASE_ERROR";
}
