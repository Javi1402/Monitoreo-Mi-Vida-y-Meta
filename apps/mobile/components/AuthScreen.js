import { Link } from "expo-router";
import { Pressable, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { colors } from "../lib/theme";

export default function AuthScreen({ eyebrow, title, description, children, footer }) {
  return <SafeAreaView style={styles.safe}><ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
    <View style={styles.brand}><View style={styles.mark}><Text style={styles.markText}>M</Text></View><View><Text style={styles.brandTitle}>MVM</Text><Text style={styles.brandCaption}>Monitoreo Vida y Meta</Text></View></View>
    <View style={styles.card}><Text style={styles.eyebrow}>{eyebrow}</Text><Text style={styles.title}>{title}</Text><Text style={styles.description}>{description}</Text>{children}{footer}</View>
    <Text style={styles.privacy}>Tus datos financieros son privados y están protegidos por cuenta.</Text>
  </ScrollView></SafeAreaView>;
}

export function Field({ label, ...props }) { return <View style={styles.fieldGroup}><Text style={styles.label}>{label}</Text><TextInput placeholderTextColor="#727a74" style={styles.input} {...props} /></View>; }
export function PrimaryButton({ title, loading, disabled, onPress }) { return <Pressable accessibilityRole="button" disabled={disabled || loading} onPress={onPress} style={({ pressed }) => [styles.primary, (disabled || loading) && styles.disabled, pressed && styles.pressed]}><Text style={styles.primaryText}>{loading ? "Procesando…" : title}</Text></Pressable>; }
export function ErrorMessage({ children }) { return children ? <Text accessibilityRole="alert" style={styles.error}>{children}</Text> : null; }
export function SuccessMessage({ children }) { return children ? <Text style={styles.success}>{children}</Text> : null; }
export function InlineLink({ href, children }) { return <Link href={href} asChild><Pressable><Text style={styles.link}>{children}</Text></Pressable></Link>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background }, scroll: { flexGrow: 1, justifyContent: "center", padding: 22, paddingVertical: 42 },
  brand: { flexDirection: "row", justifyContent: "center", alignItems: "center", gap: 12, marginBottom: 28 }, mark: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent }, markText: { color: "#092016", fontSize: 26, fontWeight: "900" }, brandTitle: { color: colors.text, fontSize: 21, fontWeight: "800" }, brandCaption: { color: colors.muted, marginTop: 2 },
  card: { borderWidth: 1, borderColor: colors.border, borderRadius: 28, padding: 24, backgroundColor: colors.surface }, eyebrow: { color: colors.accent, fontSize: 12, fontWeight: "800", letterSpacing: 1.5, marginBottom: 10 }, title: { color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: "800", marginBottom: 10 }, description: { color: colors.muted, fontSize: 16, lineHeight: 24, marginBottom: 8 },
  fieldGroup: { marginTop: 17 }, label: { color: colors.text, fontWeight: "700", marginBottom: 8 }, input: { color: colors.text, backgroundColor: colors.field, borderColor: colors.border, borderWidth: 1, borderRadius: 14, paddingHorizontal: 15, paddingVertical: 14, fontSize: 16 }, primary: { marginTop: 24, minHeight: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", backgroundColor: colors.accent }, primaryText: { color: "#092016", fontWeight: "800", fontSize: 16 }, disabled: { opacity: .45 }, pressed: { transform: [{ scale: .99 }] },
  error: { color: colors.danger, backgroundColor: colors.dangerBg, borderRadius: 11, padding: 12, marginTop: 16, lineHeight: 20 }, success: { color: "#9beabd", backgroundColor: "#153c2d", borderRadius: 11, padding: 12, marginTop: 16, lineHeight: 20 }, link: { color: colors.accent, textAlign: "center", fontWeight: "700", marginTop: 20 }, privacy: { color: colors.muted, textAlign: "center", fontSize: 12, lineHeight: 18, marginTop: 20 },
});
