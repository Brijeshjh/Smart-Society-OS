'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/dashboard/dashboard-layout';
import { OverviewCards } from '@/components/dashboard/overview-cards';
import { HelpdeskSection } from '@/components/dashboard/helpdesk-section';
import { FinanceSection } from '@/components/dashboard/finance-section';
import { SecuritySection } from '@/components/dashboard/security-section';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutGrid, TicketIcon, BarChart3, Shield } from 'lucide-react';

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <DashboardLayout activeSection={activeTab} onSectionChange={setActiveTab}>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Smart Society OS</h1>
          <p className="text-muted-foreground mt-1">Resident Welfare Association Management Dashboard</p>
        </div>

        {/* Overview Cards - Always visible */}
        {activeTab === 'overview' && <OverviewCards />}

        {/* Tabs for different sections */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 mb-6">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Overview</span>
            </TabsTrigger>
            <TabsTrigger value="helpdesk" className="flex items-center gap-2">
              <TicketIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Helpdesk</span>
            </TabsTrigger>
            <TabsTrigger value="finance" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              <span className="hidden sm:inline">Finance</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <HelpdeskSection />
          </TabsContent>

          <TabsContent value="helpdesk" className="space-y-6">
            <HelpdeskSection />
          </TabsContent>

          <TabsContent value="finance" className="space-y-6">
            <FinanceSection />
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <SecuritySection />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
