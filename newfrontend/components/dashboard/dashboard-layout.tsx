import { Sidebar } from './sidebar';
import { Header } from './header';

interface DashboardLayoutProps {
  children: React.ReactNode;
  activeSection?: string;
  onSectionChange?: (section: string) => void;
}

export function DashboardLayout({ 
  children, 
  activeSection = 'overview',
  onSectionChange 
}: DashboardLayoutProps) {
  return (
    <div className="flex h-screen bg-background dark:bg-background">
      {/* Sidebar */}
      <Sidebar activeSection={activeSection} onSectionChange={onSectionChange} />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Content Area */}
        <main className="flex-1 overflow-auto">
          <div className="p-6 md:p-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
