export function calculateFinance({ salary, minimumGoal, idealGoal, nextPayDate, movements, today = new Date() }) {
  const extras = movements.filter((item) => item.type === "extra").reduce((sum, item) => sum + item.amount, 0);
  const expenses = movements.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const cardPurchases = movements.filter((item) => item.type === "expense" && item.method === "Tarjeta de crédito").reduce((sum, item) => sum + item.amount, 0);
  const cardPayments = movements.filter((item) => item.type === "card_payment").reduce((sum, item) => sum + item.amount, 0);
  const balance = salary + extras - expenses;
  const projectedSaving = Math.max(0, balance);
  const spendableIdeal = Math.max(0, balance - idealGoal);
  const target = new Date(`${nextPayDate}T12:00:00`);
  const remainingDays = Math.max(1, Math.ceil((target - today) / 86400000));
  const dailyLimit = spendableIdeal / remainingDays;
  const cardDebt = Math.max(0, cardPurchases - cardPayments);
  const cardAvailable = Math.max(0, 500 - cardDebt);
  const status = projectedSaving >= idealGoal ? "green" : projectedSaving >= minimumGoal ? "yellow" : "red";

  return { extras, expenses, balance, projectedSaving, spendableIdeal, remainingDays, dailyLimit, cardDebt, cardAvailable, status };
}
