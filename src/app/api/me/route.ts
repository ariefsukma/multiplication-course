import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/authServer";
import { supabaseService } from "@/lib/supabaseService";

export async function GET(req: Request) {
  try {
    const userId = await requireUserId(req);

    // Ensure parent row exists
    const { data: parent } = await supabaseService
      .from("parents")
      .select("id,email")
      .eq("id", userId)
      .maybeSingle();

    if (!parent) {
      const auth = req.headers.get("authorization")!;
      const token = auth.slice("Bearer ".length);
      const { data } = await supabaseService.auth.getUser(token);
      await supabaseService.from("parents").insert({ id: userId, email: data.user?.email ?? null });
    }

    const { data: children, error } = await supabaseService
      .from("children")
      .select("id,display_name,grade_level,created_at")
      .eq("parent_id", userId)
      .order("created_at", { ascending: true });

    if (error) throw error;

    return NextResponse.json({ parentId: userId, children: children ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Unauthorized" }, { status: 401 });
  }
}
