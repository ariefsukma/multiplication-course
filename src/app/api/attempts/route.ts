import { NextResponse } from "next/server";
import { z } from "zod";
import { requireUserId } from "@/lib/authServer";
import { supabaseService } from "@/lib/supabaseService";

const bodySchema = z.object({
  childId: z.string().uuid(),
  factId: z.string().uuid(),
  userAnswer: z.number().int(),
  responseMs: z.number().int().optional(),
  lessonId: z.string().uuid().optional(),
  perfectRun: z.boolean().optional(),
});

export async function POST(req: Request) {
  try {
    const parentId = await requireUserId(req);
    const body = bodySchema.parse(await req.json());

    const { data: child } = await supabaseService
      .from("children")
      .select("id,parent_id")
      .eq("id", body.childId)
      .single();

    if (!child || child.parent_id !== parentId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data: fact } = await supabaseService
      .from("facts")
      .select("answer")
      .eq("id", body.factId)
      .single();

    const isCorrect = Number(body.userAnswer) === Number(fact.answer);

    await supabaseService.from("attempts").insert({
      child_id: body.childId,
      fact_id: body.factId,
      user_answer: body.userAnswer,
      is_correct: isCorrect,
      response_ms: body.responseMs ?? null,
    });

    if (body.perfectRun && body.lessonId) {
      await supabaseService.from("lesson_progress").upsert({
        child_id: body.childId,
        lesson_id: body.lessonId,
        passed: true,
        passed_at: new Date().toISOString(),
      });
    }

    return NextResponse.json({ ok: true, isCorrect });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
