import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePickerWithRange } from '@/components/ui/date-picker';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, Package, DollarSign, AlertTriangle, Target } from 'lucide-react';
import { useInventoryAnalytics } from '@/hooks/useInventoryAnalytics';
import { useMedications } from '@/hooks/useMedications';
import { DateRange } from 'react-day-picker';
import { format, subDays } from 'date-fns';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', '#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff00'];

export function InventoryAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: subDays(new Date(), 30),
    to: new Date()
  });
  const [groupBy, setGroupBy] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
  const [selectedMedication, setSelectedMedication] = useState<string>('');
  const [activeTab, setActiveTab] = useState('consumption');

  const {
    loading,
    usageAnalytics,
    consumptionTrends,
    costFluctuations,
    fetchUsageAnalytics,
    fetchCostFluctuations,
    getPredictiveDemand
  } = useInventoryAnalytics();

  const { medications } = useMedications();

  useEffect(() => {
    if (dateRange?.from && dateRange?.to) {
      const fromStr = format(dateRange.from, 'yyyy-MM-dd');
      const toStr = format(dateRange.to, 'yyyy-MM-dd');
      
      fetchUsageAnalytics(fromStr, toStr, groupBy, selectedMedication);
      fetchCostFluctuations(fromStr, toStr);
    }
  }, [dateRange, groupBy, selectedMedication]);

  const totalConsumption = usageAnalytics.reduce((sum, period) => sum + period.totalConsumption, 0);
  const totalValue = usageAnalytics.reduce((sum, period) => sum + period.totalValue, 0);
  const averageDailyConsumption = totalConsumption / (usageAnalytics.length || 1);

  const topMedications = medications
    .map(med => {
      const consumed = usageAnalytics.reduce((sum, period) => {
        const medData = period.topMedications.find(m => m.medication_id === med.id);
        return sum + (medData?.total_dispensed || 0);
      }, 0);
      
      return {
        ...med,
        consumed,
        value: consumed * (med.cost_price || 0),
        predictedDemand: getPredictiveDemand(med.id)
      };
    })
    .filter(med => med.consumed > 0)
    .sort((a, b) => b.consumed - a.consumed)
    .slice(0, 10);

  const lowStockItems = medications.filter(med => {
    const predictedDemand = getPredictiveDemand(med.id);
    return (med.stock_level || 0) < predictedDemand && predictedDemand > 0;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h2 className="text-2xl font-bold">Inventory Analytics</h2>
          <p className="text-muted-foreground">
            Advanced analytics and consumption insights
          </p>
        </div>
        
        <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
          <DatePickerWithRange
            date={dateRange}
            onDateChange={setDateRange}
            className="w-full lg:w-auto"
          />
          
          <Select value={groupBy} onValueChange={(value: any) => setGroupBy(value)}>
            <SelectTrigger className="w-full lg:w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedMedication} onValueChange={setSelectedMedication}>
            <SelectTrigger className="w-full lg:w-48">
              <SelectValue placeholder="All medications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All medications</SelectItem>
              {medications.map(med => (
                <SelectItem key={med.id} value={med.id}>
                  {med.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Consumption</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalConsumption.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Units dispensed in selected period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Value of consumed inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Daily Average</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageDailyConsumption.toFixed(1)}</div>
            <p className="text-xs text-muted-foreground">
              Units per day average
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{lowStockItems.length}</div>
            <p className="text-xs text-muted-foreground">
              Items below predicted demand
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="consumption">Consumption Trends</TabsTrigger>
          <TabsTrigger value="top-items">Top Medications</TabsTrigger>
          <TabsTrigger value="cost-analysis">Cost Analysis</TabsTrigger>
          <TabsTrigger value="demand-forecast">Demand Forecast</TabsTrigger>
        </TabsList>

        <TabsContent value="consumption" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Consumption Trends Over Time</CardTitle>
              <CardDescription>
                Track medication consumption patterns and identify trends
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={consumptionTrends}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Bar yAxisId="left" dataKey="consumption" fill="hsl(var(--primary))" name="Units Consumed" />
                    <Line yAxisId="right" type="monotone" dataKey="value" stroke="hsl(var(--secondary))" name="Value (RM)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top-items" className="space-y-4">
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top 10 Consumed Medications</CardTitle>
                <CardDescription>
                  Most frequently dispensed items by quantity
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {topMedications.map((med, index) => (
                    <div key={med.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Badge variant="secondary" className="w-6 h-6 p-0 flex items-center justify-center">
                          {index + 1}
                        </Badge>
                        <div>
                          <p className="font-medium">{med.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Stock: {med.stock_level || 0} | Predicted: {med.predictedDemand}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{med.consumed}</p>
                        <p className="text-sm text-muted-foreground">RM {med.value.toFixed(2)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Consumption Distribution</CardTitle>
                <CardDescription>
                  Proportion of total consumption by medication
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topMedications.slice(0, 6)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="consumed"
                      >
                        {topMedications.slice(0, 6).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="cost-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cost Fluctuation Analysis</CardTitle>
              <CardDescription>
                Track medication cost changes and price volatility
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {costFluctuations.slice(0, 5).map((med) => (
                  <Card key={med.medication_id}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg">{med.medication_name}</CardTitle>
                        <Badge variant={med.price_volatility > 1 ? "destructive" : "secondary"}>
                          Volatility: {med.price_volatility.toFixed(2)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="h-32">
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={med.cost_history}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="date" />
                            <YAxis />
                            <Tooltip />
                            <Line type="monotone" dataKey="cost" stroke="hsl(var(--primary))" strokeWidth={2} />
                          </LineChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="demand-forecast" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Demand Forecast & Stock Alerts</CardTitle>
              <CardDescription>
                Predicted demand vs current stock levels
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {lowStockItems.length > 0 ? (
                  lowStockItems.map((med) => {
                    const predictedDemand = getPredictiveDemand(med.id);
                    const currentStock = med.stock_level || 0;
                    const deficit = predictedDemand - currentStock;
                    
                    return (
                      <div key={med.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium">{med.name}</p>
                          <p className="text-sm text-muted-foreground">
                            Current Stock: {currentStock} | Predicted Demand: {predictedDemand}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Badge variant="destructive">
                            Short by {deficit}
                          </Badge>
                          <Target className="h-4 w-4 text-orange-500" />
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No stock alerts based on current demand forecast</p>
                    <p className="text-sm">All medications have adequate stock levels</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}