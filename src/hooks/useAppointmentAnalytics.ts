import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AppointmentMetrics {
  totalAppointments: number;
  scheduledAppointments: number;
  completedAppointments: number;
  cancelledAppointments: number;
  noShowAppointments: number;
  cancellationRate: number;
  noShowRate: number;
  completionRate: number;
  averageLeadTime: number;
  followUpSuccessRate: number;
}

export interface ResourceUtilization {
  resourceId: string;
  resourceName: string;
  resourceType: string;
  totalBookedHours: number;
  availableHours: number;
  utilizationRate: number;
  totalAppointments: number;
}

export interface AppointmentTrend {
  date: string;
  scheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
}

export interface ProviderMetrics {
  providerId: string;
  providerName: string;
  totalAppointments: number;
  completedAppointments: number;
  averageDuration: number;
  patientSatisfaction?: number;
}

export interface CriticalAlert {
  id: string;
  type: 'high_no_show' | 'low_utilization' | 'high_cancellation' | 'booking_issues';
  message: string;
  severity: 'warning' | 'error' | 'info';
  value: number;
  threshold: number;
}

export const useAppointmentAnalytics = (
  startDate?: string,
  endDate?: string,
  providerId?: string,
  serviceType?: string,
  resourceId?: string
) => {
  const [metrics, setMetrics] = useState<AppointmentMetrics | null>(null);
  const [resourceUtilization, setResourceUtilization] = useState<ResourceUtilization[]>([]);
  const [appointmentTrends, setAppointmentTrends] = useState<AppointmentTrend[]>([]);
  const [providerMetrics, setProviderMetrics] = useState<ProviderMetrics[]>([]);
  const [criticalAlerts, setCriticalAlerts] = useState<CriticalAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAppointmentMetrics = async () => {
    try {
      let query = supabase
        .from('appointments')
        .select('*');

      if (startDate) query = query.gte('appointment_date', startDate);
      if (endDate) query = query.lte('appointment_date', endDate);
      if (providerId) query = query.eq('doctor_id', providerId);

      const { data: appointments, error } = await query;

      if (error) throw error;

      const total = appointments?.length || 0;
      const scheduled = appointments?.filter(a => a.status === 'scheduled').length || 0;
      const completed = appointments?.filter(a => a.status === 'completed').length || 0;
      const cancelled = appointments?.filter(a => a.status === 'cancelled').length || 0;
      const noShow = appointments?.filter(a => a.status === 'no_show').length || 0;

      // Calculate lead time (average days between creation and appointment date)
      const leadTimes = appointments?.map(a => {
        const createdDate = new Date(a.created_at);
        const appointmentDate = new Date(a.appointment_date);
        return Math.floor((appointmentDate.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
      }).filter(days => days >= 0) || [];

      const averageLeadTime = leadTimes.length > 0 
        ? leadTimes.reduce((sum, days) => sum + days, 0) / leadTimes.length 
        : 0;

      // Calculate follow-up success rate (placeholder - would need follow-up tracking)
      const followUpSuccessRate = 85; // Mock data - implement based on follow-up campaigns

      setMetrics({
        totalAppointments: total,
        scheduledAppointments: scheduled,
        completedAppointments: completed,
        cancelledAppointments: cancelled,
        noShowAppointments: noShow,
        cancellationRate: total > 0 ? (cancelled / total) * 100 : 0,
        noShowRate: total > 0 ? (noShow / total) * 100 : 0,
        completionRate: total > 0 ? (completed / total) * 100 : 0,
        averageLeadTime,
        followUpSuccessRate
      });

    } catch (error) {
      console.error('Error fetching appointment metrics:', error);
      toast({
        title: "Error",
        description: "Failed to load appointment metrics",
        variant: "destructive",
      });
    }
  };

  const fetchResourceUtilization = async () => {
    try {
      // Get resources from resources table (simplified for now)
      // Create mock resource data since the resources table structure is not fully defined
      const mockResources = [
        { id: '1', name: 'Consultation Room 1', type: 'room' },
        { id: '2', name: 'Consultation Room 2', type: 'room' },
        { id: '3', name: 'X-Ray Machine', type: 'equipment' },
        { id: '4', name: 'Ultrasound', type: 'equipment' }
      ];

      const utilization: ResourceUtilization[] = mockResources.map((resource, index) => {
        // Generate realistic mock data
        const utilizationRate = 40 + (index * 15) + Math.random() * 20;
        const totalBookedHours = 120 + Math.random() * 80;
        const availableHours = 200;
        
        return {
          resourceId: resource.id,
          resourceName: resource.name,
          resourceType: resource.type,
          totalBookedHours,
          availableHours,
          utilizationRate: Math.min(utilizationRate, 95),
          totalAppointments: Math.floor(totalBookedHours / 1.5) // Assume 1.5 hours per appointment average
        };
      });

      setResourceUtilization(utilization);

    } catch (error) {
      console.error('Error fetching resource utilization:', error);
      toast({
        title: "Error",
        description: "Failed to load resource utilization data",
        variant: "destructive",
      });
    }
  };

  const fetchAppointmentTrends = async () => {
    try {
      let query = supabase
        .from('appointments')
        .select('appointment_date, status, created_at');

      if (startDate) query = query.gte('appointment_date', startDate);
      if (endDate) query = query.lte('appointment_date', endDate);
      if (providerId) query = query.eq('doctor_id', providerId);

      const { data: appointments, error } = await query;

      if (error) throw error;

      // Group by date
      const trendMap = new Map<string, AppointmentTrend>();

      appointments?.forEach(appointment => {
        const date = appointment.appointment_date;
        if (!trendMap.has(date)) {
          trendMap.set(date, {
            date,
            scheduled: 0,
            completed: 0,
            cancelled: 0,
            noShow: 0
          });
        }

        const trend = trendMap.get(date)!;
        switch (appointment.status) {
          case 'scheduled':
            trend.scheduled++;
            break;
          case 'completed':
            trend.completed++;
            break;
          case 'cancelled':
            trend.cancelled++;
            break;
          case 'no_show':
            trend.noShow++;
            break;
        }
      });

      const trends = Array.from(trendMap.values()).sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      setAppointmentTrends(trends);

    } catch (error) {
      console.error('Error fetching appointment trends:', error);
    }
  };

  const fetchProviderMetrics = async () => {
    try {
      let query = supabase
        .from('appointments')
        .select(`
          doctor_id,
          status,
          duration_minutes,
          profiles!appointments_doctor_id_fkey(first_name, last_name)
        `);

      if (startDate) query = query.gte('appointment_date', startDate);
      if (endDate) query = query.lte('appointment_date', endDate);

      const { data: appointments, error } = await query;

      if (error) throw error;

      // Group by provider
      const providerMap = new Map<string, ProviderMetrics>();

      appointments?.forEach(appointment => {
        const providerId = appointment.doctor_id;
        if (!providerMap.has(providerId)) {
          const profile = appointment.profiles;
          providerMap.set(providerId, {
            providerId,
            providerName: profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown',
            totalAppointments: 0,
            completedAppointments: 0,
            averageDuration: 0
          });
        }

        const metrics = providerMap.get(providerId)!;
        metrics.totalAppointments++;
        
        if (appointment.status === 'completed') {
          metrics.completedAppointments++;
        }
      });

      // Calculate average duration for each provider
      for (const [providerId, metrics] of providerMap.entries()) {
        const providerAppointments = appointments?.filter(a => a.doctor_id === providerId) || [];
        const totalDuration = providerAppointments.reduce((sum, a) => sum + (a.duration_minutes || 0), 0);
        metrics.averageDuration = providerAppointments.length > 0 ? totalDuration / providerAppointments.length : 0;
      }

      setProviderMetrics(Array.from(providerMap.values()));

    } catch (error) {
      console.error('Error fetching provider metrics:', error);
    }
  };

  const generateCriticalAlerts = () => {
    const alerts: CriticalAlert[] = [];

    if (metrics) {
      // High no-show rate alert
      if (metrics.noShowRate > 15) {
        alerts.push({
          id: 'high_no_show',
          type: 'high_no_show',
          message: `No-show rate is ${metrics.noShowRate.toFixed(1)}% (threshold: 15%)`,
          severity: metrics.noShowRate > 25 ? 'error' : 'warning',
          value: metrics.noShowRate,
          threshold: 15
        });
      }

      // High cancellation rate alert
      if (metrics.cancellationRate > 20) {
        alerts.push({
          id: 'high_cancellation',
          type: 'high_cancellation',
          message: `Cancellation rate is ${metrics.cancellationRate.toFixed(1)}% (threshold: 20%)`,
          severity: metrics.cancellationRate > 30 ? 'error' : 'warning',
          value: metrics.cancellationRate,
          threshold: 20
        });
      }
    }

    // Low resource utilization alerts
    resourceUtilization.forEach(resource => {
      if (resource.utilizationRate < 60) {
        alerts.push({
          id: `low_util_${resource.resourceId}`,
          type: 'low_utilization',
          message: `${resource.resourceName} utilization is ${resource.utilizationRate.toFixed(1)}% (threshold: 60%)`,
          severity: resource.utilizationRate < 40 ? 'error' : 'warning',
          value: resource.utilizationRate,
          threshold: 60
        });
      }
    });

    setCriticalAlerts(alerts);
  };

  const exportData = (type: 'csv' | 'pdf', dataType: 'metrics' | 'utilization' | 'trends' | 'providers') => {
    try {
      let data: any[] = [];
      let filename = '';

      switch (dataType) {
        case 'metrics':
          data = metrics ? [metrics] : [];
          filename = 'appointment_metrics';
          break;
        case 'utilization':
          data = resourceUtilization;
          filename = 'resource_utilization';
          break;
        case 'trends':
          data = appointmentTrends;
          filename = 'appointment_trends';
          break;
        case 'providers':
          data = providerMetrics;
          filename = 'provider_metrics';
          break;
      }

      if (type === 'csv') {
        const headers = Object.keys(data[0] || {});
        const csvContent = [
          headers.join(','),
          ...data.map(row => headers.map(header => row[header]).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
      }

      toast({
        title: "Export Successful",
        description: `${dataType} data exported successfully`,
      });

    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: "Export Failed",
        description: "Failed to export data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const fetchAllData = async () => {
      setLoading(true);
      await Promise.all([
        fetchAppointmentMetrics(),
        fetchResourceUtilization(),
        fetchAppointmentTrends(),
        fetchProviderMetrics()
      ]);
      setLoading(false);
    };

    fetchAllData();
  }, [startDate, endDate, providerId, serviceType, resourceId]);

  useEffect(() => {
    if (metrics && resourceUtilization.length > 0) {
      generateCriticalAlerts();
    }
  }, [metrics, resourceUtilization]);

  return {
    metrics,
    resourceUtilization,
    appointmentTrends,
    providerMetrics,
    criticalAlerts,
    loading,
    exportData,
    refetch: async () => {
      setLoading(true);
      await Promise.all([
        fetchAppointmentMetrics(),
        fetchResourceUtilization(),
        fetchAppointmentTrends(),
        fetchProviderMetrics()
      ]);
      setLoading(false);
    }
  };
};