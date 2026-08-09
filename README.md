# Monitoreo mi Vida y Meta (MVM)

Primera interfaz funcional para validar la experiencia móvil y las reglas financieras de MVM.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Abre `http://localhost:3000`.

## Estado actual

- La aplicación inicia sin sueldo, movimientos, deuda ni fechas precargadas.
- Los datos solo viven en el estado temporal del navegador y se reinician al recargar.
- La interfaz financiera está protegida por autenticación mediante enlace de acceso por correo de Supabase.
- Sin las variables públicas de Supabase, el acceso permanece bloqueado y muestra una explicación de configuración pendiente.
- El despliegue piloto está publicado en Vercel, pero todavía no persiste movimientos en Supabase.

## Configurar autenticación

1. Copia `.env.example` como `.env.local`.
2. Completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con los valores públicos del proyecto.
3. En Supabase Auth habilita el proveedor Email y autoriza las URLs `/auth/confirm` y `/auth/recover` del despliegue.

El acceso habitual utiliza correo y contraseña. Supabase solo envía correos para confirmar una cuenta nueva o crear/recuperar una contraseña; `/auth/confirm` intercambia esos enlaces por una sesión segura.

Si Supabase devuelve excepcionalmente el parámetro `?code=` a la página principal, el middleware lo reenvía al callback de confirmación o recuperación correspondiente y limpia la URL al finalizar la autenticación.

Durante una recuperación, una cookie temporal y no sensible permite distinguir ese enlace de un acceso normal y redirigirlo a `/account/password`. La cookie vence en una hora y se elimina al procesar el enlace.

Nunca coloques una clave `service_role` en estas variables ni en el navegador.

## Crear la base de datos

1. Abre **Supabase → SQL Editor → New query**.
2. Copia y ejecuta completo `supabase/migrations/20260809180000_initial_schema.sql`.
3. Verifica que el resultado indique **Success** antes de conectar la interfaz.

La migración crea perfiles, periodos, categorías, tarjeta, movimientos, pagos recurrentes y alertas. También activa RLS en todas las tablas personales, crea políticas basadas en `auth.uid()` e inicializa tanto usuarios nuevos como usuarios existentes.

La interfaz guarda y recupera el periodo abierto y sus movimientos desde Supabase. No crea periodos ni movimientos ficticios: el primer periodo comienza únicamente cuando el usuario confirma su ingreso y pulsa **Guardar e iniciar periodo**.

## Fórmula del límite diario

```text
saldo_real = ingreso_principal_confirmado + ingresos_extra - gastos
disponible_sin_afectar_meta_ideal = max(0, saldo_real - meta_ideal_del_periodo)
límite_diario = disponible_sin_afectar_meta_ideal / días_hasta_próximo_pago_estimado
```

El pago de tarjeta reduce la deuda, pero no vuelve a contabilizar como gasto una compra que ya fue registrada.
