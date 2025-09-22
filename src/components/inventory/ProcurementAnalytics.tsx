import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { PurchaseOrder, Supplier } from '@/hooks/usePurchaseOrders';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Clock, 
  Users,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react';
import { format, subDays, eachMonthOfInterval, startOfMonth, endOfMonth } from 'date-fns';

interface ProcurementAnalyticsProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00', '#0088fe'];

export function ProcurementAnalytics({ purchaseOrders, suppliers }: ProcurementAnalyticsProps) {
  const analytics = useMemo(() => {
    // Basic metrics
    const totalOrders = purchaseOrders.length;
    const totalValue = purchaseOrders.reduce((sum, po) => sum + (po.total_amount || 0), 0);
    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders : 0;

    // Status distribution
    const statusDistribution = purchaseOrders.reduce((acc, po) => {
      acc[po.status] = (acc[po.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const statusData = Object.entries(statusDistribution).map(([status, count]) => ({
      name: status,
      value: count,
      percentage: (count / totalOrders) * 100
    }));

    // Supplier performance
    const supplierPerformance = suppliers.map(supplier => {
      const supplierPOs = purchaseOrders.filter(po => po.supplier_id === supplier.id);
      const totalOrders = supplierPOs.length;
      const totalValue = supplierPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0);
      const onTimeDeliveries = supplierPOs.filter(po => 
        po.status === 'received' && 
        po.delivery_date && 
        po.expected_delivery_date &&
        new Date(po.delivery_date) <= new Date(po.expected_delivery_date)
      ).length;

      return {
        id: supplier.id,
        name: supplier.supplier_name,
        totalOrders,
        totalValue,
        averageOrderValue: totalOrders > 0 ? totalValue / totalOrders : 0,
        onTimeRate: totalOrders > 0 ? (onTimeDeliveries / totalOrders) * 100 : 0
      };
    }).sort((a, b) => b.totalValue - a.totalValue);

    // Monthly trend data
    const last6Months = eachMonthOfInterval({
      start: subDays(new Date(), 180),
      end: new Date()
    });

    const monthlyTrend = last6Months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      const monthPOs = purchaseOrders.filter(po => {
        const orderDate = new Date(po.order_date);
        return orderDate >= monthStart && orderDate <= monthEnd;
      });

      return {
        month: format(month, 'MMM yyyy'),
        orders: monthPOs.length,
        value: monthPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0)
      };
    });

    // Performance metrics
    const pendingApprovals = purchaseOrders.filter(po => po.status === 'pending').length;
    const overduePOs = purchaseOrders.filter(po => {
      if (!po.expected_delivery_date || po.status === 'received' || po.status === 'cancelled') return false;
      return new Date(po.expected_delivery_date) < new Date();
    }).length;

    const deliveryPerformance = purchaseOrders.filter(po => 
      po.status === 'received' && po.delivery_date && po.expected_delivery_date
    );

    const onTimeDeliveryRate = deliveryPerformance.length > 0 ? 
      (deliveryPerformance.filter(po => 
        new Date(po.delivery_date!) <= new Date(po.expected_delivery_date!)
      ).length / deliveryPerformance.length) * 100 : 0;

    return {
      totalOrders,
      totalValue,
      averageOrderValue,
      statusData,
      supplierPerformance: supplierPerformance.slice(0, 10), // Top 10 suppliers
      monthlyTrend,
      pendingApprovals,
      overduePOs,
      onTimeDeliveryRate
    };
  }, [purchaseOrders, suppliers]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Procurement Analytics</h2>
        <p className="text-muted-foreground">
          Comprehensive insights into purchase order performance and supplier metrics
        </p>
      </div>

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              Purchase orders processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.totalValue.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Procurement spend
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Order Value</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${analytics.averageOrderValue.toFixed(0)}</div>
            <p className="text-xs text-muted-foreground">
              Per purchase order
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">On-Time Delivery</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.onTimeDeliveryRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              Delivery performance
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Alerts */}
      {(analytics.pendingApprovals > 0 || analytics.overduePOs > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {analytics.pendingApprovals > 0 && (
            <Card className="border-yellow-200 bg-yellow-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-yellow-800">Pending Approvals</CardTitle>
                <Clock className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-yellow-800">{analytics.pendingApprovals}</div>
                <p className="text-xs text-yellow-600">
                  Purchase orders awaiting approval
                </p>
              </CardContent>
            </Card>
          )}

          {analytics.overduePOs > 0 && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-red-800">Overdue Deliveries</CardTitle>
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-800">{analytics.overduePOs}</div>
                <p className="text-xs text-red-600">
                  Purchase orders past delivery date
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={analytics.statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Procurement Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.monthlyTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value, name) => [
                      name === 'value' ? `$${value.toLocaleString()}` : value,
                      name === 'value' ? 'Total Value' : 'Orders'
                    ]}
                  />
                  <Line type="monotone" dataKey="orders" stroke="#8884d8" />
                  <Line type="monotone" dataKey="value" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Supplier Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Top Suppliers Performance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {analytics.supplierPerformance.map((supplier, index) => (
              <div key={supplier.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-full text-sm font-medium">
                    #{index + 1}
                  </div>
                  <div>
                    <div className="font-medium">{supplier.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {supplier.totalOrders} orders • ${supplier.totalValue.toLocaleString()} total value
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium">
                    Avg: ${supplier.averageOrderValue.toFixed(0)}
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress value={supplier.onTimeRate} className="w-16" />
                    <span className="text-xs text-muted-foreground">
                      {supplier.onTimeRate.toFixed(1)}% on-time
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {analytics.supplierPerformance.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No supplier data available
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}