import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Plus, 
  Package, 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle,
  Eye,
  Download,
  Search,
  Filter,
  Clock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { useStockMovements, StockMovement } from '@/hooks/useStockMovements';
import { useMedications } from '@/hooks/useMedications';

interface StockMovementFormData {
  medication_id: string;
  movement_type: 'receipt' | 'dispensed' | 'adjustment' | 'expired' | 'damaged' | 'wastage' | 'stock_take' | 'transfer_out' | 'transfer_in';
  quantity: number;
  reason: string;
  reference_number?: string;
  supplier_name?: string;
  batch_number?: string;
  expiry_date?: string;
  unit_cost?: number;
  notes?: string;
}

export function StockMovementManager() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [movementType, setMovementType] = useState<'receipt' | 'dispensed' | 'adjustment' | 'wastage' | 'stock_take' | 'transfer_out' | 'transfer_in'>('receipt');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: format(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  
  const { stockMovements, loading, createStockMovement, getStockSummary } = useStockMovements();
  const { medications } = useMedications();
  const { toast } = useToast();

  const [formData, setFormData] = useState<StockMovementFormData>({
    medication_id: '',
    movement_type: 'receipt',
    quantity: 0,
    reason: '',
    reference_number: '',
    supplier_name: '',
    batch_number: '',
    expiry_date: '',
    unit_cost: 0,
    notes: ''
  });

  // Filter movements based on search and filters
  const filteredMovements = stockMovements.filter(movement => {
    const matchesSearch = movement.medication?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.reference_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         movement.supplier_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || movement.movement_type === filterType;
    
    const movementDate = new Date(movement.created_at);
    const startDate = new Date(dateRange.start);
    const endDate = new Date(dateRange.end);
    const matchesDateRange = movementDate >= startDate && movementDate <= endDate;
    
    return matchesSearch && matchesType && matchesDateRange;
  });

  const openCreateDialog = (type: 'receipt' | 'dispensed' | 'adjustment' | 'wastage' | 'stock_take' | 'transfer_out' | 'transfer_in') => {
    setMovementType(type);
    setFormData({
      medication_id: '',
      movement_type: type,
      quantity: 0,
      reason: getDefaultReason(type),
      reference_number: '',
      supplier_name: '',
      batch_number: '',
      expiry_date: '',
      unit_cost: 0,
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const getDefaultReason = (type: string) => {
    switch (type) {
      case 'receipt': return 'Stock receipt from supplier';
      case 'dispensed': return 'Medication dispensed to patient';
      case 'adjustment': return 'Stock adjustment';
      case 'expired': return 'Expired medication removal';
      case 'damaged': return 'Damaged stock removal';
      case 'wastage': return 'Stock wastage';
      case 'stock_take': return 'Physical stock count';
      case 'transfer_out': return 'Stock transfer out';
      case 'transfer_in': return 'Stock transfer in';
      default: return '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.medication_id || formData.quantity <= 0) {
      toast({
        title: "Validation Error",
        description: "Please select a medication and enter a valid quantity.",
        variant: "destructive",
      });
      return;
    }

    const success = await createStockMovement(formData);
    if (success) {
      setIsDialogOpen(false);
      setFormData({
        medication_id: '',
        movement_type: 'receipt',
        quantity: 0,
        reason: '',
        reference_number: '',
        supplier_name: '',
        batch_number: '',
        expiry_date: '',
        unit_cost: 0,
        notes: ''
      });
    }
  };

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'receipt': return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'dispensed': return <TrendingDown className="h-4 w-4 text-blue-600" />;
      case 'adjustment': return <Package className="h-4 w-4 text-orange-600" />;
      case 'expired': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'damaged': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getMovementBadgeVariant = (type: string) => {
    switch (type) {
      case 'receipt': return 'default';
      case 'dispensed': return 'secondary';
      case 'adjustment': return 'outline';
      case 'expired': 
      case 'damaged': return 'destructive';
      default: return 'secondary';
    }
  };

  const stockSummary = getStockSummary();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Stock Movement Manager</h2>
          <p className="text-muted-foreground">
            Track inventory receipts, dispensing, and adjustments with comprehensive audit trail
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => openCreateDialog('adjustment')}>
            <Package className="h-4 w-4 mr-2" />
            Stock Adjustment
          </Button>
          <Button variant="outline" onClick={() => openCreateDialog('dispensed')}>
            <TrendingDown className="h-4 w-4 mr-2" />
            Record Dispensing
          </Button>
          <Button onClick={() => openCreateDialog('receipt')}>
            <TrendingUp className="h-4 w-4 mr-2" />
            Receive Stock
          </Button>
        </div>
      </div>

      {/* Stock Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stockSummary.totalItems}</div>
            <p className="text-xs text-muted-foreground">
              Items in inventory
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{stockSummary.lowStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Items below reorder point
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stockSummary.outOfStockCount}</div>
            <p className="text-xs text-muted-foreground">
              Items needing immediate attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">RM {stockSummary.totalValue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Estimated inventory value
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="movements" className="space-y-6">
        <TabsList>
          <TabsTrigger value="movements">Stock Movements</TabsTrigger>
          <TabsTrigger value="alerts">Stock Alerts</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>

        <TabsContent value="movements" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by medication, reference, or supplier..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[160px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="receipt">Receipts</SelectItem>
                    <SelectItem value="dispensed">Dispensed</SelectItem>
                    <SelectItem value="adjustment">Adjustments</SelectItem>
                    <SelectItem value="expired">Expired</SelectItem>
                    <SelectItem value="damaged">Damaged</SelectItem>
                    <SelectItem value="wastage">Wastage</SelectItem>
                    <SelectItem value="stock_take">Stock Take</SelectItem>
                    <SelectItem value="transfer_out">Transfer Out</SelectItem>
                    <SelectItem value="transfer_in">Transfer In</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-[140px]"
                  />
                  <Input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-[140px]"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stock Movements Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Stock Movements ({filteredMovements.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Loading stock movements...</div>
              ) : filteredMovements.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No stock movements found</p>
                  <p className="text-sm text-muted-foreground">
                    {searchTerm || filterType !== 'all' 
                      ? 'Try adjusting your filters' 
                      : 'Start by recording your first stock movement'
                    }
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date/Time</TableHead>
                        <TableHead>Medication</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>Supplier</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredMovements.map((movement) => (
                        <TableRow key={movement.id}>
                          <TableCell>
                            <div className="text-sm">
                              {format(new Date(movement.created_at), 'MMM dd, yyyy')}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(movement.created_at), 'HH:mm')}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{movement.medication?.name}</div>
                            <div className="text-xs text-muted-foreground">
                              {movement.medication?.unit_of_measure}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {getMovementIcon(movement.movement_type)}
                              <Badge variant={getMovementBadgeVariant(movement.movement_type)}>
                                {movement.movement_type.charAt(0).toUpperCase() + movement.movement_type.slice(1)}
                              </Badge>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className={`font-medium ${
                              movement.movement_type === 'receipt' ? 'text-green-600' : 
                              movement.movement_type === 'dispensed' ? 'text-blue-600' : 
                              'text-orange-600'
                            }`}>
                              {movement.movement_type === 'receipt' ? '+' : '-'}{movement.quantity}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{movement.reference_number || '-'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{movement.supplier_name || '-'}</div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{movement.created_by_profile?.first_name} {movement.created_by_profile?.last_name}</div>
                          </TableCell>
                          <TableCell>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Stock Alerts</CardTitle>
              <CardDescription>
                Monitor inventory levels and receive alerts for low stock items
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Stock alerts feature coming soon</p>
                <p className="text-sm">Automated notifications for low stock and reorder points</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inventory Reports</CardTitle>
              <CardDescription>
                Generate comprehensive inventory and stock movement reports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                <Download className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Advanced reporting features coming soon</p>
                <p className="text-sm">Stock aging, valuation, and movement analysis</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock Movement Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {movementType === 'receipt' && <TrendingUp className="h-5 w-5 text-green-600" />}
              {movementType === 'dispensed' && <TrendingDown className="h-5 w-5 text-blue-600" />}
              {movementType === 'adjustment' && <Package className="h-5 w-5 text-orange-600" />}
              {movementType === 'receipt' && 'Receive Stock'}
              {movementType === 'dispensed' && 'Record Dispensing'}
              {movementType === 'adjustment' && 'Stock Adjustment'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <Label htmlFor="medication">Medication *</Label>
                <Select value={formData.medication_id} onValueChange={(value) => setFormData(prev => ({ ...prev, medication_id: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select medication" />
                  </SelectTrigger>
                  <SelectContent>
                    {medications.map((medication) => (
                      <SelectItem key={medication.id} value={medication.id}>
                        <div className="flex justify-between w-full">
                          <span>{medication.name}</span>
                          <span className="text-xs text-muted-foreground ml-2">
                            Stock: {medication.stock_level || 0}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity *</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 0 }))}
                  placeholder="Enter quantity"
                  required
                />
              </div>

              <div>
                <Label htmlFor="reference">Reference Number</Label>
                <Input
                  id="reference"
                  value={formData.reference_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
                  placeholder={movementType === 'receipt' ? 'PO-2024-001' : 'REF-001'}
                />
              </div>

              {movementType === 'receipt' && (
                <>
                  <div>
                    <Label htmlFor="supplier">Supplier Name</Label>
                    <Input
                      id="supplier"
                      value={formData.supplier_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                      placeholder="Enter supplier name"
                    />
                  </div>

                  <div>
                    <Label htmlFor="batch">Batch Number</Label>
                    <Input
                      id="batch"
                      value={formData.batch_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
                      placeholder="Enter batch number"
                    />
                  </div>

                  <div>
                    <Label htmlFor="expiry">Expiry Date</Label>
                    <Input
                      id="expiry"
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    />
                  </div>

                  <div>
                    <Label htmlFor="unit_cost">Unit Cost (RM)</Label>
                    <Input
                      id="unit_cost"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.unit_cost || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, unit_cost: parseFloat(e.target.value) || 0 }))}
                      placeholder="0.00"
                    />
                  </div>
                </>
              )}
            </div>

            <div>
              <Label htmlFor="reason">Reason *</Label>
              <Input
                id="reason"
                value={formData.reason}
                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                placeholder="Enter reason for this movement"
                required
              />
            </div>

            <div>
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Optional additional information"
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit">
                Record Movement
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}