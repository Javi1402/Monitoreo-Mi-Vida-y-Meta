"use client";

import { useMemo, useState } from "react";
import { calculateFinance } from "../lib/finance.mjs";

const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

const categories = [
  "Alimentación",
  "Transporte",
  "Vivienda",
  "Servicios",
  "Aplicaciones y suscripciones",
  "Salud",
  "Belleza",
  "Ropa",
  "Entretenimiento",
  "Viajes",
  "Deudas",
  "Otros",
];

const initialMovements = [];

function todayInPeru() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function Icon({ children }) {
  return <span aria-hidden="true" className="icon">{children}</span>;
}

export default function Home() {
  const [theme, setTheme] = useState("dark");
  const [tab, setTab] = useState("home");
  const [salary, setSalary] = useState("");
  const [minimumGoal, setMinimumGoal] = useState(300);
  const [idealGoal, setIdealGoal] = useState(500);
  const [nextPayDate, setNextPayDate] = useState("");
  const [movements, setMovements] = useState(initialMovements);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ type: "expense", amount: "", category: "", method: "", date: todayInPeru(), description: "" });
  const finance = useMemo(() => calculateFinance({ salary, minimumGoal, idealGoal, nextPayDate, movements }), [salary, minimumGoal, idealGoal, nextPayDate, movements]);

  function saveMovement(event) {
    event.preventDefault();
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setNotice("Ingresa un monto mayor que cero.");
      return;
    }
    setMovements((current) => [{ ...form, id: Date.now(), amount }, ...current]);
    setForm((current) => ({ ...current, amount: "", description: "" }));
    setNotice(form.type === "card_payment" ? "Pago registrado: redujo la deuda sin duplicar el gasto." : "Movimiento registrado correctamente.");
  }

  const statusCopy = {
    green: ["Meta ideal protegida", "Tu proyección alcanza o supera la meta ideal."],
    yellow: ["Meta mínima protegida", `Superas el mínimo, pero faltan ${money.format(Math.max(0, idealGoal - finance.projectedSaving))} para la meta ideal.`],
    red: ["Atención al gasto", `Faltan ${money.format(Math.max(0, minimumGoal - finance.projectedSaving))} para proteger la meta mínima.`],
  }[finance.status];

  return (
    <main className={theme}>
      <div className="app-shell">
        <header>
          <div className="brand"><div className="logo">⌁</div><div><strong>MVM</strong><span>Mi Vida y Meta</span></div></div>
          <button className="theme-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema"><Icon>{theme === "dark" ? "☾" : "☀"}</Icon>{theme === "dark" ? "Oscuro" : "Claro"}</button>
        </header>

        {tab === "home" && <section className="screen">
          {!finance.hasActivePeriod ? <div className="empty-dashboard">
            <div className="empty-icon" aria-hidden="true">◎</div>
            <h1>Empieza tu primer periodo</h1>
            <p>Aún no hay ingresos ni movimientos registrados. Confirma el ingreso que recibiste para calcular tu saldo, ahorro y límite diario.</p>
            <button className="primary" onClick={() => setTab("more")}>Configurar periodo</button>
          </div> : <>
          <div className={`hero status-${finance.status}`}>
            <div className="hero-heading"><span>Puedes gastar sin afectar tu meta ideal</span><span className={`badge ${finance.status}`}>{statusCopy[0]}</span></div>
            <strong className="hero-amount">{money.format(finance.spendableIdeal)}</strong>
            <p>Saldo real: {money.format(finance.balance)}{nextPayDate ? ` · próximo pago estimado ${new Date(`${nextPayDate}T12:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}` : ""}</p>
            <div className="progress"><span style={{ width: `${Math.min(100, (finance.projectedSaving / Math.max(1, idealGoal)) * 100)}%` }} /></div>
            <div className="hero-footer"><span>Ahorro proyectado: {money.format(finance.projectedSaving)}</span><span>Meta ideal: {money.format(idealGoal)}</span></div>
          </div>

          <div className="summary-grid">
            <article className="summary-card"><span>Límite diario recomendado</span><strong>{finance.dailyLimit === null ? "Pendiente" : money.format(finance.dailyLimit)}</strong><small>{finance.remainingDays ? `Durante ${finance.remainingDays} días, sin tocar la meta ideal` : "Agrega la fecha estimada de tu próximo pago"}</small></article>
            <button className="summary-card card-link" onClick={() => setTab("card")}><span>Deuda de tarjeta</span><strong>{money.format(finance.cardDebt)}</strong><small>Cupo disponible: {money.format(finance.cardAvailable)}</small></button>
          </div>
          <button className="primary" onClick={() => setTab("register")}>＋ Registrar movimiento</button>

          <div className="section-title"><h2>Alertas</h2><span className="badge blue">{finance.cardDebt > 0 ? 2 : 1} {finance.cardDebt > 0 ? "activas" : "activa"}</span></div>
          <div className="alerts">
            {finance.cardDebt > 0 && <div><i className="dot red" /><p><strong>Pago de tarjeta pendiente</strong><span>Deuda registrada: {money.format(finance.cardDebt)}</span></p><b>›</b></div>}
            <div><i className={`dot ${finance.status}`} /><p><strong>{statusCopy[0]}</strong><span>{statusCopy[1]}</span></p><b>›</b></div>
          </div>
          </>}
        </section>}

        {tab === "register" && <section className="screen">
          <div className="section-title"><h1>Nuevo movimiento</h1><span className="badge blue">{new Date(`${form.date}T12:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}</span></div>
          <form onSubmit={saveMovement}>
            <div className="segmented" role="group" aria-label="Tipo de movimiento">
              {[['expense','Gasto'],['extra','Ingreso extra'],['card_payment','Pago tarjeta']].map(([value,label]) => <button type="button" key={value} className={form.type === value ? "active" : ""} onClick={() => setForm({ ...form, type: value })}>{label}</button>)}
            </div>
            <label>Monto<input inputMode="decimal" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} placeholder="S/ 0.00" /></label>
            {form.type === "expense" && <label>Categoría<select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}><option value="" disabled>Selecciona una categoría</option>{categories.map((category) => <option key={category}>{category}</option>)}</select></label>}
            <label>{form.type === "extra" ? "Cuenta donde lo recibiste" : form.type === "card_payment" ? "Cuenta desde la que pagaste" : "Medio de pago"}<select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="" disabled>Selecciona una opción</option>{(form.type === "expense" ? ["Efectivo", "Yape", "Plin", "Cuenta bancaria", "Tarjeta de crédito"] : ["Yape", "Plin", "Cuenta bancaria"]).map((method) => <option key={method}>{method}</option>)}
            </select></label>
            <label>Fecha<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <label>{form.type === "extra" ? "Origen o descripción" : "Descripción opcional"}<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={form.type === "extra" ? "Ej. trabajo adicional" : "Ej. almuerzo"} /></label>
            {form.type === "card_payment" && <p className="info">Este pago reducirá la deuda, pero no se registrará nuevamente como gasto.</p>}
            {notice && <p className="notice" role="status">{notice}</p>}
            <button className="primary" type="submit">Guardar movimiento</button>
          </form>
        </section>}

        {tab === "history" && <section className="screen">
          <div className="section-title"><h1>Movimientos recientes</h1><span>Periodo actual</span></div>
          {movements.length === 0 ? <div className="empty-state"><strong>Aún no hay movimientos</strong><p>Los ingresos y gastos que registres aparecerán aquí.</p><button className="secondary" onClick={() => setTab("register")}>Registrar primer movimiento</button></div> : <div className="movement-list">{movements.map((item) => <article key={item.id}><div className="movement-icon">{item.type === "extra" ? "↗" : item.type === "card_payment" ? "✓" : "↘"}</div><div><strong>{item.description || item.category}</strong><span>{new Date(`${item.date}T12:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short" })} · {item.method}</span></div><b className={item.type === "extra" ? "income" : ""}>{item.type === "extra" ? "+" : item.type === "card_payment" ? "" : "−"} {money.format(item.amount)}</b></article>)}</div>}
        </section>}

        {tab === "metrics" && <section className="screen">
          <div className="section-title"><h1>Gastos por categoría</h1>{finance.expenses > 0 && <span>{money.format(finance.expenses)} total</span>}</div>
          {finance.expenses === 0 ? <div className="empty-state"><strong>Sin datos para mostrar</strong><p>Las métricas se calcularán después de registrar tus gastos reales.</p></div> : <div className="chart">{categories.slice(0,5).map((category, index) => { const total = movements.filter((item) => item.type === "expense" && item.category === category).reduce((sum,item) => sum + item.amount,0); const height = Math.max(12, finance.expenses ? total / finance.expenses * 100 : 0); return <div key={category} title={`${category}: ${money.format(total)}`}><span className={index % 2 ? "greenbar" : "bluebar"} style={{height: `${height}%`}} /><small>{category === "Aplicaciones y suscripciones" ? "Apps" : category}</small><em>{money.format(total)}</em></div>})}</div>}
          <div className="section-title"><h2>Semáforo financiero</h2><span className={`badge ${finance.status}`}>{statusCopy[0]}</span></div>
          {finance.hasActivePeriod ? <article className="traffic"><div><strong>Proyección: {money.format(finance.projectedSaving)}</strong><p>{statusCopy[1]}</p></div><div className={`ring ${finance.status}`}>{Math.round(Math.min(100, finance.projectedSaving / Math.max(1, idealGoal) * 100))}%</div></article> : <div className="empty-state compact"><p>Configura primero el ingreso del periodo para calcular el semáforo.</p></div>}
        </section>}

        {tab === "card" && <section className="screen">
          <div className="section-title"><h1>Tarjeta de crédito</h1>{finance.cardDebt > 0 && <span className={`badge ${finance.cardDebt > 350 ? "red" : "green"}`}>{finance.cardDebt > 350 ? "Superó S/350" : "Uso controlado"}</span>}</div>
          <article className="credit-card"><span>Cupo fijo</span><strong>{money.format(500)}</strong><div><p>Consumo actual<b>{money.format(finance.cardDebt)}</b></p><p>Cupo disponible<b>{money.format(finance.cardAvailable)}</b></p></div><div className="progress"><span style={{width: `${Math.min(100, finance.cardDebt / 5)}%`}} /></div><small>Recomendación: conservar entre S/200 y S/300 de cupo disponible.</small></article>
          <div className="summary-grid"><article className="summary-card"><span>Fecha de cierre</span><strong>Sin registrar</strong><small>Se configurará cada mes</small></article><article className="summary-card"><span>Fecha de pago</span><strong>Sin registrar</strong><small>Se configurará cada mes</small></article></div>
          <button className="primary" onClick={() => { setForm({...form,type:"card_payment"}); setTab("register"); }}>Registrar pago de tarjeta</button>
        </section>}

        {tab === "more" && <section className="screen">
          <h1>Planificación del periodo</h1><p className="lead">Ajusta estos valores cada vez que inicies un nuevo periodo. No son montos fijos.</p>
          <div className="settings">
            <label>Ingreso principal del periodo<input type="number" min="0" step="0.01" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Ingresa el monto recibido" /></label>
            <label>Meta mínima de ahorro<input type="number" min="0" step="0.01" value={minimumGoal} onChange={(e) => setMinimumGoal(Number(e.target.value))} /></label>
            <label>Meta ideal de ahorro<input type="number" min={minimumGoal} step="0.01" value={idealGoal} onChange={(e) => setIdealGoal(Math.max(minimumGoal, Number(e.target.value)))} /></label>
            <label>Próximo pago estimado<input type="date" value={nextPayDate} onChange={(e) => setNextPayDate(e.target.value)} /></label>
          </div>
          <p className="info">El límite diario se recalcula con tu ingreso confirmado, ingresos extra, gastos registrados, meta ideal y días restantes.</p>
        </section>}

        <nav aria-label="Navegación principal">
          {[['home','⌂','Inicio'],['register','⊕','Registrar'],['history','☷','Historial'],['metrics','▥','Métricas'],['more','⋯','Más']].map(([value,icon,label]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}><Icon>{icon}</Icon><span>{label}</span></button>)}
        </nav>
      </div>
    </main>
  );
}
