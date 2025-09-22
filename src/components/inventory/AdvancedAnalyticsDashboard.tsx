import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { useProcurementAnalytics } from '@/hooks/useProcurementAnalytics';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Package, 
  Users, 
  Clock,
  Download,
  Target,
  Award,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  LineChart
} from 'lucide-react';
import { format } from 'date-fns';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart as RechartsLineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function AdvancedAnalyticsDashboard() {
  const { analyticsData, loading, fetchAnalyticsData, exportAnalyticsReport } = useProcurementAnalytics();
  const [dateRange, setDateRange] = useState<{ start: string; end: string } | undefined>();
  const [selectedPeriod, setSelectedPeriod] = useState('last-12-months');

  useEffect(() => {
    // Set default date range based on selected period
    const now = new Date();
    let start: Date;

    switch (selectedPeriod) {
      case 'last-30-days':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'last-90-days':
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'last-12-months':
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        break;
      default:
        start = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
    }

    const range = {
      start: start.toISOString().split('T')[0],
      end: now.toISOString().split('T')[0]
    };

    setDateRange(range);
    fetchAnalyticsData(range);
  }, [selectedPeriod]);

  const handleExport = (format: 'csv' | 'pdf') => {
    exportAnalyticsReport(format);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Advanced Analytics</h2>
            <p className="text-muted-foreground">Loading procurement analytics...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-20 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!analyticsData) {
    return (
      <div className="text-center py-8">
        <p className="text-muted-foreground">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Advanced Analytics</h2>
          <p className="text-muted-foreground">Comprehensive procurement insights and reporting</p>
        </div>
        
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="last-30-days">Last 30 Days</SelectItem>
              <SelectItem value="last-90-days">Last 90 Days</SelectItem>
              <SelectItem value="last-12-months">Last 12 Months</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={() => handleExport('csv')} variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Spend</p>
                <p className="text-2xl font-bold">${analyticsData.totalSpend.toLocaleString()}</p>
                <p className="text-xs text-green-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +12.5% from last period
                </p>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{analyticsData.totalOrders}</p>
                <p className="text-xs text-blue-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +8.2% from last period
                </p>
              </div>
              <Package className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Avg Order Value</p>
                <p className="text-2xl font-bold">${analyticsData.averageOrderValue.toFixed(0)}</p>
                <p className="text-xs text-orange-600 flex items-center mt-1">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  +3.7% from last period
                </p>
              </div>
              <Target className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Cost Savings</p>
                <p className="text-2xl font-bold">${analyticsData.costSavings.total_savings.toFixed(0)}</p>
                <p className="text-xs text-purple-600 flex items-center mt-1">
                  <Award className="h-3 w-3 mr-1" />
                  {analyticsData.costSavings.savings_percentage.toFixed(1)}% saved
                </p>
              </div>
              <Award className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Tabs */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="trends">Trends</TabsTrigger>
          <TabsTrigger value="delivery">Delivery</TabsTrigger>
          <TabsTrigger value="savings">Savings</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly Spend Trend */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LineChart className="h-5 w-5" />
                  Monthly Spend Trends
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={analyticsData.monthlyTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']} />
                    <Area 
                      type="monotone" 
                      dataKey="total_spend" 
                      stroke="#8884d8" 
                      fill="#8884d8" 
                      fillOpacity={0.3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Order Status Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Order Status Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={analyticsData.orderStatusDistribution}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      label={({ status, percentage }) => `${status}: ${percentage.toFixed(1)}%`}
                    >
                      {analyticsData.orderStatusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Key Performance Indicators</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">On-Time Delivery Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData.deliveryMetrics.on_time_delivery_rate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={analyticsData.deliveryMetrics.on_time_delivery_rate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Cost Savings Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData.costSavings.savings_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={analyticsData.costSavings.savings_percentage} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Supplier Performance</span>
                    <span className="text-sm text-muted-foreground">87.5%</span>
                  </div>
                  <Progress value={87.5} className="h-2" />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Suppliers Tab */}
        <TabsContent value="suppliers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Suppliers Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Orders</TableHead>
                    <TableHead>Total Spend</TableHead>
                    <TableHead>Avg Order Value</TableHead>
                    <TableHead>On-Time Rate</TableHead>
                    <TableHead>Quality Score</TableHead>
                    <TableHead>Response Time</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {analyticsData.topSuppliers.map((supplier) => (
                    <TableRow key={supplier.supplier_id}>
                      <TableCell className="font-medium">{supplier.supplier_name}</TableCell>
                      <TableCell>{supplier.total_orders}</TableCell>
                      <TableCell>${supplier.total_spend.toLocaleString()}</TableCell>
                      <TableCell>${supplier.average_order_value.toFixed(0)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>{supplier.on_time_delivery_rate.toFixed(1)}%</span>
                          {supplier.on_time_delivery_rate >= 90 ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : supplier.on_time_delivery_rate >= 75 ? (
                            <Clock className="h-4 w-4 text-yellow-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={supplier.quality_score >= 90 ? 'default' : 'secondary'}>
                          {supplier.quality_score.toFixed(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{supplier.response_time_hours.toFixed(1)}h</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Spend by Category</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.spendByCategory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="category" />
                    <YAxis />
                    <Tooltip formatter={(value) => [`$${Number(value).toLocaleString()}`, 'Spend']} />
                    <Bar dataKey="total_spend" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Category Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.spendByCategory.slice(0, 5).map((category, index) => (
                    <div key={category.category} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">{category.category}</span>
                        <div className="text-right">
                          <div className="text-sm font-medium">${category.total_spend.toLocaleString()}</div>
                          <div className="text-xs text-muted-foreground">{category.percentage.toFixed(1)}%</div>
                        </div>
                      </div>
                      <Progress value={category.percentage} className="h-2" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Trends Tab */}
        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Monthly Procurement Trends</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RechartsLineChart data={analyticsData.monthlyTrends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="total_spend" 
                    stroke="#8884d8" 
                    name="Total Spend ($)"
                  />
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="order_count" 
                    stroke="#82ca9d" 
                    name="Order Count"
                  />
                </RechartsLineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Delivery Tab */}
        <TabsContent value="delivery" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Delivery Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">On-Time Deliveries</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData.deliveryMetrics.on_time_delivery_rate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={analyticsData.deliveryMetrics.on_time_delivery_rate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Early Deliveries</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData.deliveryMetrics.early_delivery_rate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={analyticsData.deliveryMetrics.early_delivery_rate} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Late Deliveries</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData.deliveryMetrics.late_delivery_rate.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={analyticsData.deliveryMetrics.late_delivery_rate} className="h-2" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Delivery Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-blue-500" />
                    <span className="font-medium">Average Delivery Time</span>
                  </div>
                  <span className="text-lg font-bold">{analyticsData.deliveryMetrics.average_delivery_time} days</span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    <Package className="h-5 w-5 text-green-500" />
                    <span className="font-medium">Total Deliveries</span>
                  </div>
                  <span className="text-lg font-bold">{analyticsData.deliveryMetrics.total_deliveries}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Savings Tab */}
        <TabsContent value="savings" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Cost Savings Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                  <div>
                    <p className="font-medium">Quotation Savings</p>
                    <p className="text-sm text-muted-foreground">From competitive bidding</p>
                  </div>
                  <span className="text-lg font-bold text-green-600">
                    ${analyticsData.costSavings.quotation_savings.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg">
                  <div>
                    <p className="font-medium">Bulk Order Savings</p>
                    <p className="text-sm text-muted-foreground">Volume discounts</p>
                  </div>
                  <span className="text-lg font-bold text-blue-600">
                    ${analyticsData.costSavings.bulk_order_savings.toLocaleString()}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-purple-50 rounded-lg">
                  <div>
                    <p className="font-medium">Early Payment Discounts</p>
                    <p className="text-sm text-muted-foreground">Payment term advantages</p>
                  </div>
                  <span className="text-lg font-bold text-purple-600">
                    ${analyticsData.costSavings.early_payment_discounts.toLocaleString()}
                  </span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Savings Impact</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="text-center p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ${analyticsData.costSavings.total_savings.toLocaleString()}
                  </div>
                  <div className="text-lg font-semibold text-gray-700 mb-1">Total Savings</div>
                  <div className="text-sm text-muted-foreground">
                    {analyticsData.costSavings.savings_percentage.toFixed(1)}% of total spend
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Savings Rate</span>
                    <span className="text-sm text-muted-foreground">
                      {analyticsData.costSavings.savings_percentage.toFixed(1)}%
                    </span>
                  </div>
                  <Progress value={analyticsData.costSavings.savings_percentage} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}