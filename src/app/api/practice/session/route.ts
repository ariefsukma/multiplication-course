import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/authServer";
import { supabaseService } from "@/lib/supabaseService";

type Fact = { id: string; a: number; b: number; answer: number };

const querySchema = z.object({
  child: z.string().uuid(),
  lesson: z.string().uuid(),
  count: z.coerce.number().int().min(10).max(200).default(50),
});

function buildQuestionSet(facts: Fact[], count: number): Fact[] {
  if (facts.length === 0) return [];
  const out: Fact[] = [];
  for (let i = 0; i < count; i += 1) {
    out.push(facts[Math.floor(Math.random() * facts.length)]);
  }
  return out;
}

export async function GET(req: Request) {
  try {
    const parentId = await requireUserId(req);
    const url = new URL(req.url);
    const q = querySchema.parse({
      child: url.searchParams.get("child"),
      lesson: url.searchParams.get("lesson"),
      count: url.searchParams.get("count") ?? undefined,
    });

    const { data: child } = await supabaseService
      .from("children")
      .select("id,parent_id")
      .eq("id", q.child)
      .maybeSingle();

    if (!child || child.parent_id !== parentId) {
      return NextResponse.json({ error: "Child not owned by parent" }, { status: 403 });
    }

    const { data: lesson, error: lessonErr } = await supabaseService
      .from("lessons")
      .select("id,lesson_index,title,explanation_md,media_url")
      .eq("id", q.lesson)
      .single();

    if (lessonErr) return NextResponse.json({ error: lessonErr.message }, { status: 500 });

    const { data: rows, error } = await supabaseService
      .from("lesson_facts")
      .select("fact:facts(id,a,b,answer)")
      .eq("lesson_id", q.lesson);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const facts: Fact[] = (rows ?? []).map((r: any) => r.fact).filter(Boolean);
    const questions = buildQuestionSet(facts, q.count);

    return NextResponse.json({ lesson, questions });
  } catch (e: any) {
    return NextResponse.json({ error: e.message ?? "Bad Request" }, { status: 400 });
  }
}
