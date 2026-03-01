'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, AlertTriangle, Users } from 'lucide-react';

interface KPICard {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ReactNode;
  trend?: {
    direction: 'up' | 'down';
    value: number;
  };
  status?: 'normal' | 'warning' | 'critical';
}

export function OverviewCards() {
  const cards: KPICard[] = [
    {
      title: 'Active Complaints',
      value: '24',
      subtitle: '8 Open · 16 Pending',
      icon: <AlertTriangle className="w-6 h-6 text-primary" />,
      trend: { direction: 'up', value: 12 },
      status: 'warning',
    },
    {
      title: 'Monthly Expense vs Budget',
      value: '₹2,45,000',
      subtitle: '82% of budget used',
      icon: <TrendingUp className="w-6 h-6 text-primary" />,
      trend: { direction: 'down', value: 5 },
      status: 'normal',
    },
    {
      title: 'Active Visitors',
      value: '12',
      subtitle: 'on premises now',
      icon: <Users className="w-6 h-6 text-primary" />,
      trend: { direction: 'up', value: 8 },
      status: 'normal',
    },
    {
      title: 'Critical AI Alerts',
      value: '3',
      subtitle: 'Requires attention',
      icon: <AlertTriangle className="w-6 h-6 text-destructive" />,
      trend: { direction: 'up', value: 2 },
      status: 'critical',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((card, index) => (
        <Card
          key={index}
          className={`border-2 ${
            card.status === 'critical'
              ? 'border-destructive bg-red-50 dark:bg-red-950/20'
              : card.status === 'warning'
              ? 'border-yellow-400/30 bg-amber-50 dark:bg-amber-950/20'
              : 'border-border'
          }`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {card.title}
              </CardTitle>
              {card.icon}
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-2xl font-bold text-foreground">{card.value}</p>
              {card.trend && (
                <div className={`flex items-center gap-1 text-xs font-semibold ${
                  card.trend.direction === 'up' ? 'text-destructive' : 'text-green-600'
                }`}>
                  {card.trend.direction === 'up' ? (
                    <TrendingUp className="w-3 h-3" />
                  ) : (
                    <TrendingDown className="w-3 h-3" />
                  )}
                  {card.trend.value}%
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{card.subtitle}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
