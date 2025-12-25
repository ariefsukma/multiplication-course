"use client";

import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabaseBrowser";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string>("");

  async function signUp() {
    setStatus("Working...");
    const { error } = await supabaseBrowser.auth.signUp({ email, password });
    if (error) return setStatus(`❌ ${error.message}`);
    setStatus("✅ Signed up. Now click Sign in.");
  }

  async function signIn() {
    setStatus("Working...");
    const { error } = await supabaseBrowser.auth.signInWithPassword({ email, password });
    if (error) return setStatus(`❌ ${error.message}`);
    window.location.href = "/parent/dashboard";
  }

  return (
    <main style={{ maxWidth: 420 }}>
      <h1>Login</h1>
      <p style={{ opacity: 0.7 }}>Parents sign in to manage children and progress.</p>

      <label style={{ display: "block", marginTop: 12 }}>
        Email
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@email.com"
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </label>

      <label style={{ display: "block", marginTop: 12 }}>
        Password
        <input
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          type="password"
          placeholder="••••••••"
          style={{ width: "100%", padding: 10, marginTop: 6 }}
        />
      </label>

      <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
        <button onClick={signIn} style={{ padding: "10px 12px", cursor: "pointer" }}>
          Sign in
        </button>
        <button onClick={signUp} style={{ padding: "10px 12px", cursor: "pointer" }}>
          Sign up
        </button>
      </div>

      {status && <p style={{ marginTop: 12 }}>{status}</p>}
    </main>
  );
}
