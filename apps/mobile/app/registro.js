import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import AuthScreen, { ErrorMessage, Field, InlineLink, PrimaryButton, SuccessMessage } from "../components/AuthScreen";
import { isSupabaseConfigured, supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

export default function Register() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "", confirmation: "" });
  const [accepted, setAccepted] = useState(false);
  const [status, setStatus] = useState({ loading: false, error: "", message: "" });
  async function register() {
    if (form.password !== form.confirmation) return setStatus({ loading: false, message: "", error: "Las contraseñas no coinciden." });
    if (!accepted) return setStatus({ loading: false, message: "", error: "Debes aceptar los términos y la política de privacidad." });
    if (!isSupabaseConfigured) return setStatus({ loading: false, message: "", error: "Configura las variables públicas de Supabase." });
    setStatus({ loading: true, error: "", message: "" });
    const { error } = await supabase.auth.signUp({ email: form.email.trim(), password: form.password, options: { emailRedirectTo: Linking.createURL("auth/confirm") } });
    if (error) return setStatus({ loading: false, message: "", error: error.message });
    setStatus({ loading: false, error: "", message: "Confirma tu correo desde el enlace que enviamos. Después podrás iniciar sesión." });
  }
  return <AuthScreen eyebrow="EMPIEZA HOY" title="Crea tu cuenta" description="Organiza tus finanzas con tu correo y una contraseña segura." footer={<InlineLink href="/login">¿Ya tienes una cuenta? Inicia sesión</InlineLink>}>
    <Field label="Correo electrónico" keyboardType="email-address" autoCapitalize="none" autoComplete="email" value={form.email} onChangeText={(email) => setForm({ ...form, email })} placeholder="nombre@correo.com" />
    <Field label="Contraseña" secureTextEntry autoComplete="new-password" value={form.password} onChangeText={(password) => setForm({ ...form, password })} placeholder="Mínimo 8 caracteres" />
    <Field label="Confirma tu contraseña" secureTextEntry value={form.confirmation} onChangeText={(confirmation) => setForm({ ...form, confirmation })} placeholder="Repite tu contraseña" />
    <Pressable onPress={() => setAccepted(!accepted)} style={styles.check}><View style={[styles.box, accepted && styles.checked]}><Text>{accepted ? "✓" : ""}</Text></View><Text style={styles.checkText}>Acepto los términos y la política de privacidad.</Text></Pressable>
    <ErrorMessage>{status.error}</ErrorMessage><SuccessMessage>{status.message}</SuccessMessage><PrimaryButton title="Crear cuenta" loading={status.loading} onPress={register} disabled={form.password.length < 8 || !form.email} />
  </AuthScreen>;
}
const styles = StyleSheet.create({ check: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 18 }, box: { width: 22, height: 22, borderWidth: 1, borderColor: colors.border, borderRadius: 5, backgroundColor: colors.field, alignItems: "center", justifyContent: "center" }, checked: { backgroundColor: colors.accent }, checkText: { flex: 1, color: colors.muted, lineHeight: 20 } });
