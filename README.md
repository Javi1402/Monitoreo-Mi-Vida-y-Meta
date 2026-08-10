# Monitoreo mi Vida y Meta (MVM)

Aplicación de organización financiera con cliente web en Next.js y un nuevo cliente móvil nativo en Expo/React Native.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Estructura

- La aplicación web compatible con Vercel permanece en la raíz para no interrumpir el despliegue actual.
- `apps/mobile` contiene la aplicación nativa para Android y iOS.
- `supabase/migrations` conserva el esquema compartido de base de datos.

## Estado actual

- La aplicación inicia sin sueldo, movimientos, deuda ni fechas precargadas.
- Los datos solo viven en el estado temporal del navegador y se reinician al recargar.
- El registro y acceso utilizan correo y contraseña; las cuentas nuevas deben confirmar el correo.
- La sesión se conserva automáticamente en web y en el dispositivo móvil.
- Sin las variables públicas de Supabase, el acceso permanece bloqueado y muestra una explicación de configuración pendiente.
- El despliegue piloto está publicado en Vercel, pero todavía no persiste movimientos en Supabase.
- La planificación del periodo sí guarda ingreso, fecha inicial, metas y configuración opcional de tarjeta en Supabase.

## Configurar autenticación

1. Copia `.env.example` como `.env.local`.
2. Completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con los valores públicos del proyecto.
3. En Supabase Auth habilita Email, activa **Confirm email** y establece una contraseña mínima de 8 caracteres.
4. En **Authentication → URL Configuration**, usa `https://monitoreo-mi-vida-y-meta.vercel.app` como Site URL.
5. Agrega estas Redirect URLs:
   - `https://monitoreo-mi-vida-y-meta.vercel.app/auth/confirm`
   - `https://monitoreo-mi-vida-y-meta.vercel.app/auth/confirm?next=/restablecer-contrasena`
   - `mvm://auth/confirm`
   - `mvm://auth/recovery`

El correo de alta confirma la cuenta y devuelve al inicio de sesión. La recuperación abre primero la pantalla que permite elegir una contraseña nueva. Los inicios de sesión normales no envían correos.

Nunca coloques una clave `service_role` en estas variables ni en el navegador.

## Aplicación móvil

La app usa el esquema profundo `mvm://`, el paquete Android `com.mvm.monitoreovidaymeta` y el bundle iOS equivalente. Requiere una compilación de desarrollo o producción para probar enlaces de correo; Expo Go no representa el esquema definitivo.

```bash
cd apps/mobile
cp .env.example .env
npm install
npm start
```

Completa `.env` con `EXPO_PUBLIC_SUPABASE_URL` y `EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. Son valores públicos protegidos por RLS; no agregues secretos administrativos.

## Crear la base de datos

1. Abre **Supabase → SQL Editor → New query**.
2. Copia y ejecuta completo `supabase/migrations/20260809180000_initial_schema.sql`.
3. Verifica que el resultado indique **Success** antes de conectar la interfaz.
4. Ejecuta después `supabase/migrations/20260810120000_configurable_credit_card.sql` para habilitar la línea bancaria, el límite personal y el día mensual de pago.

Las migraciones crean perfiles, periodos, categorías, tarjeta, movimientos, pagos recurrentes y alertas. También activan RLS, crean políticas basadas en `auth.uid()` y evitan crear una tarjeta ficticia para usuarios que no declararon tenerla.

## Fórmula del límite diario

```text
saldo_real = ingreso_principal_confirmado + ingresos_extra - gastos
disponible_sin_afectar_meta_ideal = max(0, saldo_real - meta_ideal_del_periodo)
límite_personal_disponible_tarjeta = max(0, límite_personal - deuda_de_tarjeta)
```

El pago de tarjeta reduce la deuda, pero no vuelve a contabilizar como gasto una compra que ya fue registrada.
