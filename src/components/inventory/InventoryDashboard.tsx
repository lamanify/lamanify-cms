import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  BarChart3,
  FileText,
  Settings,
  ArrowRight
} from 'lucide-react';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useMedications } from '@/hooks/useMedications';
import { ExpiryAlertsPanel } from './ExpiryAlertsPanel';
import { StockMovementManager } from './StockMovementManager';
import { StockReceiptForm } from './StockReceiptForm';
import { ExpiryTrackingManager } from './ExpiryTrackingManager';
import { BatchInventoryManager } from './BatchInventoryManager';
import { PurchaseOrderDashboard } from './PurchaseOrderDashboard';
import { EnhancedPurchaseOrderDashboard } from './EnhancedPurchaseOrderDashboard';
import { CostHistoryManager } from './CostHistoryManager';
import { InventoryValueCalculator } from './InventoryValueCalculator';
import { InventoryAnalyticsDashboard } from './InventoryAnalyticsDashboard';
import { InventoryReportsManager } from './InventoryReportsManager';
import { EnhancedMedicationManagement } from '../settings/EnhancedMedicationManagement';
import { EnhancedServiceManagement } from '../settings/EnhancedServiceManagement';

export function InventoryDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const { medications } = useMedications();
  const { getStockSummary } = useStockMovements();
  const summary = getStockSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Inventory & Services Management</h1>
          <p className="text-muted-foreground">
            Comprehensive control over medication inventory and medical services
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-10">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="stock-movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="receive-stock">Receive Stock</TabsTrigger>
          <TabsTrigger value="expiry-tracking">Expiry Tracking</TabsTrigger>
          <TabsTrigger value="batch-management">Batch Management</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{summary.totalItems}</div>
                <p className="text-xs text-muted-foreground">Medications in inventory</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold">{summary.lowStockCount}</div>
                    <p className="text-xs text-muted-foreground">Items below threshold</p>
                  </div>
                  {summary.lowStockCount > 0 && (
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => navigate("/inventory/alerts/low-stock")}
                    >
                      View All
                      <ArrowRight className="h-3 w-3 ml-1" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
                <AlertTriangle className="h-4 w-4 text-destructive" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-destructive">{summary.outOfStockCount}</div>
                <p className="text-xs text-muted-foreground">Items needing restock</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Value</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">RM {summary.totalValue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Current inventory value</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <ExpiryAlertsPanel 
              compact={true}
              onViewDetails={() => navigate("/inventory/alerts/expiry")}
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Inventory Valuation
                </CardTitle>
                <CardDescription>
                  Real-time inventory value using moving average costs
                </CardDescription>
              </CardHeader>
              <CardContent>
                <InventoryValueCalculator />
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Common inventory management tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => setActiveTab('medications')}
                >
                  <Package className="h-6 w-6" />
                  <span>Add Medication</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => setActiveTab('receive-stock')}
                >
                  <TrendingUp className="h-6 w-6" />
                  <span>Receive Stock</span>
                </Button>
                
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => setActiveTab('stock-movements')}
                >
                  <Clock className="h-6 w-6" />
                  <span>Stock Adjustment</span>
                </Button>

                <CostHistoryManager />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="medications">
          <EnhancedMedicationManagement />
        </TabsContent>

        <TabsContent value="services">
          <EnhancedServiceManagement />
        </TabsContent>

        <TabsContent value="purchase-orders">
          <EnhancedPurchaseOrderDashboard />
        </TabsContent>

        <TabsContent value="stock-movements">
          <StockMovementManager />
        </TabsContent>

        <TabsContent value="receive-stock">
          <StockReceiptForm />
        </TabsContent>

        <TabsContent value="expiry-tracking">
          <ExpiryTrackingManager />
        </TabsContent>

        <TabsContent value="batch-management">
          <BatchInventoryManager />
        </TabsContent>

        <TabsContent value="analytics">
          <InventoryAnalyticsDashboard />
        </TabsContent>

        <TabsContent value="reports">
          <InventoryReportsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}