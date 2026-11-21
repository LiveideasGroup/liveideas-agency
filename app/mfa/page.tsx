"use client";
import { useEffect, useRef, useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * Second sign-in step. First visit: set up an authenticator app (TOTP).
 * After that: enter the 6-digit code. The database only serves data to aal2 sessions.
 */
export default function MfaPage() {
  const sb = useRef(supabaseBrowser()).current;
  const [mode, setMode] = useState<"loading" | "enroll" | "verify">("loading");
  const [factorId, setFactorId] = useState("");
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const { data: aal } = await sb.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel === "aal2") return window.location.assign("/");
      const { data, error } = await sb.auth.mfa.listFactors();
      if (error) return setError(error.message);
      const verified = data.totp.find((f) => f.status === "verified");
      if (verified) {
        setFactorId(verified.id);
        setMode("verify");
        return;
      }
      // Clear half-finished setups, then start a fresh one.
      for (const f of data.all.filter((f) => f.factor_type === "totp" && f.status !== "verified")) {
        await sb.auth.mfa.unenroll({ factorId: f.id });
      }
      const enrolled = await sb.auth.mfa.enroll({ factorType: "totp", friendlyName: `Authenticator ${new Date().toISOString().slice(0, 10)}` });
      if (enrolled.error) return setError(enrolled.error.message);
      setFactorId(enrolled.data.id);
      setQr(enrolled.data.totp.qr_code);
      setSecret(enrolled.data.totp.secret);
      setMode("enroll");
    })();
  }, [sb]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const { error } = await sb.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (error) return setError("That code did not work. Check your authenticator app and try again.");
    window.location.assign("/");
  }

  async function signOut() {
    await sb.auth.signOut();
    window.location.assign("/login");
  }

  return (
    <main className="login">
      <h1>Two-step sign-in</h1>
      {mode === "loading" && !error && <p className="muted">Loading…</p>}
      {mode === "enroll" && (
        <>
          <p>Scan this with an authenticator app (Google Authenticator, 1Password, Authy), then enter the 6-digit code.</p>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr && <img src={qr} alt="QR code for your authenticator app" width={180} height={180} />}
          <p className="muted">Can&apos;t scan? Enter this key: <code>{secret}</code></p>
        </>
      )}
      {mode === "verify" && <p>Enter the 6-digit code from your authenticator app.</p>}
      {mode !== "loading" && (
        <form onSubmit={submit}>
          <label htmlFor="code">Code</label>
          <input id="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required
            value={code} onChange={(e) => setCode(e.target.value)} />
          <button type="submit" disabled={busy}>{busy ? "Checking…" : "Continue"}</button>
        </form>
      )}
      {error && <p className="error">{error}</p>}
      <p><button onClick={signOut}>Sign out</button></p>
    </main>
  );
}
