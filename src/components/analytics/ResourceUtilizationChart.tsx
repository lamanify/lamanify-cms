import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import { Download, Server, AlertTriangle, CheckCircle } from 'lucide-react';
import { ResourceUtilization } from '@/hooks/useAppointmentAnalytics';

interface ResourceUtilizationChartProps {
  data: ResourceUtilization[];
  onExport: () => void;
}

export const ResourceUtilizationChart: React.FC<ResourceUtilizationChartProps> = ({
  data,
  onExport
}) => {
  const getUtilizationColor = (rate: number) => {
    if (rate >= 80) return '#ef4444'; // Red - over-utilized
    if (rate >= 60) return '#10b981'; // Green - well-utilized
    if (rate >= 40) return '#f59e0b'; // Yellow - under-utilized
    return '#ef4444'; // Red - severely under-utilized
  };

  const getUtilizationStatus = (rate: number) => {
    if (rate >= 80) return { status: 'Over-utilized', icon: AlertTriangle, color: 'destructive' };
    if (rate >= 60) return { status: 'Optimal', icon: CheckCircle, color: 'default' };
    if (rate >= 40) return { status: 'Under-utilized', icon: AlertTriangle, color: 'secondary' };
    return { status: 'Critical', icon: AlertTriangle, color: 'destructive' };
  };

  return (
    <div className="space-y-6">
      {/* Utilization Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              Resource Utilization Rates
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
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" />
                <XAxis 
                  dataKey="resourceName" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                  label={{ value: 'Utilization %', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px'
                  }}
                  formatter={(value: number) => [`${value.toFixed(1)}%`, 'Utilization Rate']}
                />
                <Bar 
                  dataKey="utilizationRate" 
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Resource Details Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Resource Details & Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {data.map((resource, index) => {
              const status = getUtilizationStatus(resource.utilizationRate);
              const StatusIcon = status.icon;
              
              return (
                <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-muted rounded-lg">
                      <Server className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <h4 className="font-medium">{resource.resourceName}</h4>
                      <p className="text-sm text-muted-foreground">
                        {resource.resourceType} • {resource.totalAppointments} appointments
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-medium">
                        {resource.totalBookedHours.toFixed(1)}h / {resource.availableHours.toFixed(1)}h
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {resource.utilizationRate.toFixed(1)}% utilized
                      </div>
                    </div>
                    <Badge variant={status.color as any} className="flex items-center gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {status.status}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
          
          {/* Utilization Guidelines */}
          <div className="mt-6 p-4 bg-muted/50 rounded-lg">
            <h4 className="font-medium mb-3">Utilization Guidelines</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded"></div>
                <span>60-80%: Optimal utilization</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                <span>40-60%: Under-utilized</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded"></div>
                <span>80%+: Over-utilized (risk of delays)</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-600 rounded"></div>
                <span>&lt;40%: Critical under-utilization</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};