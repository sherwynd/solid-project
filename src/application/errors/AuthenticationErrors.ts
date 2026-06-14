export class UnauthorizedError extends Error {
  constructor(message = "The access token is missing or invalid.", options?: ErrorOptions) {
    super(message, options);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "The access token does not grant the required scope.") {
    super(message);
    this.name = "ForbiddenError";
  }
}
