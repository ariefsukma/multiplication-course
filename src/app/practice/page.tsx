"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Fact = { id: string; a: number; b: number; answer: number };
type Lesson = { id: string; lesson_index: number; title: string; explanation_md: string };

const QUESTIONS_PER_SESSION = 50;

export default function PracticePage() {
  const [childId, setChildId] = useState<string>("");
  const [lessonId, setLessonId] = useState<string>("");
  const [token, setToken] = useState<string | null>(null);

  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [questions, setQuestions] = useState<Fact[]>([]);
  const [qIndex, setQIndex] = useState(0);

  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<string>("");

  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [done, setDone] = useState(false);

  const startTsRef = useRef<number>(Date.now());

  const current = useMemo(() => questions[qIndex] ?? null, [questions, qIndex]);

  async function loadSession(accessToken: string, cId: string, lId: string) {
    setStatus("");
    setAnswer("");
    setCorrectCount(0);
    setWrongCount(0);
    setDone(false);
    setQIndex(0);
    startTsRef.current = Date.now();

    const res = await fetch(
      `/api/practice/session?child=${encodeURIComponent(cId)}&lesson=${encodeURIComponent(
        lId
      )}&count=${QUESTIONS_PER_SESSION}`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load session");

    setLesson(json.lesson);
    setQuestions(json.questions ?? []);
  }

  useEffect(() => {
    const url = new URL(window.location.href);
    const c = url.searchParams.get("child") ?? "";
    const l = url.searchParams.get("lesson") ?? "";
    setChildId(c);
    setLessonId(l);

    supabaseBrowser.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!session) {
        window.location.href = "/login";
        return;
      }
      setToken(session.access_token);
      try {
        await loadSession(session.access_token, c, l);
      } catch (e: any) {
        setStatus(`❌ ${e.message ?? "Failed"}`);
      }
    });
  }, []);

  async function submit() {
    setStatus("");
    if (!token) return;
    if (!childId) return setStatus("❌ Missing child id. Go back to Lessons.");
    if (!current) return;

    const userAnswer = Number(answer);
    if (!Number.isFinite(userAnswer)) return setStatus("❌ Please type a number.");

    const responseMs = Date.now() - startTsRef.current;

    // IMPORTANT: compute these BEFORE the fetch object
    const isLastQuestion = qIndex + 1 >= questions.length;
    // We'll send perfectRun as "attempt to finish perfectly".
    // Backend only upserts lesson_progress when perfectRun=true.
    const perfectRun = isLastQuestion && wrongCount === 0;

    const res = await fetch("/api/attempts", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        childId,
        factId: current.id,
        userAnswer,
        responseMs,
        lessonId,
        perfectRun,
      }),
    });

    const json = await res.json();
    if (!res.ok) return setStatus(`❌ ${json.error ?? "Failed to save attempt"}`);

    if (json.isCorrect) {
      setCorrectCount((n) => n + 1);
      setStatus("✅ Correct!");
    } else {
      setWrongCount((n) => n + 1);
      setStatus(`❌ Wrong. Correct is ${current.answer}`);
    }

    setAnswer("");

    const next = qIndex + 1;
    if (next >= questions.length) {
      setDone(true);
      return;
    }

    setQIndex(next);
    startTsRef.current = Date.now();
  }

  const pass =
    done &&
    wrongCount === 0 &&
    correctCount === questions.length &&
    questions.length === QUESTIONS_PER_SESSION;

  return (
    <main style={{ maxWidth: 520 }}>
      <h1>Practice</h1>

      {lesson ? (
        <p style={{ opacity: 0.75 }}>
          Lesson {lesson.lesson_index}: <b>{lesson.title}</b> — must get <b>50/50</b>
        </p>
      ) : (
        <p style={{ opacity: 0.75 }}>Loading lesson...</p>
      )}

      {done ? (
        pass ? (
          <>
            <h2>PASS ✅ 50/50</h2>
            <a href="/parent/lessons">Back to lessons</a>
          </>
        ) : (
          <>
            <h2>Not passed ❌</h2>
            <p>
              Correct: <b>{correctCount}</b> / <b>{questions.length}</b> — Wrong: <b>{wrongCount}</b>
            </p>
            <p>Requirement: 50/50. Refresh page to try again.</p>
            <a href="/parent/lessons">Back to lessons</a>
          </>
        )
      ) : !current ? (
        <p style={{ opacity: 0.7 }}>Loading questions...</p>
      ) : (
        <>
          <div style={{ marginTop: 18, fontSize: 28 }}>
            <b>{current.a}</b> × <b>{current.b}</b> = ?
          </div>

          <div style={{ marginTop: 12, display: "flex", gap: 10 }}>
            <input
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              inputMode="numeric"
              placeholder="Type answer"
              style={{ padding: 10, width: 180, fontSize: 16 }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
            />
            <button onClick={submit} style={{ padding: "10px 12px", cursor: "pointer" }}>
              Submit
            </button>
          </div>

          {status && <p style={{ marginTop: 10 }}>{status}</p>}

          <p style={{ marginTop: 18, opacity: 0.7 }}>
            Question {qIndex + 1} / {questions.length} — Correct: {correctCount} — Wrong:{" "}
            {wrongCount}
          </p>

          <p style={{ marginTop: 12 }}>
            <a href="/parent/lessons">← Back to lessons</a>
          </p>
        </>
      )}
    </main>
  );
}
