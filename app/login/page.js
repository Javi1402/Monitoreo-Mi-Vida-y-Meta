"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "../../lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const configured = isSupabaseConfigured();
  const [view, setView] = useState("login");
  const [step, setStep] = useState("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function sendCode(event) {
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
      options: { shouldCreateUser: view === "register" },
    });
    setLoading(false);

    if (authError) {
      setError(view === "login"
        ? "No pudimos enviar el código. Verifica que la cuenta esté registrada y vuelve a intentarlo."
        : "No pudimos crear la cuenta. Revisa el correo e inténtalo nuevamente.");
      return;
    }

    setStep("code");
    setMessage(`Enviamos un código de 6 dígitos a ${email.trim()}.`);
  }

  async function verifyCode(event) {
    event.preventDefault();
    setError("");
    const supabase = createClient();
    if (!supabase) return;

    setLoading(true);
    const { error: authError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code,
      type: "email",
    });
    setLoading(false);

    if (authError) {
      setError("El código no es válido o ya venció. Solicita uno nuevo.");
      return;
    }

    router.replace("/");
    router.refresh();
  }

  function changeView(nextView) {
    setView(nextView);
    setStep("email");
    setCode("");
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
          <h1>{step === "code" ? "Revisa tu correo" : view === "login" ? "Bienvenido" : "Crea tu cuenta"}</h1>
          <p className="auth-description">{step === "code"
            ? "Escribe el código para confirmar que este correo te pertenece."
            : view === "login"
              ? "Ingresa con tu correo para consultar únicamente tus propios datos."
              : "Regístrate con tu correo. No necesitas crear ni recordar una contraseña."}</p>

          {!configured && <div className="auth-warning" role="alert">
            <strong>Conexión pendiente</strong>
            <span>Falta configurar las variables públicas de Supabase. El acceso permanecerá bloqueado hasta entonces.</span>
          </div>}

          {step === "email" ? <form onSubmit={sendCode}>
            <label>Correo electrónico
              <input type="email" autoComplete="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="nombre@correo.com" />
            </label>
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary" disabled={loading || !configured}>{loading ? "Enviando…" : "Enviar código de acceso"}</button>
          </form> : <form onSubmit={verifyCode}>
            <label>Código de verificación
              <input className="code-input" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} required value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" aria-describedby="code-help" />
            </label>
            <small id="code-help">El código tiene 6 dígitos y vence por seguridad.</small>
            {message && <p className="form-success" role="status">{message}</p>}
            {error && <p className="form-error" role="alert">{error}</p>}
            <button className="primary" disabled={loading || code.length !== 6}>{loading ? "Verificando…" : "Verificar e ingresar"}</button>
            <button type="button" className="text-button" onClick={() => setStep("email")}>Cambiar correo o solicitar otro código</button>
          </form>}

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
