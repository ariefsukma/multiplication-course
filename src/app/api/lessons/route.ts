import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";

export async function GET() {
  const courseId = process.env.COURSE_ID;
  if (!courseId) {
    return NextResponse.json({ error: "Missing COURSE_ID in .env.local" }, { status: 500 });
  }

  const { data, error } = await supabaseService
    .from("lessons")
    .select("id,lesson_index,title,explanation_md,media_url")
    .eq("course_id", courseId)
    .order("lesson_index", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ lessons: data ?? [] });
}
