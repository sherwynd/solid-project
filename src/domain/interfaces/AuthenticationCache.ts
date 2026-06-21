import type { Cache } from "./Cache.js";
import type { AuthPrincipal } from "../types/Auth.js";

export type AuthenticationCache = Cache<AuthPrincipal>;
