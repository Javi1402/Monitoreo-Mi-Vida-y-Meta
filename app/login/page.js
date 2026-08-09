"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getAuthErrorMessage } from "../../lib/auth-errors.mjs";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [view, setView] = useState("login");
  const [emailSent, setEmailSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setError("");
    setMessage("");
    const supabase = createClient();
    if (!supabase) {
      setError("La conexión con Supabase todavía no está configurada.");
      return;
    }

    setLoading(true);
    if (view === "recovery") {
      const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/recover`,
      });
      setLoading(false);
      if (authError) {
        setError(getAuthErrorMessage(authError, view));
        return;
      }
      document.cookie = "mvm_recovery_pending=1; Path=/; Max-Age=3600; SameSite=Lax; Secure";
      setEmailSent(true);
      setMessage(`Enviamos las instrucciones a ${email.trim()}.`);
      return;
    }

    if (view === "register") {
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { emailRedirectTo: `${window.location.origin}/auth/confirm` },
      });
      setLoading(false);
      if (authError) {
        setError(getAuthErrorMessage(authError, view));
        return;
      }
      if (data.session) {
        router.replace("/");
        router.refresh();
      } else {
        setEmailSent(true);
        setMessage(`Enviamos la confirmación a ${email.trim()}.`);
      }
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (authError) {
      setError(getAuthErrorMessage(authError, view));
      return;
    }
    router.replace("/");
    router.refresh();
  }

  function changeView(nextView) {
    setView(nextView);
    setEmailSent(false);
    setPassword("");
    setError("");
    setMessage("");
  }

  const title = emailSent ? "Revisa tu correo" : view === "register" ? "Crea tu cuenta" : view === "recovery" ? "Crea una contraseña" : "Bienvenido";
  const description = emailSent
    ? "Abre el mensaje más reciente y sigue el enlace seguro de Supabase."
    : view === "register"
      ? "Registra tu correo y una contraseña personal para entrar habitualmente."
      : view === "recovery"
        ? "Recibirás un único enlace para crear o cambiar tu contraseña."
        : "Ingresa con tu correo y contraseña para consultar tus propios datos.";

  return (
    <main className="dark auth-page">
      <section className="auth-shell">
        <div className="brand auth-brand"><div className="logo">⌁</div><div><strong>MVM</strong><span>Mi Vida y Meta</span></div></div>
        <div className="auth-card">
          <p className="eyebrow">TU ESPACIO PERSONAL</p>
          <h1>{title}</h1>
          <p className="auth-description">{description}</p>
          {!configured && <div className="auth-warning" role="alert"><strong>Conexión pendiente</strong><span>Falta configurar las variables públicas de Supabase.</span></div>}

          {!emailSent ? <form onSubmit={submit}>
            <label>Correo electrónico<input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@correo.com" /></label>
            {view !== "recovery" && <label>Contraseña
              <div className="password-field"><input type={showPassword ? "text" : "password"} autoComplete={view === "register" ? "new-password" : "current-password"} minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Mínimo 8 caracteres" /><button type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword ? "Ocultar" : "Ver"}</button></div>
            </label>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary" disabled={loading || !configured}>{loading ? "Procesando…" : view === "register" ? "Crear cuenta" : view === "recovery" ? "Enviar instrucciones" : "Ingresar"}</button>
          </form> : <div className="email-sent" role="status"><div className="mail-icon" aria-hidden="true">✉</div><p className="form-success">{message}</p><p>El enlace vence por seguridad y solo puede utilizarse una vez.</p><button className="secondary" onClick={() => setEmailSent(false)}>Volver a intentarlo</button></div>}

          <div className="auth-links">
            {view === "login" && <button type="button" onClick={() => changeView("recovery")}>¿Aún no tienes contraseña? Créala aquí</button>}
            <div className="auth-switch"><span>{view === "register" ? "¿Ya tienes una cuenta?" : "¿Es tu primera vez?"}</span><button type="button" onClick={() => changeView(view === "register" ? "login" : "register")}>{view === "register" ? "Iniciar sesión" : "Crear cuenta"}</button></div>
          </div>
        </div>
        <p className="privacy-note">Tu contraseña nunca se guarda en el código de MVM.</p>
      </section>
    </main>
  );
}
