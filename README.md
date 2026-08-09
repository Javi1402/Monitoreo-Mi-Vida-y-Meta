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
- La interfaz financiera está protegida por autenticación con código de correo de Supabase.
- Sin las variables públicas de Supabase, el acceso permanece bloqueado y muestra una explicación de configuración pendiente.
- Esta versión todavía no persiste movimientos en Supabase y no está publicada.

## Configurar autenticación

1. Copia `.env.example` como `.env.local`.
2. Completa `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` con los valores públicos del proyecto.
3. En Supabase Auth habilita el proveedor Email y configura la plantilla para incluir el token de verificación.

Nunca coloques una clave `service_role` en estas variables ni en el navegador.

## Fórmula del límite diario

```text
saldo_real = ingreso_principal_confirmado + ingresos_extra - gastos
disponible_sin_afectar_meta_ideal = max(0, saldo_real - meta_ideal_del_periodo)
límite_diario = disponible_sin_afectar_meta_ideal / días_hasta_próximo_pago_estimado
```

El pago de tarjeta reduce la deuda, pero no vuelve a contabilizar como gasto una compra que ya fue registrada.
