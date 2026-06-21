import Fastify, {
  type FastifyInstance,
  type FastifyPluginAsync,
} from "fastify";
import { registerErrorHandling } from "./api/errors/registerErrorHandling.js";

export interface BuildAppOptions {
  routes: FastifyPluginAsync;
  logger?: boolean;
  apiPrefix?: string;
}

export async function buildApp(
  options: BuildAppOptions,
): Promise<FastifyInstance> {
  const app = Fastify({ logger: options.logger ?? false });
  registerErrorHandling(app);
  await app.register(options.routes, {
    prefix: options.apiPrefix ?? "/api",
  });
  return app;
}
