'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Zap, AlertTriangle } from 'lucide-react';

interface ComplaintCard {
  id: string;
  flatNumber: string;
  category: string;
  description: string;
  severity: 'emergency' | 'medium' | 'low';
  timestamp: string;
}

export function HelpdeskSection() {
  const openComplaints: ComplaintCard[] = [
    {
      id: '1',
      flatNumber: 'B-402',
      category: 'Plumbing',
      description: 'Water pipe burst - urgent repair needed',
      severity: 'emergency',
      timestamp: '2 hours ago',
    },
    {
      id: '2',
      flatNumber: 'C-105',
      category: 'Electrical',
      description: 'Power tripping in master bedroom',
      severity: 'medium',
      timestamp: '4 hours ago',
    },
  ];

  const pendingComplaints: ComplaintCard[] = [
    {
      id: '3',
      flatNumber: 'A-301',
      category: 'Maintenance',
      description: 'Door handle broken in common area',
      severity: 'medium',
      timestamp: '1 day ago',
    },
    {
      id: '4',
      flatNumber: 'B-205',
      category: 'Plumbing',
      description: 'Slow water drainage in bathroom',
      severity: 'low',
      timestamp: '1 day ago',
    },
    {
      id: '5',
      flatNumber: 'D-404',
      category: 'Cleaning',
      description: 'Common staircase needs cleaning',
      severity: 'low',
      timestamp: '2 days ago',
    },
  ];

  const resolvedComplaints: ComplaintCard[] = [
    {
      id: '6',
      flatNumber: 'A-102',
      category: 'Electrical',
      description: 'Corridor light fixture replaced',
      severity: 'low',
      timestamp: '3 days ago',
    },
    {
      id: '7',
      flatNumber: 'C-303',
      category: 'Maintenance',
      description: 'Lift elevator maintenance completed',
      severity: 'medium',
      timestamp: '5 days ago',
    },
  ];

  const SeverityBadge = ({ severity }: { severity: 'emergency' | 'medium' | 'low' }) => {
    const styles = {
      emergency: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      low: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    };

    const labels = {
      emergency: 'Emergency',
      medium: 'Medium',
      low: 'Low',
    };

    return (
      <Badge variant="secondary" className={`${styles[severity]} border-0`}>
        {labels[severity]}
      </Badge>
    );
  };

  const ComplaintCardComponent = ({ complaint }: { complaint: ComplaintCard }) => (
    <Card className="border border-border hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="font-semibold text-foreground text-sm">{complaint.flatNumber}</p>
            <p className="text-xs text-muted-foreground">{complaint.timestamp}</p>
          </div>
          <SeverityBadge severity={complaint.severity} />
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {complaint.category}
          </p>
          <p className="text-sm text-foreground leading-snug">{complaint.description}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Helpdesk Agent - AI Triage</h2>
        <p className="text-sm text-muted-foreground mt-1">3-column Kanban board for complaint management</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <h3 className="font-bold text-foreground">Open</h3>
            <span className="text-xs bg-destructive/10 text-destructive px-2 py-1 rounded font-semibold">
              {openComplaints.length}
            </span>
          </div>
          <div className="space-y-3">
            {openComplaints.map((complaint) => (
              <ComplaintCardComponent key={complaint.id} complaint={complaint} />
            ))}
          </div>
        </div>

        {/* Pending Technician Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-500" />
            <h3 className="font-bold text-foreground">Pending Technician</h3>
            <span className="text-xs bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 px-2 py-1 rounded font-semibold">
              {pendingComplaints.length}
            </span>
          </div>
          <div className="space-y-3">
            {pendingComplaints.map((complaint) => (
              <ComplaintCardComponent key={complaint.id} complaint={complaint} />
            ))}
          </div>
        </div>

        {/* Resolved Column */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-green-600" />
            <h3 className="font-bold text-foreground">Resolved</h3>
            <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded font-semibold">
              {resolvedComplaints.length}
            </span>
          </div>
          <div className="space-y-3">
            {resolvedComplaints.map((complaint) => (
              <ComplaintCardComponent key={complaint.id} complaint={complaint} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
