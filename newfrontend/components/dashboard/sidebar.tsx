'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { LayoutDashboard, HelpCircle, DollarSign, Lock, Home } from 'lucide-react';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  id: string;
}

interface SidebarProps {
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function Sidebar({ activeSection = 'overview', onSectionChange }: SidebarProps) {
  const navItems: NavItem[] = [
    { label: 'Dashboard Overview', icon: <LayoutDashboard className="w-5 h-5" />, id: 'overview' },
    { label: 'Helpdesk (AI Triage)', icon: <HelpCircle className="w-5 h-5" />, id: 'helpdesk' },
    { label: 'Finance & Audits', icon: <DollarSign className="w-5 h-5" />, id: 'finance' },
    { label: 'Security Guard', icon: <Lock className="w-5 h-5" />, id: 'security' },
  ];

  const handleNavClick = (itemId: string) => {
    onSectionChange?.(itemId);
  };

  return (
    <aside className="w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen sticky top-0">
      {/* Logo Section */}
      <div className="p-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center flex-shrink-0">
            <Home className="w-6 h-6 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <h2 className="font-bold text-lg text-sidebar-foreground truncate">Smart Society OS</h2>
            <p className="text-xs text-muted-foreground">RWA Management</p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 px-4 py-6 space-y-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200',
              'font-medium text-sm text-left',
              activeSection === item.id
                ? 'bg-primary text-primary-foreground shadow-md'
                : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
            )}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-sidebar-border p-4">
        <div className="text-xs text-muted-foreground text-center">
          <p>© 2024 Smart Society OS</p>
          <p className="mt-1">v1.0.0</p>
        </div>
      </div>
    </aside>
  );
}
