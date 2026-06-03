export class ClaudeApiError extends Error {
  readonly statusCode: number;
  readonly isRetryable: boolean;

  constructor(message: string, statusCode = 500, isRetryable = false) {
    super(message);
    this.name = "ClaudeApiError";
    this.statusCode = statusCode;
    this.isRetryable = isRetryable;
  }
}
