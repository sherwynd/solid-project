import type { FastifyPluginAsync } from "fastify";
import type { ReceiptController } from "../controllers/ReceiptController.js";
import type { preHandlerHookHandler } from "fastify";
export function receiptRoutes(
  controller: ReceiptController,
  authenticate: preHandlerHookHandler,
): FastifyPluginAsync {
  return (app) => {
    app.post("/scan", { preHandler: authenticate }, controller.scan);
    return Promise.resolve();
  };
}
