import { AppError } from "./AppError.js";

export class ConfigurationError extends AppError {
  constructor(options?: ErrorOptions) {
    super("CONFIG_INVALID", "Application configuration is invalid.", options);
  }
}

export class ServerStartError extends AppError {
  constructor(options?: ErrorOptions) {
    super("SERVER_START_FAILED", "The HTTP server could not start.", options);
  }
}

export class RouteNotFoundError extends AppError {
  constructor() {
    super("ROUTE_NOT_FOUND", "The requested route was not found.");
  }
}
