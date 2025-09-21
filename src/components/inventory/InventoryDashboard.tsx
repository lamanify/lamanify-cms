import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Package, 
  TrendingUp, 
  AlertTriangle, 
  Clock,
  BarChart3,
  FileText,
  Settings
} from 'lucide-react';
import { StockMovementManager } from './StockMovementManager';
import { StockReceiptForm } from './StockReceiptForm';
import { EnhancedMedicationManagement } from '../settings/EnhancedMedicationManagement';
import { EnhancedServiceManagement } from '../settings/EnhancedServiceManagement';

export function InventoryDashboard() {
  const [activeTab, setActiveTab] = useState('overview');

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
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medications">Medications</TabsTrigger>
          <TabsTrigger value="services">Services</TabsTrigger>
          <TabsTrigger value="stock-movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="receive-stock">Receive Stock</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('medications')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Medication Catalogue</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">Manage</div>
                <p className="text-xs text-muted-foreground">
                  Add, edit, and organize medications with multi-tier pricing
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('services')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Service Catalogue</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Manage</div>
                <p className="text-xs text-muted-foreground">
                  Configure medical services and procedures with pricing
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('stock-movements')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Stock Tracking</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">Monitor</div>
                <p className="text-xs text-muted-foreground">
                  Track all stock movements with comprehensive audit trail
                </p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => setActiveTab('receive-stock')}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receive Stock</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-purple-600">Record</div>
                <p className="text-xs text-muted-foreground">
                  Process new stock receipts from suppliers
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600" />
                  Stock Alerts
                </CardTitle>
                <CardDescription>
                  Items requiring immediate attention
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border-l-4 border-red-400">
                    <div>
                      <p className="font-medium text-red-800">Out of Stock Items</p>
                      <p className="text-sm text-red-600">Requires immediate restocking</p>
                    </div>
                    <div className="text-2xl font-bold text-red-600">0</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border-l-4 border-orange-400">
                    <div>
                      <p className="font-medium text-orange-800">Low Stock Items</p>
                      <p className="text-sm text-orange-600">Below reorder point</p>
                    </div>
                    <div className="text-2xl font-bold text-orange-600">0</div>
                  </div>
                  
                  <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg border-l-4 border-yellow-400">
                    <div>
                      <p className="font-medium text-yellow-800">Expiring Soon</p>
                      <p className="text-sm text-yellow-600">Within 30 days</p>
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">0</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  Inventory Summary
                </CardTitle>
                <CardDescription>
                  Current inventory overview
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Medications</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Services</span>
                    <span className="font-medium">0</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Inventory Value</span>
                    <span className="font-medium">RM 0.00</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Suppliers</span>
                    <span className="font-medium">0</span>
                  </div>
                </div>
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
              <div className="grid gap-4 md:grid-cols-3">
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

        <TabsContent value="stock-movements">
          <StockMovementManager />
        </TabsContent>

        <TabsContent value="receive-stock">
          <StockReceiptForm />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Inventory Reports
              </CardTitle>
              <CardDescription>
                Generate comprehensive inventory and stock analysis reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Advanced reporting features coming soon</p>
                <p className="text-sm">Stock aging, valuation, turnover analysis, and more</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}