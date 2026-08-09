"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

export default function RecoverPasswordPage() {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState({ error: "", message: "", loading: false });

  async function submit(event) {
    event.preventDefault();
    const supabase = createClient();
    if (!supabase) return setStatus({ error: "Supabase no está configurado.", message: "", loading: false });
    setStatus({ error: "", message: "", loading: true });
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/auth/confirm?next=/restablecer-contrasena`,
    });
    setStatus(error
      ? { error: error.message, message: "", loading: false }
      : { error: "", message: "Si existe una cuenta con ese correo, recibirás instrucciones para restablecer tu contraseña.", loading: false });
  }

  return <main className="dark auth-page"><section className="auth-shell"><div className="auth-card">
    <p className="eyebrow">RECUPERA TU ACCESO</p><h1>Restablece tu contraseña</h1><p className="auth-description">Te enviaremos un enlace seguro para crear una contraseña nueva.</p>
    <form onSubmit={submit}><label>Correo electrónico<input type="email" required autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@correo.com" /></label>
      {status.error && <p className="form-error" role="alert">{status.error}</p>}{status.message && <p className="form-success" role="status">{status.message}</p>}
      <button className="primary" disabled={status.loading || !isSupabaseConfigured()}>{status.loading ? "Enviando…" : "Enviar enlace"}</button></form>
    <Link className="back-link" href="/login">← Volver a iniciar sesión</Link>
  </div></section></main>;
}
