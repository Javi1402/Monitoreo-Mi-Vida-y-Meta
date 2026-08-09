"use client";

import { useState } from "react";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [status, setStatus] = useState({ error: "", loading: false });
  async function submit(event) {
    event.preventDefault();
    if (password !== confirmation) return setStatus({ error: "Las contraseñas no coinciden.", loading: false });
    const supabase = createClient();
    if (!supabase) return setStatus({ error: "Supabase no está configurado.", loading: false });
    setStatus({ error: "", loading: true });
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return setStatus({ error: error.message, loading: false });
    await supabase.auth.signOut();
    window.location.assign("/login?password=updated");
  }
  return <main className="dark auth-page"><section className="auth-shell"><div className="auth-card">
    <p className="eyebrow">NUEVA CONTRASEÑA</p><h1>Protege tu cuenta</h1><p className="auth-description">Crea una contraseña nueva de al menos ocho caracteres.</p>
    <form onSubmit={submit}><label>Nueva contraseña<input type="password" minLength={8} required autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <label>Confirma la contraseña<input type="password" minLength={8} required autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>
      {status.error && <p className="form-error" role="alert">{status.error}</p>}<button className="primary" disabled={status.loading}>{status.loading ? "Guardando…" : "Guardar nueva contraseña"}</button></form>
  </div></section></main>;
}
