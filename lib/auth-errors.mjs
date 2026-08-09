export function getAuthErrorMessage(error, mode) {
  const code = String(error?.code || "").toLowerCase();
  const message = String(error?.message || "").toLowerCase();
  const isRateLimit = error?.status === 429
    || code.includes("rate_limit")
    || message.includes("rate limit")
    || message.includes("after") && message.includes("seconds");

  if (isRateLimit) {
    return "Supabase limitó temporalmente el envío de correos por varios intentos. Espera el tiempo indicado en Authentication → Rate Limits y vuelve a intentarlo una sola vez.";
  }

  if (code.includes("email_address_not_authorized") || message.includes("email address not authorized")) {
    return "El servicio de correo predeterminado de Supabase no está autorizado para enviar a esta dirección. Revisa la configuración de correo del proyecto.";
  }

  if (code.includes("signup_disabled") || message.includes("signups not allowed")) {
    return mode === "login"
      ? "Supabase no encontró una cuenta habilitada para este correo. Comprueba el usuario en Authentication → Users."
      : "El registro de nuevas cuentas está deshabilitado en Supabase Authentication.";
  }

  if (code.includes("invalid_credentials") || message.includes("invalid login credentials")) {
    return "El correo o la contraseña no son correctos. Si tu cuenta se creó anteriormente con un enlace, pulsa “Créala aquí” para establecer una contraseña.";
  }

  if (code.includes("user_already_exists") || message.includes("already registered")) {
    return "Este correo ya está registrado. Inicia sesión o crea una contraseña desde la opción de recuperación.";
  }

  if (code.includes("weak_password") || message.includes("password")) {
    return "La contraseña no cumple los requisitos de seguridad. Utiliza al menos 8 caracteres y evita datos fáciles de adivinar.";
  }

  const reference = error?.code ? ` Referencia: ${error.code}.` : "";
  return `Supabase no pudo enviar el enlace.${reference} Revisa Authentication → Logs para consultar la causa exacta.`;
}
