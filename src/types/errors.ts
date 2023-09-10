type ErrorType = "NOT_FOUND" | "DATABASE_ERROR" | "UNKNOWN";

export type BaseError = {
  type: ErrorType;
  message: string;
};

export interface UnknownError extends BaseError {
  type: "UNKNOWN";
}

export interface NotFoundError extends BaseError {
  type: "NOT_FOUND";
}

export interface DBError extends BaseError {
  type: "DATABASE_ERROR";
}
