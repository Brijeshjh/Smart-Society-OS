'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Clock, MapPin, CheckCircle2, AlertCircle } from 'lucide-react';

interface VisitorLog {
  id: string;
  name: string;
  flatVisiting: string;
  entryTime: string;
  duration: string;
  purpose: string;
  threat: boolean;
  threatLevel?: 'critical' | 'warning';
}

export function SecuritySection() {
  const visitorLogs: VisitorLog[] = [
    {
      id: '1',
      name: 'Raj Kumar (Carpenter)',
      flatVisiting: 'B-402',
      entryTime: 'Feb 28, 09:30 AM',
      duration: '14h 45m',
      purpose: 'Furniture repair work',
      threat: true,
      threatLevel: 'critical',
    },
    {
      id: '2',
      name: 'Priya Sharma',
      flatVisiting: 'C-105',
      entryTime: 'Feb 28, 02:15 PM',
      duration: '2h 30m',
      purpose: 'Visiting friend',
      threat: false,
    },
    {
      id: '3',
      name: 'Amit Patel (Electrician)',
      flatVisiting: 'A-301',
      entryTime: 'Feb 28, 11:00 AM',
      duration: '3h 20m',
      purpose: 'Electrical maintenance',
      threat: false,
    },
    {
      id: '4',
      name: 'Guest - Vinay Singh',
      flatVisiting: 'D-404',
      entryTime: 'Feb 28, 03:45 PM',
      duration: '45m',
      purpose: 'Social visit',
      threat: false,
    },
    {
      id: '5',
      name: 'Delivery Partner',
      flatVisiting: 'B-205',
      entryTime: 'Feb 28, 04:20 PM',
      duration: '10m',
      purpose: 'Food delivery',
      threat: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">Security Agent - Live Visitor Logs</h2>
        <p className="text-sm text-muted-foreground mt-1">Real-time visitor tracking with AI threat detection</p>
      </div>

      <Card className="border border-border">
        <CardHeader>
          <CardTitle>Live Visitor Logs</CardTitle>
          <CardDescription>Active and recent visitors with AI-powered security threat assessment</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Visitor Name</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Flat Visiting</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Entry Time</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Duration</th>
                  <th className="text-left py-3 px-4 font-semibold text-foreground">Purpose</th>
                  <th className="text-center py-3 px-4 font-semibold text-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-semibold text-foreground">Action</th>
                </tr>
              </thead>
              <tbody>
                {visitorLogs.map((visitor) => (
                  <tr
                    key={visitor.id}
                    className={`border-b border-border transition-colors ${
                      visitor.threat
                        ? 'bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100/50 dark:hover:bg-red-950/40'
                        : 'hover:bg-secondary'
                    }`}
                  >
                    <td className="py-4 px-4">
                      <div className="font-medium text-foreground">{visitor.name}</div>
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4" />
                        {visitor.flatVisiting}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{visitor.entryTime}</td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {visitor.duration}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-muted-foreground">{visitor.purpose}</td>
                    <td className="py-4 px-4 text-center">
                      {visitor.threat ? (
                        <div className="flex items-center justify-center gap-2">
                          <AlertCircle className="w-4 h-4 text-destructive" />
                          <Badge variant="destructive" className="text-xs">
                            Threat Detected
                          </Badge>
                        </div>
                      ) : (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      {visitor.threat ? (
                        <Button
                          size="sm"
                          className="text-xs bg-destructive hover:bg-destructive/90 text-white gap-1"
                        >
                          <AlertTriangle className="w-3 h-3" />
                          Dispatch Guard
                        </Button>
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

      {/* Security Alerts Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border border-border bg-blue-50/30 dark:bg-blue-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Total Visitors Today</p>
                <p className="text-3xl font-bold text-foreground mt-2">42</p>
              </div>
              <AlertCircle className="w-8 h-8 text-primary/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-border bg-yellow-50/30 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Long Duration Stay</p>
                <p className="text-3xl font-bold text-foreground mt-2">3</p>
                <p className="text-xs text-muted-foreground mt-1">Exceeding 6 hours</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-600/30" />
            </div>
          </CardContent>
        </Card>

        <Card className="border border-destructive bg-red-50/30 dark:bg-red-950/30">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground font-medium">Security Threats</p>
                <p className="text-3xl font-bold text-destructive mt-2">1</p>
                <p className="text-xs text-destructive mt-1">Active - Requires action</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive/30" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
