import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useClaimsReconciliation, ReconciliationRecord } from '@/hooks/useClaimsReconciliation';
import { AlertTriangle, CheckCircle, Clock, XCircle, Search, Filter } from 'lucide-react';

interface ReconciliationFilters {
  status?: string;
  variance_type?: string;
  panel_id?: string;
  date_from?: string;
  date_to?: string;
}

export const ClaimsReconciliationManager: React.FC = () => {
  const {
    reconciliations,
    categories,
    stats,
    loading,
    fetchReconciliations,
    updateReconciliationStatus,
    createApprovalRequest
  } = useClaimsReconciliation();

  const [filters, setFilters] = useState<ReconciliationFilters>({});
  const [selectedReconciliation, setSelectedReconciliation] = useState<ReconciliationRecord | null>(null);
  const [updateNotes, setUpdateNotes] = useState('');

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'investigating':
        return <Search className="h-4 w-4 text-blue-500" />;
      case 'escalated':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'written_off':
        return <XCircle className="h-4 w-4 text-gray-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getVarianceTypeBadge = (type: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      'none': 'secondary',
      'shortfall': 'destructive',
      'overpayment': 'outline',
      'partial_rejection': 'destructive',
      'full_rejection': 'destructive'
    };
    
    return (
      <Badge variant={variants[type] || 'default'}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const handleUpdateStatus = async (
    reconciliationId: string,
    status: string
  ) => {
    await updateReconciliationStatus(reconciliationId, status, {
      notes: updateNotes
    });
    setUpdateNotes('');
    setSelectedReconciliation(null);
  };

  const handleFilter = () => {
    fetchReconciliations(filters);
  };

  const clearFilters = () => {
    setFilters({});
    fetchReconciliations();
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Variances</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_variances}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pending_count}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Variance Amount</CardTitle>
              <XCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                ${Math.abs(stats.total_variance_amount).toFixed(2)}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Variance %</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {stats.avg_variance_percentage.toFixed(1)}%
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={filters.status || ''}
                onValueChange={(value) => setFilters({...filters, status: value || undefined})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="investigating">Investigating</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="escalated">Escalated</SelectItem>
                  <SelectItem value="written_off">Written Off</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="variance_type">Variance Type</Label>
              <Select
                value={filters.variance_type || ''}
                onValueChange={(value) => setFilters({...filters, variance_type: value || undefined})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All types</SelectItem>
                  <SelectItem value="shortfall">Shortfall</SelectItem>
                  <SelectItem value="overpayment">Overpayment</SelectItem>
                  <SelectItem value="partial_rejection">Partial Rejection</SelectItem>
                  <SelectItem value="full_rejection">Full Rejection</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="date_from">Date From</Label>
              <Input
                type="date"
                value={filters.date_from || ''}
                onChange={(e) => setFilters({...filters, date_from: e.target.value || undefined})}
              />
            </div>

            <div>
              <Label htmlFor="date_to">Date To</Label>
              <Input
                type="date"
                value={filters.date_to || ''}
                onChange={(e) => setFilters({...filters, date_to: e.target.value || undefined})}
              />
            </div>

            <div className="flex items-end gap-2">
              <Button onClick={handleFilter} className="flex-1">
                Apply Filters
              </Button>
              <Button variant="outline" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reconciliation Records Table */}
      <Card>
        <CardHeader>
          <CardTitle>Reconciliation Records</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Claim Number</TableHead>
                  <TableHead>Panel</TableHead>
                  <TableHead>Claim Amount</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead>Variance</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reconciliations.map((reconciliation) => (
                  <TableRow key={reconciliation.id}>
                    <TableCell className="font-medium">
                      {reconciliation.panel_claims?.claim_number}
                    </TableCell>
                    <TableCell>
                      {reconciliation.panel_claims?.panels?.name}
                    </TableCell>
                    <TableCell>
                      ${reconciliation.claim_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      ${reconciliation.received_amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className={`font-medium ${
                          reconciliation.variance_amount > 0 ? 'text-red-600' : 
                          reconciliation.variance_amount < 0 ? 'text-green-600' : 
                          'text-gray-600'
                        }`}>
                          ${Math.abs(reconciliation.variance_amount).toFixed(2)}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {reconciliation.variance_percentage.toFixed(1)}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getVarianceTypeBadge(reconciliation.variance_type)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(reconciliation.reconciliation_status)}
                        <span className="capitalize">
                          {reconciliation.reconciliation_status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(reconciliation.reconciliation_date).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => setSelectedReconciliation(reconciliation)}
                          >
                            Manage
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>Manage Reconciliation</DialogTitle>
                          </DialogHeader>
                          <ReconciliationDetailsDialog 
                            reconciliation={reconciliation}
                            categories={categories}
                            onStatusUpdate={handleUpdateStatus}
                            updateNotes={updateNotes}
                            setUpdateNotes={setUpdateNotes}
                          />
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {reconciliations.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              No reconciliation records found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

interface ReconciliationDetailsDialogProps {
  reconciliation: ReconciliationRecord;
  categories: any[];
  onStatusUpdate: (id: string, status: string) => void;
  updateNotes: string;
  setUpdateNotes: (notes: string) => void;
}

const ReconciliationDetailsDialog: React.FC<ReconciliationDetailsDialogProps> = ({
  reconciliation,
  categories,
  onStatusUpdate,
  updateNotes,
  setUpdateNotes
}) => {
  return (
    <div className="space-y-6">
      <Tabs defaultValue="details">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="actions">Actions</TabsTrigger>
        </TabsList>
        
        <TabsContent value="details" className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Claim Number</Label>
              <p className="font-medium">{reconciliation.panel_claims?.claim_number}</p>
            </div>
            <div>
              <Label>Panel</Label>
              <p>{reconciliation.panel_claims?.panels?.name}</p>
            </div>
            <div>
              <Label>Claim Amount</Label>
              <p>${reconciliation.claim_amount.toFixed(2)}</p>
            </div>
            <div>
              <Label>Received Amount</Label>
              <p>${reconciliation.received_amount.toFixed(2)}</p>
            </div>
            <div>
              <Label>Variance Amount</Label>
              <p className={`font-medium ${
                reconciliation.variance_amount > 0 ? 'text-red-600' : 
                reconciliation.variance_amount < 0 ? 'text-green-600' : 
                'text-gray-600'
              }`}>
                ${Math.abs(reconciliation.variance_amount).toFixed(2)} 
                ({reconciliation.variance_percentage.toFixed(1)}%)
              </p>
            </div>
            <div>
              <Label>Payment Date</Label>
              <p>{reconciliation.payment_date ? new Date(reconciliation.payment_date).toLocaleDateString() : 'N/A'}</p>
            </div>
          </div>

          {reconciliation.notes && (
            <div>
              <Label>Notes</Label>
              <p className="text-sm bg-gray-50 p-3 rounded">{reconciliation.notes}</p>
            </div>
          )}
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          <div>
            <Label htmlFor="status">Update Status</Label>
            <Select
              onValueChange={(value) => onStatusUpdate(reconciliation.id, value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="investigating">Mark as Investigating</SelectItem>
                <SelectItem value="resolved">Mark as Resolved</SelectItem>
                <SelectItem value="escalated">Escalate</SelectItem>
                <SelectItem value="written_off">Write Off</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="notes">Update Notes</Label>
            <Textarea
              value={updateNotes}
              onChange={(e) => setUpdateNotes(e.target.value)}
              placeholder="Add notes about this reconciliation update..."
              rows={3}
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};