import { useRouter } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { supabase } from "../lib/supabase";
import { colors } from "../lib/theme";

export default function Index() {
  const router = useRouter();
  useEffect(() => {
    async function routeSession() {
      const { data } = await supabase?.auth.getSession() ?? { data: null };
      router.replace(data?.session ? "/inicio" : "/registro");
    }
    routeSession();
  }, [router]);
  return <View style={styles.loading}><ActivityIndicator color={colors.accent} size="large" /></View>;
}
const styles = StyleSheet.create({ loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background } });
