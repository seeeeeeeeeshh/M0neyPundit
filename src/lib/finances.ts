// Financial data utilities using localStorage

export interface Expense {
  id: string;
  name: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
  notes?: string;
}

export type ExpenseCategory = 'food' | 'transport' | 'study' | 'entertainment' | 'personal' | 'other';

export interface Budget {
  monthlyBudget: number;
  expenses: Expense[];
}

const STORAGE_KEY = 'm0ney_pundit_budget';

const CATEGORY_COLORS: Record<ExpenseCategory, string> = {
  food: '#F59E0B',
  transport: '#3B82F6',
  study: '#8B5CF6',
  entertainment: '#EC4899',
  personal: '#10B981',
  other: '#6B7280',
};

const CATEGORY_ICONS: Record<ExpenseCategory, string> = {
  food: '🍜',
  transport: '🚌',
  study: '📚',
  entertainment: '🎮',
  personal: '💅',
  other: '📦',
};

export function getBudget(): Budget {
  if (typeof window === 'undefined') {
    return { monthlyBudget: 400, expenses: [] };
  }
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load budget:', e);
  }
  // Default
  return { monthlyBudget: 400, expenses: [] };
}

export function saveBudget(budget: Budget): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(budget));
  } catch (e) {
    console.error('Failed to save budget:', e);
  }
}

export function setMonthlyBudget(amount: number): void {
  const budget = getBudget();
  budget.monthlyBudget = amount;
  saveBudget(budget);
}

export function addExpense(expense: Omit<Expense, 'id'>): void {
  const budget = getBudget();
  budget.expenses.push({ ...expense, id: Date.now().toString() });
  saveBudget(budget);
}

export function updateExpense(id: string, updates: Partial<Expense>): void {
  const budget = getBudget();
  budget.expenses = budget.expenses.map(e => e.id === id ? { ...e, ...updates } : e);
  saveBudget(budget);
}

export function deleteExpense(id: string): void {
  const budget = getBudget();
  budget.expenses = budget.expenses.filter(e => e.id !== id);
  saveBudget(budget);
}

export function getTotalExpenses(): number {
  const budget = getBudget();
  return budget.expenses.reduce((sum, e) => sum + e.amount, 0);
}

export function getRemainingBudget(): number {
  const budget = getBudget();
  return budget.monthlyBudget - getTotalExpenses();
}

export function getExpensesByCategory(): Record<ExpenseCategory, number> {
  const budget = getBudget();
  const result = {} as Record<ExpenseCategory, number>;
  for (const cat of Object.keys(CATEGORY_COLORS) as ExpenseCategory[]) {
    result[cat] = 0;
  }
  budget.expenses.forEach(e => {
    result[e.category] = (result[e.category] || 0) + e.amount;
  });
  return result;
}

export function getExpensesByDay(): Record<string, number> {
  const budget = getBudget();
  const result: Record<string, number> = {};
  budget.expenses.forEach(e => {
    result[e.date] = (result[e.date] || 0) + e.amount;
  });
  return result;
}

export function getExpensesByWeekDay(): { day: string; amount: number }[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const byDay = getExpensesByDay();
  const result: { day: string; amount: number }[] = Array(7).fill(0).map((_, i) => ({ day: days[i], amount: 0 }));
  
  Object.keys(byDay).forEach(dateStr => {
    const date = new Date(dateStr);
    const amount = byDay[dateStr];
    if (amount > 0) {
      result[date.getDay()].amount += amount;
    }
  });
  
  return result;
}

export function getLast7DaysData(): { label: string; amount: number }[] {
  const byDay = getExpensesByDay();
  const result = [];
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    const label = date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    result.push({ label, amount: byDay[dateStr] || 0 });
  }
  return result;
}

export function getLast4WeeksData(): { label: string; amount: number }[] {
  const byDay = getExpensesByDay();
  const result = [];
  for (let i = 3; i >= 0; i--) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (i * 7));
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 7);
    
    const weekLabel = startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    let weekTotal = 0;
    
    const current = new Date(startDate);
    while (current < endDate) {
      const dateStr = current.toISOString().split('T')[0];
      weekTotal += byDay[dateStr] || 0;
      current.setDate(current.getDate() + 1);
    }
    
    result.push({ label: weekLabel, amount: weekTotal });
  }
  return result;
}

// Sample data for demo purposes
export function loadSampleData(): void {
  const today = new Date();
  const expenses: Expense[] = [
    { id: '1', name: 'Chicken Rice', amount: 3.50, category: 'food', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6).toISOString().split('T')[0] },
    { id: '2', name: 'Bus Fare', amount: 1.50, category: 'transport', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 6).toISOString().split('T')[0] },
    { id: '3', name: 'Netflix Subscription', amount: 12.99, category: 'entertainment', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 5).toISOString().split('T')[0] },
    { id: '4', name: 'Grab Taxi', amount: 8.50, category: 'transport', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4).toISOString().split('T')[0] },
    { id: '5', name: 'McDonalds', amount: 6.90, category: 'food', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4).toISOString().split('T')[0] },
    { id: '6', name: 'Textbook (PDF)', amount: 15.00, category: 'study', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 3).toISOString().split('T')[0] },
    { id: '7', name: 'Bubble Tea', amount: 5.50, category: 'food', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString().split('T')[0] },
    { id: '8', name: 'Movie Tickets', amount: 14.00, category: 'entertainment', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2).toISOString().split('T')[0] },
    { id: '9', name: 'Laundry', amount: 5.00, category: 'personal', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString().split('T')[0] },
    { id: '10', name: 'Shopee Purchase', amount: 22.50, category: 'other', date: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1).toISOString().split('T')[0] },
    { id: '11', name: 'Food Delivery', amount: 18.90, category: 'food', date: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0] },
    { id: '12', name: 'Metro Fare', amount: 2.20, category: 'transport', date: new Date(today.getFullYear(), today.getMonth(), today.getDate()).toISOString().split('T')[0] },
  ];
  
  saveBudget({ monthlyBudget: 400, expenses });
}

export function getCategoryInfo(category: ExpenseCategory) {
  return {
    color: CATEGORY_COLORS[category],
    icon: CATEGORY_ICONS[category],
  };
}