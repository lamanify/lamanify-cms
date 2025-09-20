import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, Users, Clock, Star } from 'lucide-react';
import { ProviderMetrics } from '@/hooks/useAppointmentAnalytics';

interface ProviderPerformanceTableProps {
  data: ProviderMetrics[];
  onExport: () => void;
}

export const ProviderPerformanceTable: React.FC<ProviderPerformanceTableProps> = ({
  data,
  onExport
}) => {
  const getPerformanceBadge = (completionRate: number) => {
    if (completionRate >= 90) return { variant: 'default', label: 'Excellent' };
    if (completionRate >= 80) return { variant: 'secondary', label: 'Good' };
    if (completionRate >= 70) return { variant: 'outline', label: 'Average' };
    return { variant: 'destructive', label: 'Needs Improvement' };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Provider Performance
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Provider</TableHead>
              <TableHead className="text-center">Total Appointments</TableHead>
              <TableHead className="text-center">Completed</TableHead>
              <TableHead className="text-center">Completion Rate</TableHead>
              <TableHead className="text-center">Avg Duration</TableHead>
              <TableHead className="text-center">Performance</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((provider, index) => {
              const completionRate = provider.totalAppointments > 0 
                ? (provider.completedAppointments / provider.totalAppointments) * 100 
                : 0;
              const performance = getPerformanceBadge(completionRate);
              
              return (
                <TableRow key={index}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-muted rounded-lg">
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{provider.providerName}</div>
                        <div className="text-xs text-muted-foreground">ID: {provider.providerId.slice(0, 8)}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium">{provider.totalAppointments}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium text-green-600">{provider.completedAppointments}</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="font-medium">{completionRate.toFixed(1)}%</div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span>{Math.round(provider.averageDuration)}m</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={performance.variant as any}>
                      {performance.label}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        {/* Summary Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">
              {data.reduce((sum, p) => sum + p.totalAppointments, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Appointments</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {data.reduce((sum, p) => sum + p.completedAppointments, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold">
              {data.length > 0 
                ? (data.reduce((sum, p) => sum + p.averageDuration, 0) / data.length).toFixed(0) 
                : 0}m
            </div>
            <div className="text-xs text-muted-foreground">Avg Duration</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};