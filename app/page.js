"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { calculateFinance } from "../lib/finance.mjs";
import { createClient } from "../lib/supabase/client";

const money = new Intl.NumberFormat("es-PE", {
  style: "currency",
  currency: "PEN",
  minimumFractionDigits: 2,
});

const defaultCategories = [
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

const paymentMethodToDatabase = { "Efectivo": "cash", "Yape": "yape", "Plin": "plin", "Cuenta bancaria": "bank_account", "Tarjeta de crédito": "credit_card" };
const paymentMethodFromDatabase = Object.fromEntries(Object.entries(paymentMethodToDatabase).map(([label, value]) => [value, label]));

function movementFromDatabase(item) {
  return { id: item.id, type: item.type === "extra_income" ? "extra" : item.type, amount: Number(item.amount), category: item.categories?.name || "", method: paymentMethodFromDatabase[item.payment_method] || "", date: item.transaction_date, description: item.description || "" };
}

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
  const router = useRouter();
  const [theme, setTheme] = useState("dark");
  const [tab, setTab] = useState("home");
  const [salary, setSalary] = useState("");
  const [minimumGoal, setMinimumGoal] = useState(300);
  const [idealGoal, setIdealGoal] = useState(500);
  const [nextPayDate, setNextPayDate] = useState("");
  const [movements, setMovements] = useState(initialMovements);
  const [userId, setUserId] = useState(null);
  const [activePeriodId, setActivePeriodId] = useState(null);
  const [categoryRecords, setCategoryRecords] = useState([]);
  const [card, setCard] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [dataError, setDataError] = useState("");
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ type: "expense", amount: "", category: "", method: "", date: todayInPeru(), description: "" });
  const categories = categoryRecords.length ? categoryRecords.map((item) => item.name) : defaultCategories;
  const finance = useMemo(() => calculateFinance({ salary, minimumGoal, idealGoal, nextPayDate, movements, openingCardDebt: card?.opening_debt || 0 }), [salary, minimumGoal, idealGoal, nextPayDate, movements, card]);

  useEffect(() => {
    async function loadUserData() {
      const supabase = createClient();
      if (!supabase) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setUserId(user.id);

      const [categoriesResult, periodResult, cardResult] = await Promise.all([
        supabase.from("categories").select("id,name,color,icon").eq("is_active", true).order("name"),
        supabase.from("financial_periods").select("*").eq("status", "open").maybeSingle(),
        supabase.from("credit_cards").select("*").eq("is_active", true).maybeSingle(),
      ]);
      const firstError = categoriesResult.error || periodResult.error || cardResult.error;
      if (firstError) {
        setDataError("No pudimos recuperar tus datos de Supabase. Recarga la página.");
        setDataLoading(false);
        return;
      }
      setCategoryRecords(categoriesResult.data || []);
      setCard(cardResult.data || null);

      if (periodResult.data) {
        const period = periodResult.data;
        setActivePeriodId(period.id);
        setSalary(String(period.opening_income));
        setMinimumGoal(Number(period.minimum_saving_goal));
        setIdealGoal(Number(period.ideal_saving_goal));
        setNextPayDate(period.expected_next_pay_date || "");
        const { data, error } = await supabase.from("transactions").select("*, categories(name)").eq("period_id", period.id).order("transaction_date", { ascending: false }).order("created_at", { ascending: false });
        if (error) setDataError("Encontramos tu periodo, pero no pudimos cargar sus movimientos.");
        else setMovements((data || []).map(movementFromDatabase));
      }
      setDataLoading(false);
    }
    loadUserData();
  }, []);

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  async function savePlanning(event) {
    event.preventDefault();
    setDataError("");
    const confirmedSalary = Number(salary);
    if (!userId || !Number.isFinite(confirmedSalary) || confirmedSalary <= 0) {
      setDataError("Ingresa el monto real recibido antes de iniciar el periodo.");
      return;
    }
    if (idealGoal < minimumGoal) {
      setDataError("La meta ideal no puede ser menor que la meta mínima.");
      return;
    }
    const supabase = createClient();
    const values = { user_id: userId, opening_income: confirmedSalary, minimum_saving_goal: minimumGoal, ideal_saving_goal: idealGoal, expected_next_pay_date: nextPayDate || null };
    setSaving(true);
    const result = activePeriodId
      ? await supabase.from("financial_periods").update(values).eq("id", activePeriodId).select().single()
      : await supabase.from("financial_periods").insert({ ...values, start_date: todayInPeru() }).select().single();
    setSaving(false);
    if (result.error) {
      setDataError("No pudimos guardar el periodo en Supabase. Revisa los valores.");
      return;
    }
    setActivePeriodId(result.data.id);
    await supabase.from("profiles").update({ usual_salary: confirmedSalary, minimum_saving_goal: minimumGoal, ideal_saving_goal: idealGoal }).eq("id", userId);
    setNotice(activePeriodId ? "Planificación actualizada y guardada." : "Tu primer periodo fue creado y guardado.");
    setTab("home");
  }

  async function saveMovement(event) {
    event.preventDefault();
    setNotice("");
    if (!activePeriodId || !userId) {
      setNotice("Configura primero el ingreso de tu periodo.");
      return;
    }
    const amount = Number(form.amount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setNotice("Ingresa un monto mayor que cero.");
      return;
    }
    const selectedCategory = categoryRecords.find((item) => item.name === form.category);
    const supabase = createClient();
    setSaving(true);
    const { data, error } = await supabase.from("transactions").insert({
      user_id: userId,
      period_id: activePeriodId,
      type: form.type === "extra" ? "extra_income" : form.type,
      amount,
      category_id: form.type === "expense" ? selectedCategory?.id || null : null,
      payment_method: paymentMethodToDatabase[form.method] || null,
      transaction_date: form.date,
      description: form.description.trim() || null,
      credit_card_id: form.method === "Tarjeta de crédito" || form.type === "card_payment" ? card?.id || null : null,
    }).select("*, categories(name)").single();
    setSaving(false);
    if (error) {
      setNotice("No pudimos guardar el movimiento en Supabase. Revisa los campos.");
      return;
    }
    setMovements((current) => [movementFromDatabase(data), ...current]);
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
          <div className="header-actions"><button className="theme-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema"><Icon>{theme === "dark" ? "☾" : "☀"}</Icon>{theme === "dark" ? "Oscuro" : "Claro"}</button><button className="logout-button" onClick={signOut}>Salir</button></div>
        </header>

        {tab === "home" && <section className="screen">
          {dataLoading ? <div className="empty-dashboard"><div className="loader" aria-hidden="true" /><h1>Cargando tus datos</h1><p>Estamos recuperando tu periodo y movimientos de forma segura.</p></div> : dataError ? <div className="empty-dashboard"><h1>No pudimos cargar tus datos</h1><p>{dataError}</p><button className="primary" onClick={() => window.location.reload()}>Volver a intentar</button></div> : !activePeriodId ? <div className="empty-dashboard">
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
            <label>{form.type === "extra" ? "Cuenta donde lo recibiste" : form.type === "card_payment" ? "Cuenta desde la que pagaste" : "Medio de pago"}<select required value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value })}>
              <option value="" disabled>Selecciona una opción</option>{(form.type === "expense" ? ["Efectivo", "Yape", "Plin", "Cuenta bancaria", "Tarjeta de crédito"] : ["Yape", "Plin", "Cuenta bancaria"]).map((method) => <option key={method}>{method}</option>)}
            </select></label>
            <label>Fecha<input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} /></label>
            <label>{form.type === "extra" ? "Origen o descripción" : "Descripción opcional"}<input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={form.type === "extra" ? "Ej. trabajo adicional" : "Ej. almuerzo"} /></label>
            {form.type === "card_payment" && <p className="info">Este pago reducirá la deuda, pero no se registrará nuevamente como gasto.</p>}
            {notice && <p className="notice" role="status">{notice}</p>}
            <button className="primary" type="submit" disabled={saving}>{saving ? "Guardando…" : "Guardar movimiento"}</button>
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
          {activePeriodId ? <article className="traffic"><div><strong>Proyección: {money.format(finance.projectedSaving)}</strong><p>{statusCopy[1]}</p></div><div className={`ring ${finance.status}`}>{Math.round(Math.min(100, finance.projectedSaving / Math.max(1, idealGoal) * 100))}%</div></article> : <div className="empty-state compact"><p>Configura primero el ingreso del periodo para calcular el semáforo.</p></div>}
        </section>}

        {tab === "card" && <section className="screen">
          <div className="section-title"><h1>Tarjeta de crédito</h1>{finance.cardDebt > 0 && <span className={`badge ${finance.cardDebt > 350 ? "red" : "green"}`}>{finance.cardDebt > 350 ? "Superó S/350" : "Uso controlado"}</span>}</div>
          <article className="credit-card"><span>Cupo fijo</span><strong>{money.format(500)}</strong><div><p>Consumo actual<b>{money.format(finance.cardDebt)}</b></p><p>Cupo disponible<b>{money.format(finance.cardAvailable)}</b></p></div><div className="progress"><span style={{width: `${Math.min(100, finance.cardDebt / 5)}%`}} /></div><small>Recomendación: conservar entre S/200 y S/300 de cupo disponible.</small></article>
          <div className="summary-grid"><article className="summary-card"><span>Fecha de cierre</span><strong>Sin registrar</strong><small>Se configurará cada mes</small></article><article className="summary-card"><span>Fecha de pago</span><strong>Sin registrar</strong><small>Se configurará cada mes</small></article></div>
          <button className="primary" onClick={() => { setForm({...form,type:"card_payment"}); setTab("register"); }}>Registrar pago de tarjeta</button>
        </section>}

        {tab === "more" && <section className="screen">
          <h1>Planificación del periodo</h1><p className="lead">Ajusta estos valores cada vez que inicies un nuevo periodo. No son montos fijos.</p>
          <form className="settings" onSubmit={savePlanning}>
            <label>Ingreso principal del periodo<input type="number" min="0" step="0.01" value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="Ingresa el monto recibido" /></label>
            <label>Meta mínima de ahorro<input type="number" min="0" step="0.01" value={minimumGoal} onChange={(e) => setMinimumGoal(Number(e.target.value))} /></label>
            <label>Meta ideal de ahorro<input type="number" min={minimumGoal} step="0.01" value={idealGoal} onChange={(e) => setIdealGoal(Math.max(minimumGoal, Number(e.target.value)))} /></label>
            <label>Próximo pago estimado<input type="date" value={nextPayDate} onChange={(e) => setNextPayDate(e.target.value)} /></label>
            {dataError && <p className="form-error" role="alert">{dataError}</p>}
            <button className="primary" type="submit" disabled={saving}>{saving ? "Guardando…" : activePeriodId ? "Guardar cambios" : "Guardar e iniciar periodo"}</button>
          </form>
          <p className="info">El límite diario se recalcula con tu ingreso confirmado, ingresos extra, gastos registrados, meta ideal y días restantes.</p>
        </section>}

        <nav aria-label="Navegación principal">
          {[['home','⌂','Inicio'],['register','⊕','Registrar'],['history','☷','Historial'],['metrics','▥','Métricas'],['more','⋯','Más']].map(([value,icon,label]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}><Icon>{icon}</Icon><span>{label}</span></button>)}
        </nav>
      </div>
    </main>
  );
}
