export function calculateFinance({ salary, minimumGoal, idealGoal, movements, creditLimit = 0, personalCardLimit = 0 }) {
  const confirmedSalary = Number(salary) || 0;
  const extras = movements.filter((item) => item.type === "extra").reduce((sum, item) => sum + item.amount, 0);
  const expenses = movements.filter((item) => item.type === "expense").reduce((sum, item) => sum + item.amount, 0);
  const cardPurchases = movements.filter((item) => item.type === "expense" && item.method === "Tarjeta de crédito").reduce((sum, item) => sum + item.amount, 0);
  const cardPayments = movements.filter((item) => item.type === "card_payment").reduce((sum, item) => sum + item.amount, 0);
  const balance = confirmedSalary + extras - expenses;
  const projectedSaving = Math.max(0, balance);
  const spendableIdeal = Math.max(0, balance - idealGoal);
  const cardDebt = Math.max(0, cardPurchases - cardPayments);
  const cardAvailable = Math.max(0, Number(creditLimit) - cardDebt);
  const personalCardAvailable = Math.max(0, Number(personalCardLimit) - cardDebt);
  const status = projectedSaving >= idealGoal ? "green" : projectedSaving >= minimumGoal ? "yellow" : "red";

  const hasActivePeriod = confirmedSalary > 0;

  return { extras, expenses, balance, projectedSaving, spendableIdeal, cardDebt, cardAvailable, personalCardAvailable, status, hasActivePeriod };
}
