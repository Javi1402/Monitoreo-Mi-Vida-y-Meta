"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuthErrorMessage } from "../../lib/auth-errors.mjs";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

export default function LoginPage() {
  const configured = isSupabaseConfigured();
  const [view, setView] = useState("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("confirmed")) setMessage("Correo confirmado. Ya puedes iniciar sesión.");
    if (params.get("password") === "updated") setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
  }, []);

  function changeView(nextView) {
    setView(nextView);
    setPassword("");
    setConfirmation("");
    setError("");
    setMessage("");
  }

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const supabase = createClient();
    if (!supabase) return setError("La conexión con Supabase todavía no está configurada.");
    if (view === "register" && password !== confirmation) return setError("Las contraseñas no coinciden.");
    if (view === "register" && !accepted) return setError("Debes aceptar los términos y la política de privacidad.");

    setLoading(true);
    const result = view === "register"
      ? await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
        })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);

    if (result.error) return setError(getAuthErrorMessage(result.error, view));
    if (view === "register") {
      setMessage(`Enviamos la confirmación a ${email.trim()}. Confirma tu correo y luego inicia sesión.`);
      setView("login");
      setPassword("");
      setConfirmation("");
      return;
    }
    window.location.assign("/");
  }

  return (
    <main className="dark auth-page">
      <section className="auth-shell">
        <div className="brand auth-brand"><div className="logo">M</div><div><strong>MVM</strong><span>Monitoreo Vida y Meta</span></div></div>
        <div className="auth-card">
          <p className="eyebrow">TU BIENESTAR FINANCIERO</p>
          <h1>{view === "register" ? "Crea tu cuenta" : "Inicia sesión"}</h1>
          <p className="auth-description">{view === "register" ? "Empieza a ordenar tus finanzas con tu correo y una contraseña segura." : "Ingresa tus credenciales para continuar donde lo dejaste."}</p>

          {!configured && <div className="auth-warning" role="alert"><strong>Conexión pendiente</strong><span>Configura las variables públicas de Supabase para habilitar el acceso.</span></div>}
          {message && <p className="form-success" role="status">{message}</p>}

          <form onSubmit={submit}>
            <label>Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@correo.com" /></label>
            <label>Contraseña<input type="password" minLength={8} autoComplete={view === "register" ? "new-password" : "current-password"} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" /></label>
            {view === "register" && <>
              <label>Confirma tu contraseña<input type="password" minLength={8} autoComplete="new-password" required value={confirmation} onChange={(event) => setConfirmation(event.target.value)} placeholder="Repite tu contraseña" /></label>
              <label className="check-label"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /> <span>Acepto los <Link href="/terminos">Términos</Link> y la <Link href="/privacidad">Política de privacidad</Link>.</span></label>
            </>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary auth-submit" disabled={loading || !configured}>{loading ? "Procesando…" : view === "register" ? "Crear cuenta" : "Iniciar sesión"}</button>
          </form>

          {view === "login" && <Link className="forgot-link" href="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>}
          <div className="auth-switch"><span>{view === "register" ? "¿Ya tienes una cuenta?" : "¿Aún no tienes una cuenta?"}</span><button type="button" onClick={() => changeView(view === "register" ? "login" : "register")}>{view === "register" ? "Iniciar sesión" : "Registrarme"}</button></div>
        </div>
        <p className="privacy-note">Tus datos financieros son privados y están protegidos por cuenta.</p>
      </section>
    </main>
  );
}
