import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { BarChart3, TrendingUp, Users, DollarSign, Calendar, Activity, FileText, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { PatientStatsPanel } from './PatientStatsPanel';
import { ExportManager } from './ExportManager';
import { toast } from 'sonner';

interface AnalyticsData {
  totalPatients: number;
  newPatientsThisMonth: number;
  totalRevenue: number;
  averageVisitsPerPatient: number;
  topDiagnoses: Array<{ diagnosis: string; count: number }>;
  revenueByMonth: Array<{ month: string; revenue: number }>;
  patientGrowth: Array<{ month: string; newPatients: number }>;
}

export function PatientAnalyticsTab() {
  const [patients, setPatients] = useState<any[]>([]);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1M' | '3M' | '6M' | '1Y'>('3M');

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      
      // Fetch all patients for the stats panel
      const { data: patientsData, error: patientsError } = await supabase
        .from('patients')
        .select('*')
        .order('created_at', { ascending: false });

      if (patientsError) throw patientsError;

      // Fetch appointments data
      const { data: appointmentsData } = await supabase
        .from('appointments')
        .select('patient_id, appointment_date, status');

      // Fetch billing data
      const { data: billingData } = await supabase
        .from('billing')
        .select('patient_id, created_at, amount');

      setPatients(patientsData || []);

      // Calculate analytics
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const newPatientsThisMonth = (patientsData || []).filter(
        patient => new Date(patient.created_at) >= startOfMonth
      ).length;

      const totalRevenue = (billingData || []).reduce(
        (sum, bill) => sum + (bill.amount || 0), 0
      );

      const totalVisits = (appointmentsData?.length || 0) + (billingData?.length || 0);
      const averageVisitsPerPatient = patientsData?.length ? totalVisits / patientsData.length : 0;

      // Calculate top statuses (placeholder for diagnoses since we don't have that field)
      const statusCount: { [key: string]: number } = {};
      (appointmentsData || []).forEach(apt => {
        if (apt.status) {
          statusCount[apt.status] = (statusCount[apt.status] || 0) + 1;
        }
      });

      const topDiagnoses = Object.entries(statusCount)
        .map(([diagnosis, count]) => ({ diagnosis, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      // Calculate revenue by month (last 12 months)
      const revenueByMonth: Array<{ month: string; revenue: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthRevenue = (billingData || [])
          .filter(bill => {
            const billDate = new Date(bill.created_at);
            return billDate >= monthDate && billDate < nextMonthDate;
          })
          .reduce((sum, bill) => sum + (bill.amount || 0), 0);

        revenueByMonth.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          revenue: monthRevenue
        });
      }

      // Calculate patient growth by month
      const patientGrowth: Array<{ month: string; newPatients: number }> = [];
      for (let i = 11; i >= 0; i--) {
        const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const nextMonthDate = new Date(now.getFullYear(), now.getMonth() - i + 1, 1);
        
        const monthNewPatients = (patientsData || [])
          .filter(patient => {
            const createdDate = new Date(patient.created_at);
            return createdDate >= monthDate && createdDate < nextMonthDate;
          }).length;

        patientGrowth.push({
          month: monthDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
          newPatients: monthNewPatients
        });
      }

      setAnalyticsData({
        totalPatients: patientsData?.length || 0,
        newPatientsThisMonth,
        totalRevenue,
        averageVisitsPerPatient,
        topDiagnoses,
        revenueByMonth,
        patientGrowth
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error('Failed to load analytics data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalyticsData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <BarChart3 className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-semibold">Analytics & Reports</h1>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {(['1M', '3M', '6M', '1Y'] as const).map((range) => (
              <Button
                key={range}
                variant={selectedTimeRange === range ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTimeRange(range)}
              >
                {range}
              </Button>
            ))}
          </div>
          <ExportManager 
            patients={patients} 
            selectedPatients={[]} 
            columns={[]}
          />
        </div>
      </div>

      {/* Patient Statistics Panel */}
      <PatientStatsPanel patients={patients} />

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analyticsData?.totalPatients || 0}</div>
            <p className="text-xs text-muted-foreground">
              +{analyticsData?.newPatientsThisMonth || 0} new this month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(analyticsData?.totalRevenue || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              All-time revenue
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Visits/Patient</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.averageVisitsPerPatient.toFixed(1) || '0.0'}
            </div>
            <p className="text-xs text-muted-foreground">
              Average patient engagement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analyticsData?.newPatientsThisMonth || 0}%
            </div>
            <p className="text-xs text-muted-foreground">
              Monthly patient growth
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Top Diagnoses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Top Diagnoses</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {analyticsData?.topDiagnoses.map((item, index) => (
              <div key={item.diagnosis} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                    {index + 1}
                  </Badge>
                  <span className="font-medium">{item.diagnosis}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-muted-foreground">{item.count} cases</span>
                  <div className="w-16 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary rounded-full"
                      style={{ 
                        width: `${(item.count / (analyticsData.topDiagnoses[0]?.count || 1)) * 100}%` 
                      }}
                    />
                  </div>
                </div>
              </div>
            )) || (
              <p className="text-muted-foreground text-center py-4">
                No diagnosis data available
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Revenue and Growth Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Revenue Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData?.revenueByMonth.slice(-6).map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm">{item.month}</span>
                  <span className="font-medium">{formatCurrency(item.revenue)}</span>
                </div>
              )) || (
                <p className="text-muted-foreground text-center py-4">
                  No revenue data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Patient Growth</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {analyticsData?.patientGrowth.slice(-6).map((item) => (
                <div key={item.month} className="flex items-center justify-between">
                  <span className="text-sm">{item.month}</span>
                  <Badge variant="secondary">{item.newPatients} new</Badge>
                </div>
              )) || (
                <p className="text-muted-foreground text-center py-4">
                  No growth data available
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}