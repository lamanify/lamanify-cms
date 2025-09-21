import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Package,
  Search, 
  Calendar,
  TrendingUp,
  ArrowUpDown,
  Eye,
  Plus,
  BarChart3
} from 'lucide-react';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useMedications } from '@/hooks/useMedications';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO, differenceInDays } from 'date-fns';

interface BatchInfo {
  id: string;
  medication_id: string;
  medication_name: string;
  batch_number: string;
  expiry_date: string;
  current_quantity: number;
  received_quantity: number;
  dispensed_quantity: number;
  adjusted_quantity: number;
  unit_cost?: number;
  total_value: number;
  days_to_expiry: number;
  status: 'good' | 'warning' | 'expiring_soon' | 'expired';
  first_received: string;
  last_movement: string;
}

interface BatchMovement {
  id: string;
  movement_type: string;
  quantity: number;
  reason?: string;
  created_at: string;
  created_by?: string;
  unit_cost?: number;
}

export function BatchInventoryManager() {
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMedication, setSelectedMedication] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('expiry_date');
  const [batches, setBatches] = useState<BatchInfo[]>([]);
  const [selectedBatch, setSelectedBatch] = useState<BatchInfo | null>(null);
  const [batchMovements, setBatchMovements] = useState<BatchMovement[]>([]);
  const [loading, setLoading] = useState(true);

  const { stockMovements, createStockMovement } = useStockMovements();
  const { medications } = useMedications();
  const { toast } = useToast();

  useEffect(() => {
    processBatchData();
  }, [stockMovements, medications]);

  const processBatchData = () => {
    setLoading(true);
    
    // Group movements by medication and batch
    const batchMap = new Map<string, {
      medication_id: string;
      batch_number: string;
      expiry_date: string;
      movements: any[];
      unit_cost?: number;
    }>();

    stockMovements.forEach(movement => {
      if (movement.batch_number && movement.expiry_date) {
        const key = `${movement.medication_id}-${movement.batch_number}`;
        
        if (!batchMap.has(key)) {
          batchMap.set(key, {
            medication_id: movement.medication_id,
            batch_number: movement.batch_number,
            expiry_date: movement.expiry_date,
            movements: [],
            unit_cost: movement.unit_cost
          });
        }
        
        batchMap.get(key)!.movements.push(movement);
      }
    });

    // Convert to batch info objects
    const batchList: BatchInfo[] = [];
    const today = new Date();

    batchMap.forEach(batch => {
      const medication = medications.find(m => m.id === batch.medication_id);
      
      // Calculate quantities
      let receivedQty = 0;
      let dispensedQty = 0;
      let adjustedQty = 0;
      let currentQty = 0;
      
      batch.movements.forEach(movement => {
        switch (movement.movement_type) {
          case 'receipt':
            receivedQty += movement.quantity;
            currentQty += movement.quantity;
            break;
          case 'dispensed':
          case 'expired':
          case 'damaged':
            dispensedQty += movement.quantity;
            currentQty -= movement.quantity;
            break;
          case 'adjustment':
            if (movement.quantity > 0) {
              currentQty += movement.quantity;
            } else {
              currentQty += movement.quantity; // adjustment can be negative
            }
            adjustedQty += Math.abs(movement.quantity);
            break;
        }
      });

      if (currentQty > 0) { // Only show batches with remaining quantity
        const expiryDate = parseISO(batch.expiry_date);
        const daysToExpiry = differenceInDays(expiryDate, today);
        
        let status: BatchInfo['status'] = 'good';
        if (daysToExpiry < 0) {
          status = 'expired';
        } else if (daysToExpiry <= 30) {
          status = 'expiring_soon';
        } else if (daysToExpiry <= 90) {
          status = 'warning';
        }

        const sortedMovements = batch.movements.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );

        batchList.push({
          id: `${batch.medication_id}-${batch.batch_number}`,
          medication_id: batch.medication_id,
          medication_name: medication?.name || 'Unknown',
          batch_number: batch.batch_number,
          expiry_date: batch.expiry_date,
          current_quantity: Math.max(0, currentQty),
          received_quantity: receivedQty,
          dispensed_quantity: dispensedQty,
          adjusted_quantity: adjustedQty,
          unit_cost: batch.unit_cost,
          total_value: Math.max(0, currentQty) * (batch.unit_cost || 0),
          days_to_expiry: daysToExpiry,
          status,
          first_received: sortedMovements[sortedMovements.length - 1]?.created_at || '',
          last_movement: sortedMovements[0]?.created_at || ''
        });
      }
    });

    // Sort batches
    batchList.sort((a, b) => {
      switch (sortBy) {
        case 'expiry_date':
          return new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime();
        case 'medication':
          return a.medication_name.localeCompare(b.medication_name);
        case 'quantity':
          return b.current_quantity - a.current_quantity;
        case 'value':
          return b.total_value - a.total_value;
        default:
          return 0;
      }
    });

    setBatches(batchList);
    setLoading(false);
  };

  const loadBatchMovements = (batch: BatchInfo) => {
    const movements = stockMovements
      .filter(m => m.medication_id === batch.medication_id && m.batch_number === batch.batch_number)
      .map(m => ({
        id: m.id,
        movement_type: m.movement_type,
        quantity: m.quantity,
        reason: m.reason,
        created_at: m.created_at,
        created_by: m.created_by,
        unit_cost: m.unit_cost
      }))
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    
    setBatchMovements(movements);
  };

  const getStatusBadge = (status: BatchInfo['status']) => {
    switch (status) {
      case 'expired':
        return <Badge variant="destructive">Expired</Badge>;
      case 'expiring_soon':
        return <Badge className="bg-orange-100 text-orange-800">Expiring Soon</Badge>;
      case 'warning':
        return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
      default:
        return <Badge variant="secondary">Good</Badge>;
    }
  };

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.medication_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batch.batch_number.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMedication = selectedMedication === 'all' || batch.medication_id === selectedMedication;
    return matchesSearch && matchesMedication;
  });

  const getBatchStats = () => {
    return {
      total: batches.length,
      expired: batches.filter(b => b.status === 'expired').length,
      expiring_soon: batches.filter(b => b.status === 'expiring_soon').length,
      warning: batches.filter(b => b.status === 'warning').length,
      total_value: batches.reduce((sum, b) => sum + b.total_value, 0),
      total_quantity: batches.reduce((sum, b) => sum + b.current_quantity, 0)
    };
  };

  const stats = getBatchStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            Batch Inventory Management
          </h2>
          <p className="text-muted-foreground">
            Track and manage medication inventory at batch level with FIFO optimization
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="batches">All Batches</TabsTrigger>
          <TabsTrigger value="fifo">FIFO Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <p className="text-sm text-muted-foreground">Total Batches</p>
              </CardContent>
            </Card>

            <Card className="border-red-200 bg-red-50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
                <p className="text-sm text-red-800">Expired</p>
              </CardContent>
            </Card>

            <Card className="border-orange-200 bg-orange-50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-orange-600">{stats.expiring_soon}</div>
                <p className="text-sm text-orange-800">Expiring Soon</p>
              </CardContent>
            </Card>

            <Card className="border-yellow-200 bg-yellow-50">
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-yellow-600">{stats.warning}</div>
                <p className="text-sm text-yellow-800">Warning</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-green-600">{stats.total_quantity}</div>
                <p className="text-sm text-muted-foreground">Total Units</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold text-purple-600">RM {stats.total_value.toFixed(0)}</div>
                <p className="text-sm text-muted-foreground">Total Value</p>
              </CardContent>
            </Card>
          </div>

          {/* FIFO Recommendations */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                FIFO Recommendations
              </CardTitle>
              <CardDescription>
                Medications with multiple batches - prioritize older stock first
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FIFORecommendations batches={batches} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="batches" className="space-y-4">
          {/* Filters */}
          <div className="flex gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by medication or batch number..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            
            <Select value={selectedMedication} onValueChange={setSelectedMedication}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by medication" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Medications</SelectItem>
                {medications.map(med => (
                  <SelectItem key={med.id} value={med.id}>{med.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-48">
                <ArrowUpDown className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="expiry_date">Expiry Date</SelectItem>
                <SelectItem value="medication">Medication</SelectItem>
                <SelectItem value="quantity">Quantity</SelectItem>
                <SelectItem value="value">Value</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>All Batches ({filteredBatches.length})</CardTitle>
              <CardDescription>Detailed view of all batch inventory</CardDescription>
            </CardHeader>
            <CardContent>
              <BatchTable 
                batches={filteredBatches}
                onViewDetails={(batch) => {
                  setSelectedBatch(batch);
                  loadBatchMovements(batch);
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="fifo">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                FIFO Implementation Guide
              </CardTitle>
              <CardDescription>
                First In, First Out recommendations for optimal inventory rotation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FIFORecommendations batches={batches} detailed={true} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Batch Details Dialog */}
      <Dialog open={!!selectedBatch} onOpenChange={(open) => !open && setSelectedBatch(null)}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Batch Details: {selectedBatch?.batch_number}</DialogTitle>
            <DialogDescription>
              Complete movement history for {selectedBatch?.medication_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedBatch && (
            <BatchDetailsView 
              batch={selectedBatch} 
              movements={batchMovements}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Component for FIFO recommendations
function FIFORecommendations({ batches, detailed = false }: { batches: BatchInfo[]; detailed?: boolean; }) {
  // Group by medication and find those with multiple batches
  const medicationBatches = batches.reduce((acc, batch) => {
    if (!acc[batch.medication_id]) {
      acc[batch.medication_id] = [];
    }
    acc[batch.medication_id].push(batch);
    return acc;
  }, {} as Record<string, BatchInfo[]>);

  const recommendations = Object.entries(medicationBatches)
    .filter(([, batches]) => batches.length > 1)
    .map(([medicationId, batches]) => {
      const sortedBatches = batches.sort((a, b) => 
        new Date(a.expiry_date).getTime() - new Date(b.expiry_date).getTime()
      );
      
      return {
        medication_id: medicationId,
        medication_name: sortedBatches[0].medication_name,
        batches: sortedBatches,
        oldest_batch: sortedBatches[0],
        total_quantity: sortedBatches.reduce((sum, b) => sum + b.current_quantity, 0)
      };
    });

  if (recommendations.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No FIFO recommendations needed</p>
        <p className="text-sm">All medications have single batches or optimal rotation</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {recommendations.slice(0, detailed ? undefined : 5).map(rec => (
        <div key={rec.medication_id} className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium">{rec.medication_name}</h4>
            <Badge variant="outline">{rec.batches.length} batches</Badge>
          </div>
          
          <div className="text-sm text-muted-foreground mb-2">
            <strong>Use first:</strong> Batch {rec.oldest_batch.batch_number} 
            (expires {format(parseISO(rec.oldest_batch.expiry_date), 'MMM dd, yyyy')})
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-sm">
            {rec.batches.slice(0, 3).map((batch, idx) => (
              <div key={batch.id} className={`p-2 rounded ${idx === 0 ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                <div className="font-medium">Batch {batch.batch_number}</div>
                <div className={idx === 0 ? 'text-green-600' : 'text-muted-foreground'}>
                  {batch.current_quantity} units
                </div>
                <div className="text-xs">
                  {format(parseISO(batch.expiry_date), 'MMM yyyy')}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Component for batch table
function BatchTable({ batches, onViewDetails }: { 
  batches: BatchInfo[]; 
  onViewDetails: (batch: BatchInfo) => void;
}) {
  if (batches.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No batches found</p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Medication</TableHead>
            <TableHead>Batch Number</TableHead>
            <TableHead>Current Qty</TableHead>
            <TableHead>Expiry Date</TableHead>
            <TableHead>Days to Expiry</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Value</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {batches.map(batch => (
            <TableRow key={batch.id}>
              <TableCell className="font-medium">{batch.medication_name}</TableCell>
              <TableCell>{batch.batch_number}</TableCell>
              <TableCell>{batch.current_quantity}</TableCell>
              <TableCell>{format(parseISO(batch.expiry_date), 'MMM dd, yyyy')}</TableCell>
              <TableCell>
                <span className={batch.days_to_expiry < 0 ? 'text-red-600 font-medium' : 
                               batch.days_to_expiry <= 30 ? 'text-orange-600 font-medium' : ''}>
                  {batch.days_to_expiry < 0 ? 
                    `${Math.abs(batch.days_to_expiry)} days ago` : 
                    `${batch.days_to_expiry} days`}
                </span>
              </TableCell>
              <TableCell>
                <Badge 
                  variant={batch.status === 'expired' ? 'destructive' : 
                          batch.status === 'expiring_soon' ? 'secondary' : 'outline'}
                  className={batch.status === 'expiring_soon' ? 'bg-orange-100 text-orange-800' :
                            batch.status === 'warning' ? 'bg-yellow-100 text-yellow-800' : ''}
                >
                  {batch.status.replace('_', ' ')}
                </Badge>
              </TableCell>
              <TableCell>RM {batch.total_value.toFixed(2)}</TableCell>
              <TableCell>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onViewDetails(batch)}
                  className="gap-2"
                >
                  <Eye className="h-4 w-4" />
                  Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// Component for batch details view
function BatchDetailsView({ batch, movements }: { batch: BatchInfo; movements: BatchMovement[]; }) {
  return (
    <div className="space-y-6">
      {/* Batch Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div>
          <p className="text-sm text-muted-foreground">Current Quantity</p>
          <p className="text-2xl font-bold">{batch.current_quantity}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Received</p>
          <p className="text-2xl font-bold text-green-600">{batch.received_quantity}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Dispensed</p>
          <p className="text-2xl font-bold text-blue-600">{batch.dispensed_quantity}</p>
        </div>
        <div>
          <p className="text-sm text-muted-foreground">Total Value</p>
          <p className="text-2xl font-bold text-purple-600">RM {batch.total_value.toFixed(2)}</p>
        </div>
      </div>

      {/* Movement History */}
      <div>
        <h4 className="font-medium mb-4">Movement History</h4>
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>By</TableHead>
                <TableHead>Unit Cost</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {movements.map(movement => (
                <TableRow key={movement.id}>
                  <TableCell>{format(parseISO(movement.created_at), 'MMM dd, yyyy HH:mm')}</TableCell>
                  <TableCell>
                    <Badge variant={movement.movement_type === 'receipt' ? 'secondary' : 'outline'}>
                      {movement.movement_type}
                    </Badge>
                  </TableCell>
                  <TableCell>{movement.quantity}</TableCell>
                  <TableCell className="max-w-xs truncate" title={movement.reason}>
                    {movement.reason || '-'}
                  </TableCell>
                  <TableCell>{movement.created_by || 'System'}</TableCell>
                  <TableCell>
                    {movement.unit_cost ? `RM ${movement.unit_cost.toFixed(2)}` : '-'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}