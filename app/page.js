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
  const router = useRouter();
  const [theme, setTheme] = useState("dark");
  const [tab, setTab] = useState("home");
  const [salary, setSalary] = useState("");
  const [periodStart, setPeriodStart] = useState(todayInPeru());
  const [minimumGoal, setMinimumGoal] = useState(300);
  const [idealGoal, setIdealGoal] = useState(500);
  const [hasCreditCard, setHasCreditCard] = useState(false);
  const [creditLimit, setCreditLimit] = useState("");
  const [personalCardLimit, setPersonalCardLimit] = useState("");
  const [paymentDay, setPaymentDay] = useState("");
  const [periodId, setPeriodId] = useState(null);
  const [cardId, setCardId] = useState(null);
  const [setupStatus, setSetupStatus] = useState({ loading: true, saving: false, error: "", success: "" });
  const [movements, setMovements] = useState(initialMovements);
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({ type: "expense", amount: "", category: "", method: "", date: todayInPeru(), description: "" });
  const finance = useMemo(() => calculateFinance({ salary, minimumGoal, idealGoal, movements, creditLimit: hasCreditCard ? creditLimit : 0, personalCardLimit: hasCreditCard ? personalCardLimit : 0 }), [salary, minimumGoal, idealGoal, movements, hasCreditCard, creditLimit, personalCardLimit]);

  useEffect(() => {
    async function loadSetup() {
      const supabase = createClient();
      if (!supabase) return setSetupStatus((current) => ({ ...current, loading: false }));
      const [{ data: period, error: periodError }, { data: card, error: cardError }] = await Promise.all([
        supabase.from("financial_periods").select("id,start_date,opening_income,minimum_saving_goal,ideal_saving_goal").eq("status", "open").maybeSingle(),
        supabase.from("credit_cards").select("id,credit_limit,personal_spending_limit,payment_day,is_active").eq("is_active", true).maybeSingle(),
      ]);
      if (periodError || cardError) {
        setSetupStatus({ loading: false, saving: false, success: "", error: "No pudimos cargar tu planificación desde Supabase." });
        return;
      }
      if (period) {
        setPeriodId(period.id); setPeriodStart(period.start_date); setSalary(String(period.opening_income));
        setMinimumGoal(Number(period.minimum_saving_goal)); setIdealGoal(Number(period.ideal_saving_goal));
      }
      if (card) {
        setCardId(card.id); setHasCreditCard(true); setCreditLimit(String(card.credit_limit));
        setPersonalCardLimit(String(card.personal_spending_limit)); setPaymentDay(card.payment_day ? String(card.payment_day) : "");
      }
      setSetupStatus({ loading: false, saving: false, error: "", success: "" });
    }
    loadSetup();
  }, []);

  async function saveSetup(event) {
    event.preventDefault();
    const income = Number(salary); const minimum = Number(minimumGoal); const ideal = Number(idealGoal);
    const bankLimit = Number(creditLimit); const personalLimit = Number(personalCardLimit); const payDay = Number(paymentDay);
    if (!periodStart || !Number.isFinite(income) || income <= 0) return setSetupStatus((current) => ({ ...current, error: "Ingresa un monto principal mayor que cero y una fecha de inicio.", success: "" }));
    if (minimum < 0 || ideal < minimum) return setSetupStatus((current) => ({ ...current, error: "La meta ideal debe ser igual o mayor que la meta mínima.", success: "" }));
    if (hasCreditCard && (!Number.isFinite(bankLimit) || bankLimit <= 0 || !Number.isFinite(personalLimit) || personalLimit <= 0 || personalLimit > bankLimit)) return setSetupStatus((current) => ({ ...current, error: "El límite personal debe ser mayor que cero y no superar la línea total.", success: "" }));
    if (hasCreditCard && (!Number.isInteger(payDay) || payDay < 1 || payDay > 31)) return setSetupStatus((current) => ({ ...current, error: "La fecha siempre a pagar debe ser un día entre 1 y 31.", success: "" }));
    const supabase = createClient();
    if (!supabase) return;
    setSetupStatus((current) => ({ ...current, saving: true, error: "", success: "" }));
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return setSetupStatus({ loading: false, saving: false, success: "", error: "Tu sesión dejó de ser válida. Vuelve a iniciar sesión." });
    const periodValues = { user_id: user.id, start_date: periodStart, opening_income: income, minimum_saving_goal: minimum, ideal_saving_goal: ideal, expected_next_pay_date: null };
    const periodResult = periodId
      ? await supabase.from("financial_periods").update(periodValues).eq("id", periodId).select("id").single()
      : await supabase.from("financial_periods").insert(periodValues).select("id").single();
    if (periodResult.error) return setSetupStatus({ loading: false, saving: false, success: "", error: "No pudimos guardar el periodo. Revisa los valores e inténtalo nuevamente." });
    setPeriodId(periodResult.data.id);

    const { data: storedCard } = cardId ? { data: { id: cardId } } : await supabase.from("credit_cards").select("id").eq("user_id", user.id).order("created_at", { ascending: true }).limit(1).maybeSingle();
    if (hasCreditCard) {
      const cardValues = { user_id: user.id, credit_limit: bankLimit, personal_spending_limit: personalLimit, payment_day: payDay, is_active: true };
      const cardResult = storedCard
        ? await supabase.from("credit_cards").update(cardValues).eq("id", storedCard.id).select("id").single()
        : await supabase.from("credit_cards").insert(cardValues).select("id").single();
      if (cardResult.error) return setSetupStatus({ loading: false, saving: false, success: "", error: "El periodo se guardó, pero no pudimos guardar la tarjeta." });
      setCardId(cardResult.data.id);
    } else if (storedCard) {
      const { error } = await supabase.from("credit_cards").update({ is_active: false }).eq("id", storedCard.id);
      if (error) return setSetupStatus({ loading: false, saving: false, success: "", error: "El periodo se guardó, pero no pudimos desactivar la tarjeta." });
      setCardId(null);
    }
    setSetupStatus({ loading: false, saving: false, error: "", success: "Planificación guardada correctamente." });
    setTab("home");
  }

  async function signOut() {
    const supabase = createClient();
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

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
          <div className="header-actions"><button className="theme-button" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} aria-label="Cambiar tema"><Icon>{theme === "dark" ? "☾" : "☀"}</Icon>{theme === "dark" ? "Oscuro" : "Claro"}</button><button className="logout-button" onClick={signOut}>Salir</button></div>
        </header>

        {tab === "home" && <section className="screen">
          {setupStatus.loading ? <div className="empty-dashboard"><div className="empty-icon" aria-hidden="true">…</div><h1>Cargando tu planificación</h1><p>Estamos consultando tu periodo y tu tarjeta de forma segura.</p></div> : !finance.hasActivePeriod ? <div className="empty-dashboard">
            <div className="empty-icon" aria-hidden="true">◎</div>
            <h1>Empieza tu primer periodo</h1>
            <p>Aún no hay un periodo configurado. Registra tu ingreso, fecha de inicio, metas de ahorro y, si corresponde, tu tarjeta.</p>
            <button className="primary" onClick={() => setTab("more")}>Configurar periodo</button>
          </div> : <>
          <div className={`hero status-${finance.status}`}>
            <div className="hero-heading"><span>Puedes gastar sin afectar tu meta ideal</span><span className={`badge ${finance.status}`}>{statusCopy[0]}</span></div>
            <strong className="hero-amount">{money.format(finance.spendableIdeal)}</strong>
            <p>Saldo real: {money.format(finance.balance)} · periodo iniciado el {new Date(`${periodStart}T12:00:00`).toLocaleDateString("es-PE", { day: "numeric", month: "short" })}</p>
            <div className="progress"><span style={{ width: `${Math.min(100, (finance.projectedSaving / Math.max(1, idealGoal)) * 100)}%` }} /></div>
            <div className="hero-footer"><span>Ahorro proyectado: {money.format(finance.projectedSaving)}</span><span>Meta ideal: {money.format(idealGoal)}</span></div>
          </div>

          <div className="summary-grid">
            <article className="summary-card"><span>Disponible sin afectar meta</span><strong>{money.format(finance.spendableIdeal)}</strong><small>Después de proteger tu meta ideal</small></article>
            <button className="summary-card card-link" onClick={() => setTab(hasCreditCard ? "card" : "more")}><span>{hasCreditCard ? "Deuda de tarjeta" : "Tarjeta de crédito"}</span><strong>{hasCreditCard ? money.format(finance.cardDebt) : "Sin configurar"}</strong><small>{hasCreditCard ? `Disponible según tu límite: ${money.format(finance.personalCardAvailable)}` : "Puedes agregarla en planificación"}</small></button>
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

        {tab === "card" && hasCreditCard && <section className="screen">
          <div className="section-title"><h1>Tarjeta de crédito</h1>{finance.cardDebt > 0 && <span className={`badge ${finance.cardDebt > 350 ? "red" : "green"}`}>{finance.cardDebt > 350 ? "Superó S/350" : "Uso controlado"}</span>}</div>
          <article className="credit-card"><span>Línea total de crédito</span><strong>{money.format(Number(creditLimit))}</strong><div><p>Consumo actual<b>{money.format(finance.cardDebt)}</b></p><p>Cupo bancario disponible<b>{money.format(finance.cardAvailable)}</b></p></div><div className="progress"><span style={{width: `${Math.min(100, finance.cardDebt / Math.max(1, Number(personalCardLimit)) * 100)}%`}} /></div><small>Límite personal: {money.format(Number(personalCardLimit))} · disponible para gastar: {money.format(finance.personalCardAvailable)}</small></article>
          <div className="summary-grid"><article className="summary-card"><span>Fecha siempre a pagar</span><strong>Día {paymentDay}</strong><small>De cada mes</small></article><article className="summary-card"><span>Límite personal</span><strong>{money.format(Number(personalCardLimit))}</strong><small>{finance.personalCardAvailable > 0 ? `${money.format(finance.personalCardAvailable)} disponibles` : "Límite alcanzado"}</small></article></div>
          <button className="primary" onClick={() => { setForm({...form,type:"card_payment"}); setTab("register"); }}>Registrar pago de tarjeta</button>
        </section>}

        {tab === "more" && <section className="screen">
          <h1>Planificación del periodo</h1><p className="lead">Registra los valores reales de este periodo. Podrás actualizarlos cuando cambien.</p>
          <form className="settings setup-form" onSubmit={saveSetup}>
            <div className="settings-section"><span className="settings-kicker">PERIODO ACTUAL</span>
              <label>Monto principal del periodo<input type="number" min="0.01" step="0.01" required value={salary} onChange={(e) => setSalary(e.target.value)} placeholder="S/ 0.00" /></label>
              <label>Fecha de inicio del periodo<input type="date" required value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} /></label>
              <label>Meta mínima de ahorro<input type="number" min="0" step="0.01" required value={minimumGoal} onChange={(e) => setMinimumGoal(Number(e.target.value))} /></label>
              <label>Meta ideal de ahorro<input type="number" min={minimumGoal} step="0.01" required value={idealGoal} onChange={(e) => setIdealGoal(Number(e.target.value))} /></label>
            </div>
            <div className="settings-section card-settings"><span className="settings-kicker">TARJETA DE CRÉDITO</span>
              <div className="toggle-row"><div><strong>Tarjeta de crédito contratada</strong><span>Actívalo solo si actualmente tienes una.</span></div><button type="button" role="switch" aria-checked={hasCreditCard} className={`switch ${hasCreditCard ? "on" : ""}`} onClick={() => setHasCreditCard(!hasCreditCard)}><span /></button></div>
              {hasCreditCard && <div className="conditional-fields">
                <label>Línea total de crédito<input type="number" min="0.01" step="0.01" required value={creditLimit} onChange={(e) => setCreditLimit(e.target.value)} placeholder="Monto otorgado por el banco" /><small>Es el cupo total que te dio el banco.</small></label>
                <label>Límite personal de gasto<input type="number" min="0.01" max={creditLimit || undefined} step="0.01" required value={personalCardLimit} onChange={(e) => setPersonalCardLimit(e.target.value)} placeholder="Máximo que deseas utilizar" /><small>No puede superar tu línea total.</small></label>
                <label>Fecha siempre a pagar<input type="number" min="1" max="31" step="1" required value={paymentDay} onChange={(e) => setPaymentDay(e.target.value)} placeholder="Ej. 25" /><small>Indica el día de cada mes, entre 1 y 31.</small></label>
              </div>}
            </div>
            {setupStatus.error && <p className="form-error" role="alert">{setupStatus.error}</p>}{setupStatus.success && <p className="form-success" role="status">{setupStatus.success}</p>}
            <button className="primary" type="submit" disabled={setupStatus.saving}>{setupStatus.saving ? "Guardando…" : periodId ? "Guardar cambios" : "Crear periodo"}</button>
          </form>
          <p className="info">Tu disponible se calcula después de proteger la meta ideal. La tarjeta se controla contra el límite personal que elegiste.</p>
        </section>}

        <nav aria-label="Navegación principal">
          {[['home','⌂','Inicio'],['register','⊕','Registrar'],['history','☷','Historial'],['metrics','▥','Métricas'],['more','⋯','Más']].map(([value,icon,label]) => <button key={value} className={tab === value ? "active" : ""} onClick={() => setTab(value)}><Icon>{icon}</Icon><span>{label}</span></button>)}
        </nav>
      </div>
    </main>
  );
}
