import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/authServer";
import { supabaseService } from "@/lib/supabaseService";

const querySchema = z.object({
  child: z.string().uuid(),
});

export async function GET(req: Request) {
  try {
    const parentId = await requireUserId(req);
    const url = new URL(req.url);
    const q = querySchema.parse({ child: url.searchParams.get("child") });

    const { data: child } = await supabaseService
      .from("children")
      .select("id,parent_id")
      .eq("id", q.child)
      .maybeSingle();

    if (!child || child.parent_id !== parentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, error } = await supabaseService
      .from("lesson_progress")
      .select("lesson_id,passed,passed_at")
      .eq("child_id", q.child);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ progress: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad Request" }, { status: 400 });
  }
}
