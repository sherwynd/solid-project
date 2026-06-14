import type { FastifyPluginAsync } from "fastify";
import type { ReceiptController } from "../controllers/ReceiptController.js";
export function receiptRoutes(
  controller: ReceiptController,
): FastifyPluginAsync {
  return (app) => {
    app.post("/scan", controller.scan);
    return Promise.resolve();
  };
}
