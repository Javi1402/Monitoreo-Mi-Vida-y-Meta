import { useRouter } from "expo-router";
import { useEffect } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import { PrimaryButton } from "../components/AuthScreen";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";
export default function Home() { const router = useRouter(); useEffect(() => { supabase?.auth.getSession().then(({ data }) => { if (!data.session) router.replace("/login"); }); }, [router]); async function logout() { await supabase?.auth.signOut(); router.replace("/login"); } return <SafeAreaView style={styles.safe}><View style={styles.card}><Text style={styles.eyebrow}>SESIÓN PROTEGIDA</Text><Text style={styles.title}>Bienvenido a MVM</Text><Text style={styles.copy}>Tu sesión se conservará en este dispositivo hasta que cierres sesión o deje de ser válida.</Text><PrimaryButton title="Cerrar sesión" onPress={logout} /></View></SafeAreaView>; }
const styles = StyleSheet.create({ safe: { flex: 1, justifyContent: "center", padding: 22, backgroundColor: colors.background }, card: { padding: 26, borderRadius: 28, backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1 }, eyebrow: { color: colors.accent, fontWeight: "800", letterSpacing: 1.4 }, title: { color: colors.text, fontSize: 31, fontWeight: "800", marginTop: 10 }, copy: { color: colors.muted, fontSize: 16, lineHeight: 24, marginTop: 12 } });
