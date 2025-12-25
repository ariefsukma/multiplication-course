"use client";

import { useEffect, useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

type Child = {
  id: string;
  display_name: string;
  grade_level: number | null;
  created_at: string;
};

export default function ParentDashboard() {
  const [email, setEmail] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [status, setStatus] = useState<string>("");

  async function refresh(accessToken: string) {
    const res = await fetch("/api/me", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const json = await res.json();
    if (!res.ok) throw new Error(json.error ?? "Failed to load");
    setChildren(json.children ?? []);
  }

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(async ({ data }) => {
      const session = data.session;
      if (!session) {
        window.location.href = "/login";
        return;
      }
      setEmail(session.user.email ?? null);
      setToken(session.access_token);
      try {
        await refresh(session.access_token);
      } catch (e: any) {
        setStatus(`❌ ${e.message ?? "Failed"}`);
      }
    });
  }, []);

  async function addChild() {
    setStatus("");
    if (!token) return;

    const name = prompt("Child name:");
    if (!name) return;

    const res = await fetch("/api/children", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ displayName: name, gradeLevel: null }),
    });

    const json = await res.json();
    if (!res.ok) {
      setStatus(`❌ ${json.error ?? "Failed to add child"}`);
      return;
    }

    await refresh(token);
  }

  async function logout() {
    await supabaseBrowser.auth.signOut();
    window.location.href = "/login";
  }

  return (
    <main>
      <h1>Parent Dashboard</h1>
      <p>
        Signed in as: <b>{email ?? "..."}</b>
      </p>

      <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
        <button onClick={addChild} style={{ padding: "10px 12px", cursor: "pointer" }}>
          + Add child
        </button>
        <button onClick={logout} style={{ padding: "10px 12px", cursor: "pointer" }}>
          Log out
        </button>
      </div>

      {status && <p style={{ marginTop: 12 }}>{status}</p>}

      <h2 style={{ marginTop: 20 }}>Children</h2>
      {children.length === 0 ? (
        <p style={{ opacity: 0.7 }}>No children yet. Click “Add child”.</p>
      ) : (
        <ul>
          {children.map((c) => (
            <li key={c.id}>
              {c.display_name}{" "}
              <span style={{ opacity: 0.7 }}>
                (grade: {c.grade_level ?? "—"})
              </span>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
