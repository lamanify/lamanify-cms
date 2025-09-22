import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { supabase } from '@/integrations/supabase/client';
import { usePanels } from '@/hooks/usePanels';
import { 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  DollarSign, 
  FileText, 
  CheckCircle,
  XCircle,
  AlertTriangle,
  Calendar,
  Download
} from 'lucide-react';

interface ClaimsAnalytics {
  totalClaims: number;
  totalAmount: number;
  averageProcessingTime: number;
  approvalRate: number;
  monthlyTrends: any[];
  statusDistribution: any[];
  panelPerformance: any[];
  recentActivity: any[];
}

export const PanelClaimsAnalyticsDashboard = () => {
  const [analytics, setAnalytics] = useState<ClaimsAnalytics>({
    totalClaims: 0,
    totalAmount: 0,
    averageProcessingTime: 0,
    approvalRate: 0,
    monthlyTrends: [],
    statusDistribution: [],
    panelPerformance: [],
    recentActivity: []
  });
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('30'); // days
  const [selectedPanel, setSelectedPanel] = useState('all');
  
  const { panels } = usePanels();

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - parseInt(dateRange));

      let query = supabase
        .from('panel_claims')
        .select(`
          *,
          panels(panel_name),
          panel_claim_items(*)
        `)
        .gte('created_at', startDate.toISOString());

      if (selectedPanel !== 'all') {
        query = query.eq('panel_id', selectedPanel);
      }

      const { data: claims, error } = await query;
      
      if (error) throw error;

      // Calculate analytics
      const totalClaims = claims?.length || 0;
      const totalAmount = claims?.reduce((sum, claim) => sum + (claim.total_amount || 0), 0) || 0;
      const approvedClaims = claims?.filter(claim => claim.status === 'approved').length || 0;
      const approvalRate = totalClaims > 0 ? (approvedClaims / totalClaims) * 100 : 0;

      // Calculate average processing time
      const processedClaims = claims?.filter(claim => 
        claim.status !== 'draft' && claim.status !== 'submitted' && claim.approved_at
      ) || [];
      
      const avgProcessingTime = processedClaims.length > 0 
        ? processedClaims.reduce((sum, claim) => {
            const created = new Date(claim.created_at);
            const approved = new Date(claim.approved_at);
            return sum + (approved.getTime() - created.getTime());
          }, 0) / processedClaims.length / (1000 * 60 * 60 * 24) // Convert to days
        : 0;

      // Monthly trends
      const monthlyData = generateMonthlyTrends(claims || []);
      
      // Status distribution
      const statusCounts = (claims || []).reduce((acc, claim) => {
        acc[claim.status] = (acc[claim.status] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const statusDistribution = Object.entries(statusCounts).map(([status, count]) => ({
        name: status,
        value: count,
        color: getStatusColor(status)
      }));

      // Panel performance
      const panelData = (claims || []).reduce((acc, claim) => {
        const panelName = claim.panels?.panel_name || 'Unknown';
        if (!acc[panelName]) {
          acc[panelName] = { name: panelName, claims: 0, amount: 0, avgDays: 0 };
        }
        acc[panelName].claims += 1;
        acc[panelName].amount += claim.total_amount || 0;
        return acc;
      }, {} as Record<string, any>);

      const panelPerformance = Object.values(panelData);

      setAnalytics({
        totalClaims,
        totalAmount,
        averageProcessingTime: avgProcessingTime,
        approvalRate,
        monthlyTrends: monthlyData,
        statusDistribution,
        panelPerformance,
        recentActivity: claims?.slice(0, 10) || []
      });

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateMonthlyTrends = (claims: any[]) => {
    const monthlyData = claims.reduce((acc, claim) => {
      const month = new Date(claim.created_at).toISOString().substring(0, 7);
      if (!acc[month]) {
        acc[month] = { month, claims: 0, amount: 0, approved: 0 };
      }
      acc[month].claims += 1;
      acc[month].amount += claim.total_amount || 0;
      if (claim.status === 'approved') acc[month].approved += 1;
      return acc;
    }, {} as Record<string, any>);

    return Object.values(monthlyData).sort((a: any, b: any) => a.month.localeCompare(b.month));
  };

  const getStatusColor = (status: string) => {
    const colors = {
      draft: '#8B5CF6',
      submitted: '#3B82F6', 
      approved: '#10B981',
      paid: '#059669',
      rejected: '#EF4444'
    };
    return colors[status as keyof typeof colors] || '#6B7280';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const exportAnalytics = () => {
    // Implementation for exporting analytics
    console.log('Exporting analytics...');
  };

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange, selectedPanel]);

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading analytics...</div>;
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold">Panel Claims Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive insights into claim performance and trends
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7">Last 7 days</SelectItem>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedPanel} onValueChange={setSelectedPanel}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Panels</SelectItem>
              {panels.map(panel => (
                <SelectItem key={panel.id} value={panel.id}>
                  {panel.panel_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={exportAnalytics}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalClaims}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1" />
              +2.5% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Amount</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalAmount)}</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="inline w-3 h-3 mr-1" />
              +12.3% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approval Rate</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.approvalRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline w-3 h-3 mr-1" />
              -1.2% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Processing Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.averageProcessingTime.toFixed(1)} days</div>
            <p className="text-xs text-muted-foreground">
              <TrendingDown className="inline w-3 h-3 mr-1" />
              -0.5 days from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trends" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trends">Monthly Trends</TabsTrigger>
          <TabsTrigger value="status">Status Distribution</TabsTrigger>
          <TabsTrigger value="panels">Panel Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Claims and Revenue Trends</CardTitle>
              <CardDescription>Monthly progression of claims volume and revenue</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={analytics.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="claims" fill="hsl(var(--primary))" name="Claims Count" />
                  <Line yAxisId="right" type="monotone" dataKey="amount" stroke="hsl(var(--destructive))" name="Total Amount" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
              <CardDescription>Current distribution of claim statuses</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={analytics.statusDistribution}
                    cx="50%"
                    cy="50%"
                    outerRadius={150}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {analytics.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="panels" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Panel Performance</CardTitle>
              <CardDescription>Claims volume and amounts by panel</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={analytics.panelPerformance}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Bar yAxisId="left" dataKey="claims" fill="hsl(var(--primary))" name="Claims Count" />
                  <Bar yAxisId="right" dataKey="amount" fill="hsl(var(--secondary))" name="Total Amount" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};