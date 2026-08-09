"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthErrorMessage } from "../../../lib/auth-errors.mjs";
import { createClient } from "../../../lib/supabase/client";

export default function PasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function save(event) {
    event.preventDefault();
    setError("");
    if (password !== confirmation) {
      setError("Las contraseñas no coinciden.");
      return;
    }
    const supabase = createClient();
    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (authError) {
      setError(getAuthErrorMessage(authError, "password"));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  return <main className="dark auth-page"><section className="auth-shell"><div className="brand auth-brand"><div className="logo">⌁</div><div><strong>MVM</strong><span>Mi Vida y Meta</span></div></div><div className="auth-card"><p className="eyebrow">SEGURIDAD</p><h1>Crea tu contraseña</h1><p className="auth-description">La utilizarás junto con tu correo en los próximos ingresos.</p><form onSubmit={save}><label>Nueva contraseña<input type="password" autoComplete="new-password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" /></label><label>Confirmar contraseña<input type="password" autoComplete="new-password" minLength={8} required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} /></label>{error && <p className="form-error" role="alert">{error}</p>}<button className="primary" disabled={loading}>{loading ? "Guardando…" : "Guardar contraseña"}</button></form></div></section></main>;
}
