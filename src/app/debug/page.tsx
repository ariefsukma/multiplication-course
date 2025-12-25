"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

export default function DebugPage() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(url, key);

    (window as any).supabase = supabase;
    console.log("✅ window.supabase attached");
    setReady(true);
  }, []);

  return (
    <main style={{ padding: 16 }}>
      <h1>Debug</h1>
      <p>Status: {ready ? "✅ Ready" : "⏳ Loading..."}</p>
      <p>Open Console and run <code>window.supabase</code></p>
    </main>
  );
}
