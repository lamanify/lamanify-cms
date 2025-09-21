import { useState } from 'react';
import { Plus, FileText, Package, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { PurchaseOrderModal } from './PurchaseOrderModal';
import { SupplierManagement } from './SupplierManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const statusColors = {
  draft: 'bg-gray-500',
  pending: 'bg-yellow-500',
  approved: 'bg-blue-500',
  ordered: 'bg-purple-500',
  partially_received: 'bg-orange-500',
  received: 'bg-green-500',
  cancelled: 'bg-red-500'
};

const statusIcons = {
  draft: FileText,
  pending: Clock,
  approved: CheckCircle,
  ordered: Package,
  partially_received: Package,
  received: CheckCircle,
  cancelled: XCircle
};

export function PurchaseOrderDashboard() {
  const { purchaseOrders, suppliers, loading, approvePurchaseOrder } = usePurchaseOrders();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  const handleStatusAction = async (id: string, action: string) => {
    if (action === 'approve') {
      await approvePurchaseOrder(id);
    }
  };

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || FileText;
    return <Icon className="h-4 w-4" />;
  };

  const pendingOrders = purchaseOrders.filter(po => po.status === 'pending');
  const draftOrders = purchaseOrders.filter(po => po.status === 'draft');
  const approvedOrders = purchaseOrders.filter(po => po.status === 'approved');

  if (loading) {
    return <div className="flex items-center justify-center p-8">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Procurement Management</h1>
          <p className="text-muted-foreground">Manage purchase orders and suppliers</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          New Purchase Order
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>  
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total POs</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{purchaseOrders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approval</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingOrders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Approved</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{approvedOrders.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{suppliers.length}</div>
              </CardContent>
            </Card>
          </div>

          {pendingOrders.length > 0 && (
            <Card className="mb-6">
              <CardHeader>
                <CardTitle>Pending Approvals</CardTitle>
                <CardDescription>Purchase orders requiring approval</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>PO Number</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Total Amount</TableHead>
                      <TableHead>Order Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingOrders.map((po) => (
                      <TableRow key={po.id}>
                        <TableCell className="font-medium">{po.po_number}</TableCell>
                        <TableCell>{po.supplier?.supplier_name}</TableCell>
                        <TableCell>${po.total_amount.toFixed(2)}</TableCell>
                        <TableCell>{new Date(po.order_date).toLocaleDateString()}</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            onClick={() => handleStatusAction(po.id!, 'approve')}
                          >
                            Approve
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="purchase-orders">
          <Card>
            <CardHeader>
              <CardTitle>All Purchase Orders</CardTitle>
              <CardDescription>View and manage all purchase orders</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {purchaseOrders.map((po) => (
                    <TableRow key={po.id} className="cursor-pointer hover:bg-muted/50">
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.supplier?.supplier_name}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary" 
                          className={`${statusColors[po.status]} text-white`}
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(po.status)}
                            {po.status.replace('_', ' ')}
                          </span>
                        </Badge>
                      </TableCell>
                      <TableCell>${po.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{new Date(po.order_date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        {po.expected_delivery_date 
                          ? new Date(po.expected_delivery_date).toLocaleDateString()
                          : 'Not set'
                        }
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="suppliers">
          <SupplierManagement />
        </TabsContent>
      </Tabs>

      <PurchaseOrderModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        purchaseOrder={selectedPO}
      />
    </div>
  );
}