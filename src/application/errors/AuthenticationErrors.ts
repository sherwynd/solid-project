import { AppError } from "./AppError.js";

export class AccessTokenRequiredError extends AppError {
  constructor(message = "A Bearer access token is required.") {
    super("AUTH_TOKEN_REQUIRED", message);
  }
}

export class AccessTokenInvalidError extends AppError {
  constructor(
    message = "The access token is invalid.",
    options?: ErrorOptions,
  ) {
    super("AUTH_TOKEN_INVALID", message, options);
  }
}

export class AccessTokenExpiredError extends AppError {
  constructor(message = "The access token has expired.") {
    super("AUTH_TOKEN_EXPIRED", message);
  }
}

export class InsufficientScopeError extends AppError {
  constructor(
    readonly requiredScopes: readonly string[],
    message = "The access token does not grant the required scope.",
  ) {
    super("AUTH_SCOPE_INSUFFICIENT", message);
  }
}
