import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';

interface Transaction {
  type: string;
  amount: number;
  category: string;
  date: string;
}

interface FinanceChartsProps {
  transactions: Transaction[];
  months: { month: string; income: number; expenses: number }[];
}

const CATEGORY_COLORS: Record<string, string> = {
  Food: '#f59e0b',
  Rent: '#ef4444',
  Transport: '#3b82f6',
  Health: '#10b981',
  Insurance: '#8b5cf6',
  Utilities: '#06b6d4',
  Shopping: '#ec4899',
  Entertainment: '#f97316',
  Salary: '#22c55e',
  Transfer: '#94a3b8',
  Other: '#64748b',
};

export function FinanceCharts({ transactions, months }: FinanceChartsProps) {
  const categoryData = Object.entries(
    transactions
      .filter(t => t.type === 'expense')
      .reduce<Record<string, number>>((acc, t) => {
        acc[t.category] = (acc[t.category] ?? 0) + Number(t.amount);
        return acc;
      }, {}),
  )
    .map(([name, value]) => ({ name, value: Math.round(value * 100) / 100 }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8);

  const totalExpenses = categoryData.reduce((s, d) => s + d.value, 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Donut chart — category breakdown */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-4">Expenses by Category</h3>
        {categoryData.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No expense data</p>
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0">
              <ResponsiveContainer width={160} height={160}>
                <PieChart>
                  <Pie data={categoryData} cx="50%" cy="50%"
                    innerRadius={45} outerRadius={75}
                    paddingAngle={2} dataKey="value">
                    {categoryData.map(entry => (
                      <Cell key={entry.name}
                        fill={CATEGORY_COLORS[entry.name] ?? '#64748b'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: number) => [`€${v.toFixed(2)}`, '']}
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                    }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-1.5 min-w-0">
              {categoryData.map(d => (
                <div key={d.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <div className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ background: CATEGORY_COLORS[d.name] ?? '#64748b' }} />
                    <span className="text-muted-foreground truncate">{d.name}</span>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0 ml-2">
                    <span className="text-foreground font-medium">€{d.value.toFixed(0)}</span>
                    <span className="text-muted-foreground w-8 text-right">
                      {totalExpenses > 0 ? ((d.value / totalExpenses) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Bar chart — income vs expenses last 6 months */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="text-sm font-medium mb-4">Income vs Expenses (6 months)</h3>
        {months.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No data available</p>
        ) : (
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={months} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                tickFormatter={(v: number) => `€${v}`} />
              <Tooltip
                formatter={(v: number, name: string) => [`€${v.toFixed(2)}`, name]}
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Bar dataKey="income" name="Income" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
