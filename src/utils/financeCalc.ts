import { Transaction, Budget, Category } from '../types/database';

/**
 * Calculates sum of income and expenses for a given transactions list.
 */
export const calculateMonthlyBalance = (transactions: Transaction[]) => {
  let income = 0;
  let expense = 0;

  transactions.forEach((tx) => {
    if (tx.type === 'income') {
      income += Number(tx.amount);
    } else if (tx.type === 'expense') {
      expense += Number(tx.amount);
    }
  });

  return {
    income,
    expense,
    balance: income - expense,
  };
};

/**
 * Summarizes expenses grouped by category.
 */
export interface CategoryTotal {
  categoryId: string;
  categoryName: string;
  color: string;
  icon: string;
  total: number;
  percentage: number;
}

export const calculateCategoryTotals = (
  transactions: Transaction[],
  categories: Category[]
): CategoryTotal[] => {
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + Number(t.amount), 0);

  if (totalExpense === 0) return [];

  // Group by category_id
  const categoryMap: Record<string, number> = {};
  expenseTransactions.forEach((tx) => {
    if (tx.category_id) {
      categoryMap[tx.category_id] = (categoryMap[tx.category_id] || 0) + Number(tx.amount);
    }
  });

  const list: CategoryTotal[] = [];
  categories.forEach((cat) => {
    const total = categoryMap[cat.id] || 0;
    if (total > 0) {
      list.push({
        categoryId: cat.id,
        categoryName: cat.name,
        color: cat.color || '#64748B',
        icon: cat.icon || 'folder',
        total,
        percentage: Number(((total / totalExpense) * 100).toFixed(1)),
      });
    }
  });

  // Sort descending by total
  return list.sort((a, b) => b.total - a.total);
};

/**
 * Budget usage per category.
 */
export interface BudgetStatus {
  budgetId?: string;
  categoryId: string;
  categoryName: string;
  color: string;
  limitAmount: number;
  spentAmount: number;
  percentage: number;
  isOverBudget: boolean;
  remainingAmount: number;
}

export const calculateBudgetStatus = (
  transactions: Transaction[],
  budgets: Budget[],
  categories: Category[]
): BudgetStatus[] => {
  // Only interested in current month transactions
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');

  // Sum by category
  const spentMap: Record<string, number> = {};
  expenseTransactions.forEach((tx) => {
    if (tx.category_id) {
      spentMap[tx.category_id] = (spentMap[tx.category_id] || 0) + Number(tx.amount);
    }
  });

  return budgets.map((b) => {
    const cat = categories.find((c) => c.id === b.category_id);
    const spentAmount = spentMap[b.category_id] || 0;
    const limitAmount = Number(b.amount);
    const percentage = limitAmount > 0 ? Number(((spentAmount / limitAmount) * 100).toFixed(1)) : 0;

    return {
      budgetId: b.id,
      categoryId: b.category_id,
      categoryName: cat?.name || 'Kategori',
      color: cat?.color || '#3B82F6',
      limitAmount,
      spentAmount,
      percentage,
      isOverBudget: spentAmount > limitAmount,
      remainingAmount: Math.max(0, limitAmount - spentAmount),
    };
  });
};

/**
 * Calculates average daily spend for the month.
 */
export const calculateDailyAverage = (transactions: Transaction[], monthStr: string) => {
  const expenseTransactions = transactions.filter((t) => t.type === 'expense');
  const totalExpense = expenseTransactions.reduce((acc, t) => acc + Number(t.amount), 0);

  // Get total days in month
  const date = new Date(`${monthStr}-01`);
  const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

  // Get current day of month if we are in this month, else total days
  const today = new Date();
  const currentMonthStr = today.toISOString().substring(0, 7);
  
  let daysElapsed = daysInMonth;
  if (monthStr === currentMonthStr) {
    daysElapsed = today.getDate();
  }

  return totalExpense / (daysElapsed || 1);
};

/**
 * Calculates remaining days until payday.
 */
export const getDaysUntilPayday = (salaryDay: number): number => {
  if (!salaryDay || salaryDay < 1 || salaryDay > 31) return 0;
  
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth(); // 0-indexed
  const currentDate = today.getDate();

  let targetDate = new Date(currentYear, currentMonth, salaryDay);
  if (currentDate > salaryDay) {
    // Payday already passed this month, target is next month
    targetDate = new Date(currentYear, currentMonth + 1, salaryDay);
  }

  const diffTime = Math.abs(targetDate.getTime() - today.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

/**
 * Calculates remaining days until due date.
 */
export const getDaysUntilDueDate = (dueDay: number): number => {
  return getDaysUntilPayday(dueDay); // Logic is identical
};
