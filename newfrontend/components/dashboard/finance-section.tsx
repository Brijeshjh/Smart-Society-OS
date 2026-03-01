'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, TrendingUp, CheckCircle2 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const chartData = [
  { category: 'Electricity', amount: 45000 },
  { category: 'Maintenance', amount: 62000 },
  { category: 'Staff', amount: 85000 },
  { category: 'Water', amount: 28000 },
  { category: 'Security', amount: 35000 },
];

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
  status: 'normal' | 'anomaly';
  variance?: number;
}

export function FinanceSection() {
  const recentExpenses: Expense[] = [
    {
      id: '1',
      category: 'Electricity',
      description: 'Monthly electricity bill',
      amount: 45000,
      date: 'Feb 28, 2024',
      status: 'normal',
    },
    {
      id: '2',
      category: 'Plumbing Repairs',
      description: 'Urgent pipe replacement & repairs',
      amount: 38500,
      date: 'Feb 25, 2024',
      status: 'anomaly',
      variance: 300,
    },
    {
      id: '3',
      category: 'Maintenance',
      description: 'Quarterly maintenance checkup',
      amount: 62000,
      date: 'Feb 20, 2024',
      status: 'normal',
    },
    {
      id: '4',
      category: 'Water Supply',
      description: 'Monthly water charges',
      amount: 28000,
      date: 'Feb 15, 2024',
      status: 'normal',
    },
    {
      id: '5',
      category: 'Security Services',
      description: 'CCTV maintenance & upgrades',
      amount: 35000,
      date: 'Feb 10, 2024',
      status: 'normal',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Finance Agent - Analytics & Anomalies</h2>
        <p className="text-sm text-muted-foreground mt-1">Expense tracking with AI anomaly detection</p>
      </div>

      {/* Bar Chart */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Expense Distribution by Category</CardTitle>
          <CardDescription>Monthly expenses across different categories</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="category" stroke="var(--foreground)" />
              <YAxis stroke="var(--foreground)" />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'var(--card)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                }}
                labelStyle={{ color: 'var(--foreground)' }}
              />
              <Legend />
              <Bar
                dataKey="amount"
                fill="var(--primary)"
                name="Amount (₹)"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Recent Expenses Table */}
      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Latest transactions with AI-powered anomaly detection</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Category</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Description</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Amount</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Date</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentExpenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className={`border-b border-border transition-colors ${
                      expense.status === 'anomaly'
                        ? 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/40'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <td className="py-3 px-4 font-medium text-foreground">{expense.category}</td>
                    <td className="py-3 px-4 text-muted-foreground">{expense.description}</td>
                    <td className="py-3 px-4 text-right font-semibold text-foreground">₹{expense.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-muted-foreground">{expense.date}</td>
                    <td className="py-3 px-4 text-center">
                      {expense.status === 'anomaly' ? (
                        <div className="flex items-center justify-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-destructive" />
                          <Badge variant="destructive" className="text-xs">
                            {expense.variance}% Spike
                          </Badge>
                        </div>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      {expense.status === 'anomaly' ? (
                        <div className="flex gap-2 justify-end">
                          <Button size="sm" variant="outline" className="text-xs">
                            Investigate
                          </Button>
                          <Button size="sm" className="text-xs bg-primary hover:bg-primary/90">
                            Approve
                          </Button>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
