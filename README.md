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
- Esta versión todavía no está conectada a Supabase, no tiene autenticación y no está publicada.

## Fórmula del límite diario

```text
saldo_real = ingreso_principal_confirmado + ingresos_extra - gastos
disponible_sin_afectar_meta_ideal = max(0, saldo_real - meta_ideal_del_periodo)
límite_diario = disponible_sin_afectar_meta_ideal / días_hasta_próximo_pago_estimado
```

El pago de tarjeta reduce la deuda, pero no vuelve a contabilizar como gasto una compra que ya fue registrada.
