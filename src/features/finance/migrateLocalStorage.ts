import { budgetLimitsDbService } from './budgetLimitsDbService';
import { savingsGoalsDbService } from './savingsGoalsDbService';
import { recurringTransactionsDbService } from './recurringTransactionsDbService';

const MIGRATED_KEY = 'dailyflow:localStorage-migrated-v1';

export async function migrateLocalStorageToDb(): Promise<void> {
  if (localStorage.getItem(MIGRATED_KEY)) return;

  try {
    const rawLimits = localStorage.getItem('dailyflow:budget-limits');
    if (rawLimits) {
      const limits = JSON.parse(rawLimits) as { category: string; limit: number }[];
      for (const l of limits) {
        await budgetLimitsDbService.upsert(l.category, l.limit);
      }
    }

    const rawGoals = localStorage.getItem('dailyflow:savings-goals');
    if (rawGoals) {
      const goals = JSON.parse(rawGoals) as {
        name: string; target: number; saved: number; color: string; deadline?: string;
      }[];
      for (const g of goals) {
        await savingsGoalsDbService.create({
          name: g.name,
          targetAmount: g.target,
          savedAmount: g.saved,
          color: g.color,
          deadline: g.deadline,
        });
      }
    }

    const rawRecurring = localStorage.getItem('dailyflow:recurring-transactions');
    if (rawRecurring) {
      const items = JSON.parse(rawRecurring) as {
        title: string; amount: number; type: 'income' | 'expense';
        category: string; dayOfMonth: number; lastApplied?: string;
      }[];
      for (const item of items) {
        const created = await recurringTransactionsDbService.create({
          title: item.title,
          amount: item.amount,
          type: item.type,
          category: item.category,
          dayOfMonth: item.dayOfMonth,
        });
        if (item.lastApplied) {
          await recurringTransactionsDbService.updateLastApplied(created.id, item.lastApplied);
        }
      }
    }

    localStorage.setItem(MIGRATED_KEY, 'true');
    localStorage.removeItem('dailyflow:budget-limits');
    localStorage.removeItem('dailyflow:savings-goals');
    localStorage.removeItem('dailyflow:recurring-transactions');

    console.log('[Migration] localStorage → DB complete');
  } catch (err) {
    console.error('[Migration] Failed (will retry on next load):', err);
  }
}
