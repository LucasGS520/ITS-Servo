import { supabase } from "./client";
import type { Database } from "./types";

type Functions = Database["public"]["Functions"];
/** Keep the SDK receiver and validate each SQL function's arguments. */
export function rpc<Name extends keyof Functions>(name: Name, args: Functions[Name]["Args"]) {
  return supabase.rpc(name, args);
}
