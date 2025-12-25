/**
 * Read Supabase user ID from Authorization: Bearer <access_token>
 */
import { supabaseService } from "@/lib/supabaseService";

export async function requireUserId(req: Request): Promise<string> {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) throw new Error("Missing Bearer token");
  const token = auth.slice("Bearer ".length);

  const { data, error } = await supabaseService.auth.getUser(token);
  if (error || !data.user) throw new Error("Invalid session");
  return data.user.id;
}
