import { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
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

  return <DashboardContent />;
}

function DashboardContent() {
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
      {/* Top Bar */}
      <DashboardTopBar />
      
      {/* Main Content */}
      <div className="p-6 space-y-8">
        {/* Welcome Message */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            Welcome back, {profile?.first_name || 'User'}
          </h1>
        </div>

        {/* Summary Cards */}
        <SummaryCards 
          totalPatients={stats.totalPatients}
          totalDiagnoses={stats.totalDiagnoses}
          appointmentsScheduled={stats.appointmentsScheduled}
          overallVisitors={stats.overallVisitors}
        />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Side - Patient Statistics Chart */}
          <div className="lg:col-span-2">
            <PatientStatisticsChart />
          </div>

          {/* Right Side - Calendar and Appointments */}
          <div className="lg:col-span-2 space-y-6">
            <CalendarWidget />
            <UpcomingAppointments />
          </div>
        </div>

        {/* Task Management Table */}
        <div className="mt-8">
          <TaskManagementTable />
        </div>
      </div>
    </div>
  );
}