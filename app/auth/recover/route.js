import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

export async function GET(request) {
  const code = new URL(request.url).searchParams.get("code");
  let response = NextResponse.redirect(new URL(code ? "/account/password" : "/login?error=missing_code", request.url));
  response.cookies.delete("mvm_recovery_pending");

  if (!code) return response;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    { cookies: { getAll: () => request.cookies.getAll(), setAll: (cookies) => cookies.forEach(({ name, value, options }) => response.cookies.set(name, value, options)) } },
  );
  const { error } = await supabase.auth.exchangeCodeForSession(code);
  if (error) {
    response = NextResponse.redirect(new URL("/login?error=invalid_link", request.url));
    response.cookies.delete("mvm_recovery_pending");
  }
  return response;
}
