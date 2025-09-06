import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Users, Calendar, FileText, DollarSign, Activity, TrendingUp } from 'lucide-react';

interface DashboardStats {
  totalPatients: number;
  todayAppointments: number;
  pendingBills: number;
  totalRevenue: number;
  recentAppointments: any[];
  upcomingAppointments: any[];
}

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    todayAppointments: 0,
    pendingBills: 0,
    totalRevenue: 0,
    recentAppointments: [],
    upcomingAppointments: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch total patients
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // Fetch today's appointments
      const { count: todayCount } = await supabase
        .from('appointments')
        .select('*', { count: 'exact', head: true })
        .eq('appointment_date', today);

      // Fetch pending bills
      const { count: pendingBillsCount } = await supabase
        .from('billing')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      // Fetch total revenue (paid bills)
      const { data: revenueData } = await supabase
        .from('billing')
        .select('amount')
        .eq('status', 'paid');

      const totalRevenue = revenueData?.reduce((sum, bill) => sum + Number(bill.amount), 0) || 0;

      // Fetch recent appointments (last 5)
      const { data: recentAppts } = await supabase
        .from('appointments')
        .select(`
          id, appointment_date, appointment_time, status, reason,
          patients (first_name, last_name),
          profiles!appointments_doctor_id_fkey (first_name, last_name)
        `)
        .order('created_at', { ascending: false })
        .limit(5);

      // Fetch upcoming appointments (next 5)
      const { data: upcomingAppts } = await supabase
        .from('appointments')
        .select(`
          id, appointment_date, appointment_time, status, reason,
          patients (first_name, last_name),
          profiles!appointments_doctor_id_fkey (first_name, last_name)
        `)
        .gte('appointment_date', today)
        .order('appointment_date', { ascending: true })
        .order('appointment_time', { ascending: true })
        .limit(5);

      setStats({
        totalPatients: patientsCount || 0,
        todayAppointments: todayCount || 0,
        pendingBills: pendingBillsCount || 0,
        totalRevenue,
        recentAppointments: recentAppts || [],
        upcomingAppointments: upcomingAppts || []
      });
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: 'outline',
      confirmed: 'default',
      completed: 'secondary',
      cancelled: 'destructive',
      in_progress: 'default'
    };
    return variants[status] || 'outline';
  };

  if (loading) {
    return <div>Loading dashboard...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Overview of clinic operations</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              Registered in the system
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Appointments</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              Scheduled for today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Bills</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingBills}</div>
            <p className="text-xs text-muted-foreground">
              Awaiting payment
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">
              From paid invoices
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Recent Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.recentAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No recent appointments</p>
              ) : (
                stats.recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {appointment.patients?.first_name} {appointment.patients?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        with Dr. {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                      </p>
                    </div>
                    <Badge variant={getStatusBadge(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Appointments */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Upcoming Appointments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.upcomingAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No upcoming appointments</p>
              ) : (
                stats.upcomingAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between py-2 border-b last:border-b-0">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">
                        {appointment.patients?.first_name} {appointment.patients?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        with Dr. {appointment.profiles?.first_name} {appointment.profiles?.last_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.appointment_date).toLocaleDateString()} at {appointment.appointment_time}
                      </p>
                    </div>
                    <Badge variant={getStatusBadge(appointment.status)}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}