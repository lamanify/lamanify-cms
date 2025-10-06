import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useSubscriptionGuard } from '@/hooks/useSubscriptionGuard';
import { PastDueBanner } from '@/components/PastDueBanner';
import { DashboardTopBar } from '@/components/dashboard/DashboardTopBar';
import { SummaryCards } from '@/components/dashboard/SummaryCards';
import { PatientStatisticsChart } from '@/components/dashboard/PatientStatisticsChart';
import { CalendarWidget } from '@/components/dashboard/CalendarWidget';
import { UpcomingAppointments } from '@/components/dashboard/UpcomingAppointments';
import { TaskManagementTable } from '@/components/dashboard/TaskManagementTable';

interface DashboardStats {
  totalPatients: number;
  totalDiagnoses: number;
  appointmentsScheduled: number;
  overallVisitors: number;
}

export default function Dashboard() {
  const { user, loading } = useAuth();
  const { tenant, isInGracePeriod, isSuperAdmin } = useSubscriptionGuard();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <DashboardContent tenant={tenant} isInGracePeriod={isInGracePeriod} isSuperAdmin={isSuperAdmin} />;
}

function DashboardContent({ 
  tenant, 
  isInGracePeriod, 
  isSuperAdmin 
}: { 
  tenant: any; 
  isInGracePeriod: boolean;
  isSuperAdmin: boolean;
}) {
  const { profile } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 1500,
    totalDiagnoses: 900,
    appointmentsScheduled: 350,
    overallVisitors: 5603
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch total patients
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      setStats(prevStats => ({
        ...prevStats,
        totalPatients: patientsCount || 1500
      }));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <DashboardTopBar />
        <div className="flex items-center justify-center h-64">
          <div className="text-lg">Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Main Content */}
      <div className="p-8 space-y-12">
        {/* Past Due Banner - Only show for regular users in grace period */}
        {!isSuperAdmin && isInGracePeriod && tenant?.grace_period_ends_at && (
          <PastDueBanner gracePeriodEndsAt={tenant.grace_period_ends_at} />
        )}

        {/* Super Admin Indicator */}
        {isSuperAdmin && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-blue-800 font-medium text-sm">
                🔑 Super Admin Mode - Full system access enabled
              </span>
            </div>
          </div>
        )}

        {/* Welcome Message */}
        <div className="border-b border-border pb-6">
          <h1 className="text-2xl font-medium text-foreground mb-1">
            Welcome back, {profile?.first_name || 'User'}
            {isSuperAdmin && <span className="text-blue-600 ml-2">(Super Admin)</span>}
          </h1>
          <p className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { 
              weekday: 'long', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>

        {/* Summary Cards */}
        <SummaryCards 
          totalPatients={stats.totalPatients}
          totalDiagnoses={stats.totalDiagnoses}
          appointmentsScheduled={stats.appointmentsScheduled}
          overallVisitors={stats.overallVisitors}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Side - Patient Statistics Chart */}
          <div>
            <PatientStatisticsChart />
          </div>

          {/* Right Side - Calendar and Appointments */}
          <div className="space-y-12">
            <CalendarWidget />
            <UpcomingAppointments />
          </div>
        </div>

        {/* Task Management Table */}
        <div className="border-t border-border pt-12">
          <TaskManagementTable />
        </div>
      </div>
    </div>
  );
}