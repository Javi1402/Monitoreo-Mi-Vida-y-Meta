import { useRouter } from "expo-router";
import { useState } from "react";
import AuthScreen, { ErrorMessage, Field, InlineLink, PrimaryButton } from "../components/AuthScreen";
import { isSupabaseConfigured, supabase } from "../lib/supabase";

export default function Login() {
  const router = useRouter(); const [email, setEmail] = useState(""); const [password, setPassword] = useState(""); const [status, setStatus] = useState({ loading: false, error: "" });
  async function login() { if (!isSupabaseConfigured) return setStatus({ loading: false, error: "Configura las variables públicas de Supabase." }); setStatus({ loading: true, error: "" }); const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password }); if (error) return setStatus({ loading: false, error: error.message === "Email not confirmed" ? "Debes confirmar tu correo antes de ingresar." : "El correo o la contraseña no son correctos." }); router.replace("/inicio"); }
  return <AuthScreen eyebrow="QUÉ BUENO VERTE" title="Inicia sesión" description="Ingresa tus credenciales para continuar." footer={<InlineLink href="/registro">¿No tienes cuenta? Regístrate</InlineLink>}><Field label="Correo electrónico" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} placeholder="nombre@correo.com" /><Field label="Contraseña" secureTextEntry value={password} onChangeText={setPassword} placeholder="Tu contraseña" /><InlineLink href="/recuperar">¿Olvidaste tu contraseña?</InlineLink><ErrorMessage>{status.error}</ErrorMessage><PrimaryButton title="Iniciar sesión" loading={status.loading} disabled={!email || !password} onPress={login} /></AuthScreen>;
}
