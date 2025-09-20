import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Download, TrendingUp } from 'lucide-react';
import { AppointmentTrend } from '@/hooks/useAppointmentAnalytics';

interface AppointmentTrendsChartProps {
  data: AppointmentTrend[];
  onExport: () => void;
}

export const AppointmentTrendsChart: React.FC<AppointmentTrendsChartProps> = ({
  data,
  onExport
}) => {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Appointment Trends Over Time
          </CardTitle>
          <Button variant="outline" size="sm" onClick={onExport}>
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
              <XAxis 
                dataKey="date" 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="scheduled" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                name="Scheduled"
                dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="completed" 
                stroke="#10b981" 
                strokeWidth={2}
                name="Completed"
                dot={{ fill: '#10b981', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="cancelled" 
                stroke="#f59e0b" 
                strokeWidth={2}
                name="Cancelled"
                dot={{ fill: '#f59e0b', strokeWidth: 2 }}
              />
              <Line 
                type="monotone" 
                dataKey="noShow" 
                stroke="#ef4444" 
                strokeWidth={2}
                name="No Show"
                dot={{ fill: '#ef4444', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-border">
          <div className="text-center">
            <div className="text-lg font-semibold text-primary">
              {data.reduce((sum, d) => sum + d.scheduled, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Scheduled</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {data.reduce((sum, d) => sum + d.completed, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Completed</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-yellow-600">
              {data.reduce((sum, d) => sum + d.cancelled, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total Cancelled</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {data.reduce((sum, d) => sum + d.noShow, 0)}
            </div>
            <div className="text-xs text-muted-foreground">Total No Shows</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};