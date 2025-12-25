"use client";

import { useEffect, useMemo, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Child = {
  id: string;
  display_name: string;
  grade_level: number | null;
  created_at: string;
};

type Lesson = {
  id: string;
  lesson_index: number;
  title: string;
  explanation_md: string;
  media_url: string | null;
};

type ProgressRow = {
  lesson_id: string;
  passed: boolean;
  passed_at: string | null;
};

export default function LessonsPage() {
  const [token, setToken] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [childId, setChildId] = useState<string>("");
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [status, setStatus] = useState<string>("");

  const selectedChild = useMemo(
    () => children.find((c) => c.id === childId) ?? null,
    [children, childId]
  );

  async function loadProgress(accessToken: string, cId: string) {
    const res = await fetch(`/api/progress?child=${encodeURIComponent(cId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load progress");

    const map: Record<string, boolean> = {};
    (json.progress as ProgressRow[]).forEach((p) => {
      map[p.lesson_id] = Boolean(p.passed);
    });
    setProgress(map);
  }

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!session) {
        window.location.href = "/login";
        return;
      }
      setToken(session.access_token);

      const meRes = await fetch("/api/me", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      const meJson = await meRes.json();
      if (!meRes.ok) {
        setStatus(`❌ ${meJson.error ?? "Failed to load children"}`);
        return;
      }

      const kids: Child[] = meJson.children ?? [];
      setChildren(kids);
      const initialChildId = kids.length > 0 ? kids[0].id : "";
      setChildId(initialChildId);

      const lessonsRes = await fetch("/api/lessons");
      const lessonsJson = await lessonsRes.json();
      if (!lessonsRes.ok) {
        setStatus(`❌ ${lessonsJson.error ?? "Failed to load lessons"}`);
        return;
      }
      const lessonList: Lesson[] = lessonsJson.lessons ?? [];
      setLessons(lessonList);

      if (initialChildId) {
        try {
          await loadProgress(session.access_token, initialChildId);
        } catch (e: any) {
          setStatus(`❌ ${e.message ?? "Failed to load progress"}`);
        }
      }
    });
  }, []);

  async function onChangeChild(newChildId: string) {
    setChildId(newChildId);
    setProgress({});
    setStatus("");
    if (!token || !newChildId) return;

    try {
      await loadProgress(token, newChildId);
    } catch (e: any) {
      setStatus(`❌ ${e.message ?? "Failed to load progress"}`);
    }
  }

  function isUnlocked(i: number): boolean {
    if (i === 0) return true;
    const prevLesson = lessons[i - 1];
    return Boolean(progress[prevLesson.id]);
  }

  function openLesson(lessonIdToOpen: string) {
    if (!childId) {
      setStatus("❌ Please select a child first.");
      return;
    }
    window.location.href = `/practice?child=${encodeURIComponent(childId)}&lesson=${encodeURIComponent(
      lessonIdToOpen
    )}`;
  }

  return (
    <main>
      <h1>Lessons</h1>

      {status && <p>{status}</p>}

      <div style={{ marginTop: 12 }}>
        <label>
          Child:{" "}
          <select
            value={childId}
            onChange={(e) => onChangeChild(e.target.value)}
            style={{ padding: 8 }}
          >
            {children.length === 0 ? (
              <option value="">No children</option>
            ) : (
              children.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.display_name}
                </option>
              ))
            )}
          </select>
        </label>

        {children.length === 0 && (
          <p style={{ marginTop: 10, opacity: 0.7 }}>
            Please add a child first in the Parent Dashboard.
          </p>
        )}

        {selectedChild && (
          <p style={{ marginTop: 10, opacity: 0.7 }}>
            Selected: <b>{selectedChild.display_name}</b>
          </p>
        )}
      </div>

      <h2 style={{ marginTop: 20 }}>Lesson List</h2>
      {lessons.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No lessons found (check COURSE_ID).</p>
      ) : (
        <ol>
          {lessons.map((l, i) => {
            const unlocked = isUnlocked(i);
            const passed = Boolean(progress[l.id]);

            return (
              <li key={l.id} style={{ marginBottom: 10 }}>
                <button
                  onClick={() => openLesson(l.id)}
                  disabled={!unlocked || !childId}
                  style={{
                    padding: "8px 10px",
                    cursor: unlocked ? "pointer" : "not-allowed",
                    opacity: unlocked ? 1 : 0.4,
                  }}
                >
                  Lesson {l.lesson_index}: {l.title} {!unlocked ? "🔒" : passed ? "✅" : ""}
                </button>
              </li>
            );
          })}
        </ol>
      )}

      <p style={{ marginTop: 20, opacity: 0.7 }}>
        Rule: You must pass a lesson (50/50) to unlock the next one.
      </p>
    </main>
  );
}
