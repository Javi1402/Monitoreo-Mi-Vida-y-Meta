"use client";

import { useState } from "react";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

export default function LoginPage() {
  const configured = isSupabaseConfigured();
  const [view, setView] = useState("login");
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendLink(event) {
    event.preventDefault();
    setError("");
    setMessage("");

    const supabase = createClient();
    if (!supabase) {
      setError("La conexión con Supabase todavía no está configurada.");
      return;
    }

    setLoading(true);
    const { error: authError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: view === "register",
        emailRedirectTo: `${window.location.origin}/auth/confirm`,
      },
    });
    setLoading(false);

    if (authError) {
      setError(view === "login"
        ? "No pudimos enviar el enlace. Verifica que la cuenta esté registrada y vuelve a intentarlo."
        : "No pudimos crear la cuenta. Revisa el correo e inténtalo nuevamente.");
      return;
    }

    setEmailSent(true);
    setMessage(`Enviamos un enlace de acceso a ${email.trim()}.`);
  }

  function changeView(nextView) {
    setView(nextView);
    setEmailSent(false);
    setError("");
    setMessage("");
  }

  return (
    <main className="dark auth-page">
      <section className="auth-shell">
        <div className="brand auth-brand">
          <div className="logo">⌁</div>
          <div><strong>MVM</strong><span>Mi Vida y Meta</span></div>
        </div>

        <div className="auth-card">
          <p className="eyebrow">TU ESPACIO PERSONAL</p>
          <h1>{emailSent ? "Revisa tu correo" : view === "login" ? "Bienvenido" : "Crea tu cuenta"}</h1>
          <p className="auth-description">{emailSent
            ? "Abre el mensaje de Supabase y pulsa el enlace para entrar de forma segura a MVM."
            : view === "login"
              ? "Ingresa con tu correo para consultar únicamente tus propios datos."
              : "Regístrate con tu correo. No necesitas crear ni recordar una contraseña."}</p>

          {!configured && <div className="auth-warning" role="alert">
            <strong>Conexión pendiente</strong>
            <span>Falta configurar las variables públicas de Supabase. El acceso permanecerá bloqueado hasta entonces.</span>
          </div>}

          {!emailSent ? <form onSubmit={sendLink}>
            <label>Correo electrónico
              <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@correo.com" />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary" disabled={loading || !configured}>{loading ? "Enviando…" : "Enviar enlace de acceso"}</button>
          </form> : <div className="email-sent" role="status">
            <div className="mail-icon" aria-hidden="true">✉</div>
            {message && <p className="form-success" role="status">{message}</p>}
            <p>El enlace vence por seguridad y solo puede utilizarse una vez.</p>
            <button type="button" className="secondary" onClick={() => { setEmailSent(false); setMessage(""); }}>Cambiar correo o enviar otro enlace</button>
          </div>}

          <div className="auth-switch">
            <span>{view === "login" ? "¿Es tu primera vez?" : "¿Ya tienes una cuenta?"}</span>
            <button type="button" onClick={() => changeView(view === "login" ? "register" : "login")}>{view === "login" ? "Crear cuenta" : "Iniciar sesión"}</button>
          </div>
        </div>
        <p className="privacy-note">Tus movimientos financieros serán privados y estarán separados por cuenta.</p>
      </section>
    </main>
  );
}
