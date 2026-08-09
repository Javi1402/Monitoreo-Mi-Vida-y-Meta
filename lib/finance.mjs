export function calculateFinance({ salary, minimumGoal, idealGoal, nextPayDate, movements, openingCardDebt = 0, today = new Date() }) {
  const confirmedSalary = Number(salary) || 0;
  const extras = movements.filter((item) => item.type === "extra").reduce((sum, item) => sum + item.amount, 0);
  const expenses = movements.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const cardPurchases = movements.filter((item) => item.type === "expense" && item.method === "Tarjeta de crédito").reduce((sum, item) => sum + item.amount, 0);
  const cardPayments = movements.filter((item) => item.type === "card_payment").reduce((sum, item) => sum + item.amount, 0);
  const balance = confirmedSalary + extras - expenses;
  const projectedSaving = Math.max(0, balance);
  const spendableIdeal = Math.max(0, balance - idealGoal);
  const target = nextPayDate ? new Date(`${nextPayDate}T12:00:00`) : null;
  const remainingDays = target && !Number.isNaN(target.getTime())
    ? Math.max(1, Math.ceil((target - today) / 86400000))
    : null;
  const dailyLimit = remainingDays ? spendableIdeal / remainingDays : null;
  const cardDebt = Math.max(0, Number(openingCardDebt) + cardPurchases - cardPayments);
  const cardAvailable = Math.max(0, 500 - cardDebt);
  const status = projectedSaving >= idealGoal ? "green" : projectedSaving >= minimumGoal ? "yellow" : "red";

  const hasActivePeriod = confirmedSalary > 0;

  return { extras, expenses, balance, projectedSaving, spendableIdeal, remainingDays, dailyLimit, cardDebt, cardAvailable, status, hasActivePeriod };
}
