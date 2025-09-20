import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Download, 
  RefreshCw,
  Clock,
  CheckCircle,
  XCircle,
  UserX
} from 'lucide-react';
import { useAppointmentAnalytics } from '@/hooks/useAppointmentAnalytics';
import { AnalyticsMetricCard } from './AnalyticsMetricCard';
import { AppointmentTrendsChart } from './AppointmentTrendsChart';
import { ResourceUtilizationChart } from './ResourceUtilizationChart';
import { ProviderPerformanceTable } from './ProviderPerformanceTable';
import { CriticalAlertsPanel } from './CriticalAlertsPanel';
import { format, subDays } from 'date-fns';

export const AppointmentAnalyticsDashboard: React.FC = () => {
  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
  }>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [selectedProvider, setSelectedProvider] = useState<string>('all');
  const [selectedService, setSelectedService] = useState<string>('all');
  const [selectedResource, setSelectedResource] = useState<string>('all');

  const {
    metrics,
    resourceUtilization,
    appointmentTrends,
    providerMetrics,
    criticalAlerts,
    loading,
    exportData,
    refetch
  } = useAppointmentAnalytics(
    dateRange.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
    dateRange.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
    selectedProvider !== 'all' ? selectedProvider : undefined,
    selectedService !== 'all' ? selectedService : undefined,
    selectedResource !== 'all' ? selectedResource : undefined
  );

  const handleExport = (dataType: 'metrics' | 'utilization' | 'trends' | 'providers') => {
    exportData('csv', dataType);
  };

  const getMetricIcon = (type: string) => {
    switch (type) {
      case 'total': return Calendar;
      case 'completed': return CheckCircle;
      case 'cancelled': return XCircle;
      case 'noShow': return UserX;
      case 'leadTime': return Clock;
      default: return TrendingUp;
    }
  };

  const getMetricColor = (type: string, value: number) => {
    switch (type) {
      case 'completionRate':
        return value >= 80 ? 'text-green-600' : value >= 60 ? 'text-yellow-600' : 'text-red-600';
      case 'noShowRate':
      case 'cancellationRate':
        return value <= 10 ? 'text-green-600' : value <= 20 ? 'text-yellow-600' : 'text-red-600';
      case 'followUpSuccessRate':
        return value >= 70 ? 'text-green-600' : value >= 50 ? 'text-yellow-600' : 'text-red-600';
      default:
        return 'text-foreground';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin" />
            <span className="text-lg">Loading analytics...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Appointment Analytics</h1>
          <p className="text-muted-foreground">
            Insights into appointment trends, resource utilization, and clinic performance
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={refetch} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => handleExport('metrics')}>
            <Download className="h-4 w-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Filters & Date Range
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Date Range</label>
              <DatePickerWithRange 
                date={{ from: dateRange.from, to: dateRange.to }}
                onDateChange={(range) => {
                  if (range?.from && range?.to) {
                    setDateRange({ from: range.from, to: range.to });
                  }
                }}
              />
            </div>
            
            <div>
              <label className="text-sm font-medium mb-2 block">Provider</label>
              <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                <SelectTrigger>
                  <SelectValue placeholder="All Providers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Providers</SelectItem>
                  {providerMetrics.map(provider => (
                    <SelectItem key={provider.providerId} value={provider.providerId}>
                      {provider.providerName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Service Type</label>
              <Select value={selectedService} onValueChange={setSelectedService}>
                <SelectTrigger>
                  <SelectValue placeholder="All Services" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Services</SelectItem>
                  <SelectItem value="consultation">Consultation</SelectItem>
                  <SelectItem value="procedure">Procedure</SelectItem>
                  <SelectItem value="follow_up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Resource</label>
              <Select value={selectedResource} onValueChange={setSelectedResource}>
                <SelectTrigger>
                  <SelectValue placeholder="All Resources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Resources</SelectItem>
                  {resourceUtilization.map(resource => (
                    <SelectItem key={resource.resourceId} value={resource.resourceId}>
                      {resource.resourceName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts */}
      {criticalAlerts.length > 0 && (
        <CriticalAlertsPanel alerts={criticalAlerts} className="mb-8" />
      )}

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <AnalyticsMetricCard
            title="Total Appointments"
            value={metrics.totalAppointments}
            icon={getMetricIcon('total')}
            trend={{ value: 12, isPositive: true }}
            className="border-blue-200 bg-blue-50"
          />
          
          <AnalyticsMetricCard
            title="Completion Rate"
            value={`${metrics.completionRate.toFixed(1)}%`}
            icon={getMetricIcon('completed')}
            trend={{ value: 5, isPositive: true }}
            className={`border-green-200 ${getMetricColor('completionRate', metrics.completionRate)}`}
          />
          
          <AnalyticsMetricCard
            title="No-Show Rate"
            value={`${metrics.noShowRate.toFixed(1)}%`}
            icon={getMetricIcon('noShow')}
            trend={{ value: 2, isPositive: false }}
            className={`border-red-200 ${getMetricColor('noShowRate', metrics.noShowRate)}`}
          />
          
          <AnalyticsMetricCard
            title="Avg Lead Time"
            value={`${Math.round(metrics.averageLeadTime)} days`}
            icon={getMetricIcon('leadTime')}
            trend={{ value: 1, isPositive: false }}
            className="border-purple-200 bg-purple-50"
          />
        </div>
      )}

      {/* Analytics Tabs */}
      <Tabs defaultValue="trends" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="trends">Appointment Trends</TabsTrigger>
          <TabsTrigger value="utilization">Resource Utilization</TabsTrigger>
          <TabsTrigger value="providers">Provider Performance</TabsTrigger>
          <TabsTrigger value="insights">Advanced Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="trends">
          <AppointmentTrendsChart 
            data={appointmentTrends}
            onExport={() => handleExport('trends')}
          />
        </TabsContent>

        <TabsContent value="utilization">
          <ResourceUtilizationChart 
            data={resourceUtilization}
            onExport={() => handleExport('utilization')}
          />
        </TabsContent>

        <TabsContent value="providers">
          <ProviderPerformanceTable 
            data={providerMetrics}
            onExport={() => handleExport('providers')}
          />
        </TabsContent>

        <TabsContent value="insights">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Follow-up Success Rate */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5" />
                  Follow-up Success Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <div className={`text-4xl font-bold mb-2 ${getMetricColor('followUpSuccessRate', metrics?.followUpSuccessRate || 0)}`}>
                    {metrics?.followUpSuccessRate.toFixed(1)}%
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Patients completing recommended follow-up appointments
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Booking Patterns */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Booking Patterns
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm">Peak booking days:</span>
                    <Badge variant="secondary">Mon, Tue, Wed</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Peak booking hours:</span>
                    <Badge variant="secondary">9 AM - 11 AM</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm">Average advance booking:</span>
                    <Badge variant="outline">{Math.round(metrics?.averageLeadTime || 0)} days</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};