import { NextResponse } from "next/server";
import { supabaseService } from "@/lib/supabaseService";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lessonId = url.searchParams.get("lesson");
  if (!lessonId) return NextResponse.json({ error: "Missing lesson" }, { status: 400 });

  const { data: lesson, error: lessonErr } = await supabaseService
    .from("lessons")
    .select("id,lesson_index,title,explanation_md,media_url")
    .eq("id", lessonId)
    .single();

  if (lessonErr) return NextResponse.json({ error: lessonErr.message }, { status: 500 });

  const { data: facts, error: factsErr } = await supabaseService
    .from("lesson_facts")
    .select("fact:facts(id,a,b,answer)")
    .eq("lesson_id", lessonId);

  if (factsErr) return NextResponse.json({ error: factsErr.message }, { status: 500 });

  const normalized = (facts ?? [])
    .map((x: any) => x.fact)
    .filter(Boolean);

  return NextResponse.json({ lesson, facts: normalized });
}
