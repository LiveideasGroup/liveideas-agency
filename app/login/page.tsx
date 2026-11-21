"use client";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email,
      // Only the owner's existing account may sign in; no new sign-ups from this page.
      options: { shouldCreateUser: false, emailRedirectTo: `${window.location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else {
      setState("sent");
    }
  }

  return (
    <main className="login">
      <h1>LiveIdeas control room</h1>
      {state === "sent" ? (
        <p>Check your inbox for a sign-in link.</p>
      ) : (
        <form onSubmit={submit}>
          <label htmlFor="email">Owner email</label>
          <input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          <button type="submit" disabled={state === "sending"}>
            {state === "sending" ? "Sending…" : "Send sign-in link"}
          </button>
          {state === "error" && <p className="error">{error}</p>}
        </form>
      )}
    </main>
  );
}
