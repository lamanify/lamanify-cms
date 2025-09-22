import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { useClaimsReconciliation } from '@/hooks/useClaimsReconciliation';
import { usePanels } from '@/hooks/usePanels';
import { AlertTriangle, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export const ReconciliationDashboard: React.FC = () => {
  const { reconciliations, stats, fetchReconciliationStats, fetchReconciliations } = useClaimsReconciliation();
  const { panels } = usePanels();
  const [selectedPanel, setSelectedPanel] = useState<string>('');
  const [timeRange, setTimeRange] = useState<'30' | '90' | '365'>('30');

  useEffect(() => {
    fetchReconciliationStats(selectedPanel || undefined);
    fetchReconciliations({
      panel_id: selectedPanel || undefined,
      date_from: new Date(Date.now() - parseInt(timeRange) * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
    });
  }, [selectedPanel, timeRange]);

  // Prepare chart data
  const varianceTypeData = stats?.top_variance_types.map(item => ({
    name: item.variance_type.replace('_', ' '),
    count: item.count,
    amount: item.total_amount
  })) || [];

  const statusDistribution = reconciliations.reduce((acc, rec) => {
    acc[rec.reconciliation_status] = (acc[rec.reconciliation_status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = Object.entries(statusDistribution).map(([status, count]) => ({
    name: status,
    value: count
  }));

  // Monthly trend data
  const monthlyTrends = reconciliations.reduce((acc, rec) => {
    const month = new Date(rec.created_at).toISOString().slice(0, 7); // YYYY-MM
    if (!acc[month]) {
      acc[month] = { month, count: 0, variance_amount: 0 };
    }
    acc[month].count++;
    acc[month].variance_amount += Math.abs(rec.variance_amount);
    return acc;
  }, {} as Record<string, any>);

  const trendData = Object.values(monthlyTrends).sort((a: any, b: any) => 
    new Date(a.month).getTime() - new Date(b.month).getTime()
  );

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const getVarianceIndicator = () => {
    if (!stats) return null;
    
    const currentMonthVariances = reconciliations.filter(r => {
      const recordDate = new Date(r.created_at);
      const currentMonth = new Date();
      return recordDate.getMonth() === currentMonth.getMonth() && 
             recordDate.getFullYear() === currentMonth.getFullYear();
    });

    const previousMonthVariances = reconciliations.filter(r => {
      const recordDate = new Date(r.created_at);
      const previousMonth = new Date();
      previousMonth.setMonth(previousMonth.getMonth() - 1);
      return recordDate.getMonth() === previousMonth.getMonth() && 
             recordDate.getFullYear() === previousMonth.getFullYear();
    });

    const currentTotal = currentMonthVariances.reduce((sum, r) => sum + Math.abs(r.variance_amount), 0);
    const previousTotal = previousMonthVariances.reduce((sum, r) => sum + Math.abs(r.variance_amount), 0);
    
    const percentChange = previousTotal > 0 ? ((currentTotal - previousTotal) / previousTotal) * 100 : 0;
    const isIncrease = percentChange > 0;

    return {
      value: Math.abs(percentChange).toFixed(1),
      isIncrease,
      icon: isIncrease ? TrendingUp : TrendingDown,
      color: isIncrease ? 'text-red-500' : 'text-green-500'
    };
  };

  const varianceIndicator = getVarianceIndicator();

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex gap-4 items-center">
        <Select value={selectedPanel} onValueChange={setSelectedPanel}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All Panels" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Panels</SelectItem>
            {panels.map((panel) => (
              <SelectItem key={panel.id} value={panel.id}>
                {panel.panel_name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={timeRange} onValueChange={(value: '30' | '90' | '365') => setTimeRange(value)}>
          <SelectTrigger className="w-[150px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">Last 30 days</SelectItem>
            <SelectItem value="90">Last 90 days</SelectItem>
            <SelectItem value="365">Last year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Variance Amount</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${stats.total_variance_amount.toFixed(2)}
              </div>
              {varianceIndicator && (
                <div className={`flex items-center text-xs ${varianceIndicator.color}`}>
                  <varianceIndicator.icon className="h-3 w-3 mr-1" />
                  {varianceIndicator.value}% vs last month
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolution Rate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.total_variances > 0 ? ((stats.resolved_count / stats.total_variances) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {stats.resolved_count} of {stats.total_variances} resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Variance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avg_variance_percentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                Per claim variance percentage
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">
                {stats.pending_count}
              </div>
              <p className="text-xs text-muted-foreground">
                Require immediate attention
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Variance Types Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Variance Types by Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={varianceTypeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value, name) => [
                  name === 'amount' ? `$${Number(value).toFixed(2)}` : value,
                  name === 'amount' ? 'Amount' : 'Count'
                ]} />
                <Bar dataKey="amount" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Reconciliation Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Monthly Variance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'variance_amount' ? `$${Number(value).toFixed(2)}` : value,
                    name === 'variance_amount' ? 'Variance Amount' : 'Count'
                  ]}
                  labelFormatter={(label) => `Month: ${label}`}
                />
                <Bar yAxisId="left" dataKey="count" fill="#8884d8" />
                <Line 
                  yAxisId="right" 
                  type="monotone" 
                  dataKey="variance_amount" 
                  stroke="#ff7300" 
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Issues Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Top Variance Issues</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats?.top_variance_types.slice(0, 5).map((item, index) => (
              <div key={item.variance_type} className="flex items-center justify-between p-3 border rounded">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">#{index + 1}</Badge>
                  <div>
                    <p className="font-medium capitalize">
                      {item.variance_type.replace('_', ' ')}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.count} occurrences
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-red-600">
                    ${item.total_amount.toFixed(2)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Total impact
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};