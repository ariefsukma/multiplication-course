import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/authServer";
import { supabaseService } from "@/lib/supabaseService";

const bodySchema = z.object({
  displayName: z.string().min(1).max(40),
  gradeLevel: z.number().int().min(1).max(12).nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const userId = await requireUserId(req);
    const body = bodySchema.parse(await req.json());

    const { data, error } = await supabaseService
      .from("children")
      .insert({
        parent_id: userId,
        display_name: body.displayName,
        grade_level: body.gradeLevel ?? null,
      })
      .select("id,display_name,grade_level,created_at")
      .single();

    if (error) throw error;

    return NextResponse.json({ child: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad Request" }, { status: 400 });
  }
}
