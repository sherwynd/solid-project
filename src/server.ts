import { fileURLToPath } from "node:url";
import { ServerStartError } from "./application/errors/SystemErrors.js";
import { createProductionRuntime } from "./bootstrap/createProductionRuntime.js";

export async function startServer(): Promise<void> {
  const runtime = await createProductionRuntime();
  try {
    await runtime.app.listen(runtime.listen);
  } catch (error) {
    await runtime.app.close();
    throw new ServerStartError({ cause: error });
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url))
  startServer().catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  });
