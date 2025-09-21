import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Calendar,
  AlertTriangle, 
  Clock,
  Search,
  Filter,
  Package,
  Trash2,
  FileText
} from 'lucide-react';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useMedications } from '@/hooks/useMedications';
import { useToast } from '@/hooks/use-toast';
import { format, addDays, differenceInDays, isAfter, isBefore, parseISO } from 'date-fns';

interface ExpiryItem {
  id: string;
  medication_id: string;
  medication_name: string;
  batch_number?: string;
  expiry_date: string;
  quantity: number;
  days_to_expiry: number;
  status: 'expired' | 'expiring_soon' | 'warning' | 'good';
  unit_cost?: number;
  total_value: number;
}

export function ExpiryTrackingManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expiryItems, setExpiryItems] = useState<ExpiryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const { stockMovements, createStockMovement } = useStockMovements();
  const { medications } = useMedications();
  const { toast } = useToast();

  useEffect(() => {
    processExpiryData();
  }, [stockMovements, medications]);

  const processExpiryData = () => {
    setLoading(true);
    
    // Group stock movements by medication and batch with expiry dates
    const batchMap = new Map<string, {
      medication_id: string;
      batch_number?: string;
      expiry_date: string;
      total_quantity: number;
      unit_cost?: number;
    }>();

    stockMovements.forEach(movement => {
      if (movement.expiry_date) {
        const key = `${movement.medication_id}-${movement.batch_number || 'no-batch'}`;
        const existing = batchMap.get(key);
        
        if (existing) {
          // Update quantity based on movement type
          const quantityChange = ['receipt'].includes(movement.movement_type) 
            ? movement.quantity 
            : -movement.quantity;
          existing.total_quantity += quantityChange;
        } else {
          batchMap.set(key, {
            medication_id: movement.medication_id,
            batch_number: movement.batch_number,
            expiry_date: movement.expiry_date,
            total_quantity: ['receipt'].includes(movement.movement_type) 
              ? movement.quantity 
              : -movement.quantity,
            unit_cost: movement.unit_cost
          });
        }
      }
    });

    // Convert to expiry items with status calculation
    const items: ExpiryItem[] = [];
    const today = new Date();

    batchMap.forEach((batch, key) => {
      if (batch.total_quantity > 0) { // Only show items with positive quantity
        const medication = medications.find(m => m.id === batch.medication_id);
        const expiryDate = parseISO(batch.expiry_date);
        const daysToExpiry = differenceInDays(expiryDate, today);
        
        let status: ExpiryItem['status'] = 'good';
        if (daysToExpiry < 0) {
          status = 'expired';
        } else if (daysToExpiry <= 30) {
          status = 'expiring_soon';
        } else if (daysToExpiry <= 90) {
          status = 'warning';
        }

        items.push({
          id: key,
          medication_id: batch.medication_id,
          medication_name: medication?.name || 'Unknown',
          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date,
          quantity: batch.total_quantity,
          days_to_expiry: daysToExpiry,
          status,
          unit_cost: batch.unit_cost,
          total_value: (batch.unit_cost || 0) * batch.total_quantity
        });
      }
    });

    // Sort by expiry date (earliest first)
    items.sort((a, b) => new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime());
    
    setExpiryItems(items);
    setLoading(false);
  };

  const handleExpiredRemoval = async (item: ExpiryItem) => {
    const success = await createStockMovement({
      medication_id: item.medication_id,
      movement_type: 'expired',
      quantity: item.quantity,
      reason: `Expired medication removal - Batch: ${item.batch_number || 'N/A'}`,
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      unit_cost: item.unit_cost
    });

    if (success) {
      toast({
        title: "Expired Item Removed",
        description: `${item.medication_name} (${item.quantity} units) removed from inventory.`
      });
      processExpiryData(); // Refresh data
    }
  };

  const getStatusBadge = (status: ExpiryItem['status']) => {
    switch (status) {
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Expiring Soon</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Warning</Badge>;
      default:
        return <Badge variant="secondary">Good</Badge>;
    }
  };

  const getStatusColor = (status: ExpiryItem['status']) => {
    switch (status) {
      case 'expired': return 'text-red-600';
      case 'expiring_soon': return 'text-orange-600';
      case 'warning': return 'text-yellow-600';
      default: return 'text-green-600';
    }
  };

  const filteredItems = expiryItems.filter(item => {
    const matchesSearch = item.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (item.batch_number && item.batch_number.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesFilter = filterStatus === 'all' || item.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  const getStatusCounts = () => {
    return {
      expired: expiryItems.filter(item => item.status === 'expired').length,
      expiring_soon: expiryItems.filter(item => item.status === 'expiring_soon').length,
      warning: expiryItems.filter(item => item.status === 'warning').length,
      total: expiryItems.length
    };
  };

  const statusCounts = getStatusCounts();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" />
            Expiry Date Management
          </h2>
          <p className="text-muted-foreground">
            Monitor and manage medication expiry dates with batch-level tracking
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="expired">Expired Items</TabsTrigger>
          <TabsTrigger value="expiring">Expiring Soon</TabsTrigger>
          <TabsTrigger value="all">All Items</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-4">
            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-red-600">{statusCounts.expired}</p>
                    <p className="text-sm font-medium text-red-800">Expired Items</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-orange-600">{statusCounts.expiring_soon}</p>
                    <p className="text-sm font-medium text-orange-800">Expiring Soon</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <Package className="h-8 w-8 text-yellow-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-yellow-600">{statusCounts.warning}</p>
                    <p className="text-sm font-medium text-yellow-800">Warning (≤90 days)</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <FileText className="h-8 w-8 text-blue-600" />
                  <div className="ml-4">
                    <p className="text-2xl font-bold text-blue-600">{statusCounts.total}</p>
                    <p className="text-sm font-medium text-muted-foreground">Total Tracked</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Critical Items List */}
          {statusCounts.expired > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-red-600">Critical: Expired Items</CardTitle>
                <CardDescription>These items have already expired and need immediate attention</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {expiryItems.filter(item => item.status === 'expired').slice(0, 5).map(item => (
                    <div key={item.id} className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-200">
                      <div>
                        <p className="font-medium">{item.medication_name}</p>
                        <p className="text-sm text-muted-foreground">
                          Batch: {item.batch_number || 'N/A'} • Qty: {item.quantity} • 
                          Expired {Math.abs(item.days_to_expiry)} days ago
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleExpiredRemoval(item)}
                        className="gap-2"
                      >
                        <Trash2 className="h-4 w-4" />
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expired">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">Expired Items</CardTitle>
              <CardDescription>Items that have passed their expiry date</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpiryItemsList 
                items={expiryItems.filter(item => item.status === 'expired')}
                onRemove={handleExpiredRemoval}
                showRemoveAction={true}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expiring">
          <Card>
            <CardHeader>
              <CardTitle className="text-orange-600">Expiring Soon (≤30 days)</CardTitle>
              <CardDescription>Items that will expire within the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpiryItemsList 
                items={expiryItems.filter(item => item.status === 'expiring_soon')}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by medication name or batch number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-48">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="expired">Expired</SelectItem>
                <SelectItem value="expiring_soon">Expiring Soon</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="good">Good</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Expiry Tracked Items</CardTitle>
              <CardDescription>Complete list of items with expiry date tracking</CardDescription>
            </CardHeader>
            <CardContent>
              <ExpiryItemsList 
                items={filteredItems}
                onRemove={handleExpiredRemoval}
                showRemoveAction={false}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Separate component for the items list to avoid duplication
function ExpiryItemsList({ 
  items, 
  onRemove, 
  showRemoveAction = false 
}: { 
  items: ExpiryItem[];
  onRemove?: (item: ExpiryItem) => void;
  showRemoveAction?: boolean;
}) {
  const getStatusBadge = (status: ExpiryItem['status']) => {
    switch (status) {
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">Expiring Soon</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-200">Warning</Badge>;
      default:
        return <Badge variant="secondary">Good</Badge>;
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No items found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medication</TableHead>
            <TableHead>Batch</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Days to Expiry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Value</TableHead>
            {showRemoveAction && <TableHead>Action</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map(item => (
            <TableRow key={item.id}>
              <TableCell className="font-medium">{item.medication_name}</TableCell>
              <TableCell>{item.batch_number || '-'}</TableCell>
              <TableCell>{item.quantity}</TableCell>
              <TableCell>{format(parseISO(item.expiry_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                <span className={item.days_to_expiry < 0 ? 'text-red-600 font-medium' : 
                               item.days_to_expiry <= 30 ? 'text-orange-600 font-medium' : ''}>
                  {item.days_to_expiry < 0 ? 
                    `${Math.abs(item.days_to_expiry)} days ago` : 
                    `${item.days_to_expiry} days`}
                </span>
              </TableCell>
              <TableCell>{getStatusBadge(item.status)}</TableCell>
              <TableCell>RM {item.total_value.toFixed(2)}</TableCell>
              {showRemoveAction && (
                <TableCell>
                  {item.status === 'expired' && onRemove && (
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => onRemove(item)}
                      className="gap-2"
                    >
                      <Trash2 className="h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </TableCell>
              )}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}