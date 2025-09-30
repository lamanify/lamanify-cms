import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, FileText, Search, Eye } from 'lucide-react';
import { useBillingRecords, BillingRecord } from '@/hooks/useBillingRecords';
import { usePanels } from '@/hooks/usePanels';
import { BatchStatusUpdateModal } from '@/components/panel/BatchStatusUpdateModal';
import { ClaimStatus, OUTSTANDING_STATUS_OPTIONS, STATUS_CONFIG } from '@/domain/panel';
import { format } from 'date-fns';

export default function OutstandingPanelBilling() {
  const { billingRecords, loading, fetchBillingRecords, batchUpdateBillingStatus } = useBillingRecords({
    payer: 'panel',
    status: 'outstanding'
  });
  const { panels } = usePanels();
  const [searchTerm, setSearchTerm] = useState('');
  const [panelFilter, setPanelFilter] = useState<string>('all');
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchStatus, setBatchStatus] = useState<ClaimStatus | null>(null);

  const filteredRecords = billingRecords.filter(record => {
    const matchesSearch = 
      record.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.panel?.panel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${record.patient?.first_name} ${record.patient?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPanel = panelFilter === 'all' || record.panel_id === panelFilter;
    
    return matchesSearch && matchesPanel;
  });

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'pending': return 'secondary';
      case 'unpaid': return 'destructive';
      case 'partial': return 'default';
      default: return 'secondary';
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRecords(filteredRecords.map(record => record.id));
    } else {
      setSelectedRecords([]);
    }
  };

  const handleSelectRecord = (recordId: string, checked: boolean) => {
    if (checked) {
      setSelectedRecords(prev => [...prev, recordId]);
    } else {
      setSelectedRecords(prev => prev.filter(id => id !== recordId));
    }
  };

  const handleUpdateClaimStatus = () => {
    if (selectedRecords.length === 0) return;
    setBatchStatus('submitted');
    setShowBatchModal(true);
  };

  const handleBatchConfirm = async (data: { reason?: string; paidAmount?: number }) => {
    if (batchStatus) {
      const updates: any = { claimStatus: batchStatus };
      
      if (data.reason) {
        updates.reason = data.reason;
      }
      
      if (data.paidAmount !== undefined) {
        updates.paidAmount = data.paidAmount;
      }

      // Determine billing status based on claim status
      let billingStatus = 'pending';
      if (batchStatus === 'paid') {
        billingStatus = 'paid';
      } else if (batchStatus === 'short_paid') {
        billingStatus = 'partial';
      }

      await batchUpdateBillingStatus(selectedRecords, billingStatus, updates);
      
      setSelectedRecords([]);
      setShowBatchModal(false);
      setBatchStatus(null);
      fetchBillingRecords();
    }
  };

  const isAllSelected = filteredRecords.length > 0 && selectedRecords.length === filteredRecords.length;
  const isIndeterminate = selectedRecords.length > 0 && selectedRecords.length < filteredRecords.length;

  const totalOutstanding = filteredRecords.reduce((sum, record) => sum + record.amount, 0);
  const selectedAmount = filteredRecords
    .filter(r => selectedRecords.includes(r.id))
    .reduce((sum, record) => sum + record.amount, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Outstanding Invoices</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredRecords.length}</div>
            <p className="text-xs text-muted-foreground">
              Total value: ${totalOutstanding.toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unpaid</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredRecords.filter(r => r.status === 'unpaid').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Value: ${filteredRecords.filter(r => r.status === 'unpaid').reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Partial Payment</CardTitle>
            <div className="h-4 w-4 rounded-full bg-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredRecords.filter(r => r.status === 'partial').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Value: ${filteredRecords.filter(r => r.status === 'partial').reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Outstanding Panel Billing</CardTitle>
              <CardDescription>Manage outstanding panel invoices and claims</CardDescription>
            </div>
            {selectedRecords.length > 0 && (
              <Button onClick={handleUpdateClaimStatus}>
                Update Claim Status ({selectedRecords.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search invoices..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={panelFilter} onValueChange={setPanelFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Panel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Panels</SelectItem>
                {panels.map((panel) => (
                  <SelectItem key={panel.id} value={panel.id}>
                    {panel.panel_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Selection Info */}
          {selectedRecords.length > 0 && (
            <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <span className="font-semibold">{selectedRecords.length}</span> invoice(s) selected
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Total: <span className="font-semibold">${selectedAmount.toFixed(2)}</span>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setSelectedRecords([])}>
                  Clear Selection
                </Button>
              </div>
            </div>
          )}

          {/* Invoices Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all invoices"
                    />
                  </TableHead>
                  <TableHead>Invoice Number</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Panel</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Claim Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading billing records...
                    </TableCell>
                  </TableRow>
                ) : filteredRecords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No outstanding panel invoices found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRecords.includes(record.id)}
                          onCheckedChange={(checked) => handleSelectRecord(record.id, checked as boolean)}
                          aria-label={`Select invoice ${record.invoice_number}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{record.invoice_number}</TableCell>
                      <TableCell>
                        {record.patient?.first_name} {record.patient?.last_name}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{record.panel?.panel_name}</div>
                          <div className="text-sm text-muted-foreground">{record.panel?.panel_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>${record.amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge variant={getStatusBadgeVariant(record.status)}>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(record.due_date), 'MMM dd, yyyy')}</TableCell>
                      <TableCell>
                        {record.claim_status ? (
                          <Badge 
                            variant="outline"
                            className={STATUS_CONFIG[record.claim_status as ClaimStatus]?.color}
                          >
                            {STATUS_CONFIG[record.claim_status as ClaimStatus]?.label || record.claim_status}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Not claimed</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Batch Status Update Modal */}
      {showBatchModal && batchStatus && (
        <BatchStatusUpdateModal
          open={showBatchModal}
          onOpenChange={setShowBatchModal}
          selectedClaims={selectedRecords.map(id => {
            const record = filteredRecords.find(r => r.id === id);
            return {
              id: record?.id || '',
              claim_number: record?.invoice_number || '',
              panel_id: record?.panel_id || '',
              total_amount: record?.amount || 0,
              status: (record?.claim_status as ClaimStatus) || 'submitted',
              created_at: record?.created_at || '',
              panel: record?.panel,
            };
          }) as any}
          newStatus={batchStatus}
          onConfirm={handleBatchConfirm}
          allowedStatuses={OUTSTANDING_STATUS_OPTIONS}
        />
      )}
    </div>
  );
}
