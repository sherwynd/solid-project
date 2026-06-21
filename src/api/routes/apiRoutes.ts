import type { FastifyPluginAsync } from "fastify";
import { receiptRoutes, type ReceiptRoutesOptions } from "./receiptRoutes.js";

export interface ApiRoutesOptions {
  receipt: ReceiptRoutesOptions;
}

export function apiRoutes(options: ApiRoutesOptions): FastifyPluginAsync {
  return async (app) => {
    app.decorateRequest("authPrincipal", null);
    await app.register(receiptRoutes(options.receipt), {
      prefix: "/v1/receipts",
    });
  };
}
