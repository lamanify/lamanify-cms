import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';
import { PurchaseOrderModal } from './PurchaseOrderModal';
import { PurchaseOrderReceiving } from './PurchaseOrderReceiving';
import { SupplierManagement } from './SupplierManagement';
import { PurchaseOrderAuditTrail } from './PurchaseOrderAuditTrail';
import { ProcurementAnalytics } from './ProcurementAnalytics';
import { QuotationManager } from './QuotationManager';
import { DocumentManager } from './DocumentManager';
import { SupplierCommunication } from './SupplierCommunication';
import { 
  FileText, 
  Package, 
  Users, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Plus,
  Download,
  Filter,
  Calendar,
  DollarSign
} from 'lucide-react';
import { format } from 'date-fns';

const statusColors = {
  draft: 'bg-gray-100 text-gray-800',
  pending: 'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  ordered: 'bg-purple-100 text-purple-800',
  partially_received: 'bg-orange-100 text-orange-800',
  received: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
};

const statusIcons = {
  draft: Clock,
  pending: AlertCircle,
  approved: CheckCircle,
  ordered: Package,
  partially_received: Package,
  received: CheckCircle,
  cancelled: AlertCircle
};

export function EnhancedPurchaseOrderDashboard() {
  const { purchaseOrders, suppliers, loading, approvePurchaseOrder, refetch } = usePurchaseOrders();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isReceivingOpen, setIsReceivingOpen] = useState(false);
  const [selectedPO, setSelectedPO] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Filtering states
  const [statusFilter, setStatusFilter] = useState('all');
  const [supplierFilter, setSupplierFilter] = useState('all');
  const [dateRange, setDateRange] = useState({ from: '', to: '' });
  const [searchTerm, setSearchTerm] = useState('');

  // Filter purchase orders
  const filteredPOs = purchaseOrders.filter(po => {
    const matchesStatus = statusFilter === 'all' || po.status === statusFilter;
    const matchesSupplier = supplierFilter === 'all' || po.supplier_id === supplierFilter;
    const matchesSearch = !searchTerm || 
      po.po_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      po.supplier?.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDateRange = (!dateRange.from || po.order_date >= dateRange.from) &&
                            (!dateRange.to || po.order_date <= dateRange.to);
    
    return matchesStatus && matchesSupplier && matchesSearch && matchesDateRange;
  });

  // Calculate analytics
  const totalValue = filteredPOs.reduce((sum, po) => sum + (po.total_amount || 0), 0);
  const pendingApprovals = filteredPOs.filter(po => po.status === 'pending_approval').length;
  const pendingReceipts = filteredPOs.filter(po => po.status === 'ordered').length;
  const partialReceipts = filteredPOs.filter(po => po.status === 'partially_received').length;

  const handleStatusAction = async (id: string, action: string) => {
    if (action === 'approve') {
      await approvePurchaseOrder(id);
    } else if (action === 'receive') {
      const po = purchaseOrders.find(p => p.id === id);
      setSelectedPO(po);
      setIsReceivingOpen(true);
    }
  };

  const getStatusIcon = (status: string) => {
    const Icon = statusIcons[status as keyof typeof statusIcons] || AlertCircle;
    return <Icon className="h-4 w-4" />;
  };

  const exportToPDF = () => {
    // Implementation for PDF export
    console.log('Exporting to PDF...');
  };

  if (loading) {
    return <div className="p-6">Loading purchase orders...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Purchase Orders Management</h1>
          <p className="text-muted-foreground">
            Manage purchase orders, receiving, and supplier relationships
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            New Purchase Order
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="quotations">Quotations</TabsTrigger>
          <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
          <TabsTrigger value="receiving">Receiving</TabsTrigger>
          <TabsTrigger value="suppliers">Suppliers</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audit-trail">Audit Trail</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total PO Value</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalValue.toLocaleString()}</div>
                <p className="text-xs text-muted-foreground">
                  {filteredPOs.length} active purchase orders
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
                <AlertCircle className="h-4 w-4 text-yellow-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingApprovals}</div>
                <p className="text-xs text-muted-foreground">
                  Requiring approval
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Pending Receipts</CardTitle>
                <Package className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{pendingReceipts}</div>
                <p className="text-xs text-muted-foreground">
                  Awaiting delivery
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Suppliers</CardTitle>
                <Users className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{suppliers.length}</div>
                <p className="text-xs text-muted-foreground">
                  Registered suppliers
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Purchase Orders */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Purchase Orders</CardTitle>
              <CardDescription>Latest purchase order activity</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.slice(0, 5).map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.supplier?.supplier_name || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(po.order_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[po.status as keyof typeof statusColors]}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(po.status)}
                            {po.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>${po.total_amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {po.status === 'pending_approval' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusAction(po.id!, 'approve')}
                            >
                              Approve
                            </Button>
                          )}
                          {(po.status === 'ordered' || po.status === 'partially_received') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusAction(po.id!, 'receive')}
                            >
                              Receive
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="quotations">
          <QuotationManager />
        </TabsContent>

        <TabsContent value="purchase-orders" className="space-y-6">
          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filters & Search
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <Input
                  placeholder="Search PO number or supplier..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="ordered">Ordered</SelectItem>
                    <SelectItem value="partially_received">Partially Received</SelectItem>
                    <SelectItem value="received">Received</SelectItem>
                    <SelectItem value="cancelled">Cancelled</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Suppliers" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Suppliers</SelectItem>
                    {suppliers.map((supplier) => (
                      <SelectItem key={supplier.id} value={supplier.id}>
                        {supplier.supplier_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="date"
                  placeholder="From Date"
                  value={dateRange.from}
                  onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                />
                <Input
                  type="date"
                  placeholder="To Date"
                  value={dateRange.to}
                  onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          {/* Purchase Orders Table */}
          <Card>
            <CardHeader>
              <CardTitle>Purchase Orders ({filteredPOs.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Expected Delivery</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs.map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.supplier?.supplier_name || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(po.order_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {po.expected_delivery_date ? 
                          format(new Date(po.expected_delivery_date), 'MMM dd, yyyy') : 
                          'Not set'
                        }
                      </TableCell>
                      <TableCell>
                        <Badge className={statusColors[po.status as keyof typeof statusColors]}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(po.status)}
                            {po.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>${po.total_amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          {po.status === 'pending_approval' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusAction(po.id!, 'approve')}
                            >
                              Approve
                            </Button>
                          )}
                          {(po.status === 'ordered' || po.status === 'partially_received') && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusAction(po.id!, 'receive')}
                            >
                              Receive
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="receiving">
          <Card>
            <CardHeader>
              <CardTitle>Pending Receipts</CardTitle>
              <CardDescription>Purchase orders ready for receiving</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>PO Number</TableHead>
                    <TableHead>Supplier</TableHead>
                    <TableHead>Order Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total Amount</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPOs
                    .filter(po => po.status === 'ordered' || po.status === 'partially_received')
                    .map((po) => (
                    <TableRow key={po.id}>
                      <TableCell className="font-medium">{po.po_number}</TableCell>
                      <TableCell>{po.supplier?.supplier_name || 'N/A'}</TableCell>
                      <TableCell>{format(new Date(po.order_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        <Badge className={statusColors[po.status as keyof typeof statusColors]}>
                          <div className="flex items-center gap-1">
                            {getStatusIcon(po.status)}
                            {po.status}
                          </div>
                        </Badge>
                      </TableCell>
                      <TableCell>${po.total_amount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleStatusAction(po.id!, 'receive')}
                        >
                          Process Receipt
                        </Button>
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

        <TabsContent value="documents">
          <DocumentManager />
        </TabsContent>

        <TabsContent value="communication">
          <SupplierCommunication />
        </TabsContent>

        <TabsContent value="analytics">
          <ProcurementAnalytics purchaseOrders={filteredPOs} suppliers={suppliers} />
        </TabsContent>

        <TabsContent value="audit-trail">
          <PurchaseOrderAuditTrail />
        </TabsContent>
      </Tabs>

      <PurchaseOrderModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        purchaseOrder={null}
      />

      <PurchaseOrderReceiving
        isOpen={isReceivingOpen}
        onClose={() => setIsReceivingOpen(false)}
        purchaseOrder={selectedPO}
        onUpdate={() => {
          refetch();
          setIsReceivingOpen(false);
        }}
      />
    </div>
  );
}