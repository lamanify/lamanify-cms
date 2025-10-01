import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, FileText, Plus, Search, Eye, Download, Send } from 'lucide-react';
import { usePanelClaims, PanelClaim } from '@/hooks/usePanelClaims';
import { usePanels } from '@/hooks/usePanels';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from '@/hooks/use-toast';
import { CreateClaimModal } from './CreateClaimModal';
import { ClaimDetailsModal } from './ClaimDetailsModal';
import { PanelClaimsExportManager } from './PanelClaimsExportManager';
import { ClaimsIntegrationManager } from './ClaimsIntegrationManager';
import { BulkActionToolbar } from './BulkActionToolbar';
import { BatchStatusUpdateModal } from './BatchStatusUpdateModal';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { Totals, ALLOWED_TRANSITIONS, isValidTransition, coercePaidToShortPaid } from '@/domain/panel';
import { PanelClaimsFooterSummary } from './PanelClaimsFooterSummary';

interface PanelClaimsDashboardProps {
  onViewClaim?: (claimId: string) => void;
}

export function PanelClaimsDashboard({ onViewClaim }: PanelClaimsDashboardProps = {}) {
  const { claims, loading, fetchClaims, updateClaimStatus } = usePanelClaims();
  const { panels } = usePanels();
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [panelFilter, setPanelFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<PanelClaim | null>(null);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [showIntegrationManager, setShowIntegrationManager] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchStatus, setBatchStatus] = useState<PanelClaim['status'] | null>(null);

  const filteredClaims = useMemo(() => {
    return claims.filter(claim => {
      const matchesSearch = claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           claim.panel?.panel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           claim.panel?.panel_code.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Handle multi-status filter for "Outstanding Only"
      const matchesStatus = statusFilter === 'all' || 
                           statusFilter === claim.status ||
                           (statusFilter === 'submitted,approved,short_paid' && 
                            ['submitted', 'approved', 'short_paid'].includes(claim.status));
      
      const matchesPanel = panelFilter === 'all' || claim.panel_id === panelFilter;
      
      return matchesSearch && matchesStatus && matchesPanel;
    });
  }, [claims, searchTerm, statusFilter, panelFilter]);

  const getStatusBadgeVariant = (status: PanelClaim['status']) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'submitted': return 'default';
      case 'approved': return 'default';
      case 'paid': return 'default';
      case 'short_paid': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: PanelClaim['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'paid': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400';
      case 'short_paid': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  // Calculate status counts for tab indicators
  const statusCounts = useMemo(() => {
    return {
      all: claims.length,
      draft: claims.filter(c => c.status === 'draft').length,
      submitted: claims.filter(c => c.status === 'submitted').length,
      approved: claims.filter(c => c.status === 'approved').length,
      rejected: claims.filter(c => c.status === 'rejected').length,
      paid: claims.filter(c => c.status === 'paid').length,
      short_paid: claims.filter(c => c.status === 'short_paid').length,
    };
  }, [claims]);

  const handleStatusChange = async (claimId: string, newStatus: PanelClaim['status']) => {
    await updateClaimStatus(claimId, newStatus);
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClaims(filteredClaims.map(claim => claim.id));
    } else {
      setSelectedClaims([]);
    }
  };

  const handleSelectClaim = (claimId: string, checked: boolean) => {
    if (checked) {
      setSelectedClaims(prev => [...prev, claimId]);
    } else {
      setSelectedClaims(prev => prev.filter(id => id !== claimId));
    }
  };

  const handleBulkStatusChange = (newStatus: PanelClaim['status']) => {
    setBatchStatus(newStatus);
    setShowBatchModal(true);
  };

  const handleBatchConfirm = async (data: { reason?: string; paidAmount?: number }) => {
    if (batchStatus) {
      const skippedClaims: Array<{ claimNumber: string; reason: string }> = [];
      let successCount = 0;

      // Process each selected claim
      for (const claimId of selectedClaims) {
        const claim = filteredClaims.find(c => c.id === claimId);
        if (!claim) continue;

        // Determine target status (with per-claim coercion for paid status)
        let targetStatus = batchStatus;
        if (batchStatus === 'paid' && data.paidAmount !== undefined) {
          targetStatus = coercePaidToShortPaid(claim.total_amount, data.paidAmount);
        }

        // Validate transition
        if (!isValidTransition(claim.status, targetStatus)) {
          skippedClaims.push({
            claimNumber: claim.claim_number,
            reason: `Invalid transition from ${claim.status} to ${targetStatus}`
          });
          continue;
        }

        try {
          await updateClaimStatus(claimId, targetStatus, data);
          successCount++;
        } catch (error) {
          skippedClaims.push({
            claimNumber: claim.claim_number,
            reason: 'Update failed'
          });
        }
      }

      // Show feedback toast
      if (skippedClaims.length > 0) {
        toast({
          title: `Batch Update: ${successCount} succeeded, ${skippedClaims.length} skipped`,
          description: skippedClaims.map(s => `${s.claimNumber}: ${s.reason}`).join('\n'),
          variant: 'default'
        });
      } else {
        toast({
          title: 'Batch Update Successful',
          description: `${successCount} claim(s) updated successfully`
        });
      }

      // Reset selections and close modal
      setSelectedClaims([]);
      setShowBatchModal(false);
      setBatchStatus(null);
      fetchClaims();
    }
  };

  const isAllSelected = filteredClaims.length > 0 && selectedClaims.length === filteredClaims.length;
  const isIndeterminate = selectedClaims.length > 0 && selectedClaims.length < filteredClaims.length;

  const totals = useMemo(() => {
    return claims.reduce<Totals>((acc, claim) => {
      acc[claim.status] = (acc[claim.status] ?? 0) + claim.total_amount;
      acc.count = (acc.count ?? 0) + 1;
      return acc;
    }, { count: 0 });
  }, [claims]);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Claims</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{claims.length}</div>
            <p className="text-xs text-muted-foreground">
              Total value: {formatCurrency(claims.reduce((sum, claim) => sum + claim.total_amount, 0))}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Claims</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter(c => c.status === 'submitted').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Value: {formatCurrency(totals.submitted || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved Claims</CardTitle>
            <div className="h-4 w-4 rounded-full bg-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter(c => c.status === 'approved').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Value: {formatCurrency(totals.approved || 0)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Paid Claims</CardTitle>
            <div className="h-4 w-4 rounded-full bg-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {claims.filter(c => c.status === 'paid').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Value: {formatCurrency(totals.paid || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div>
              <CardTitle>Panel Claims</CardTitle>
              <CardDescription>Manage and track panel insurance claims</CardDescription>
            </div>
            <div className="flex gap-2">
              <PanelClaimsExportManager
                claims={claims}
                filteredClaims={filteredClaims}
                selectedClaims={selectedClaims}
              />
              <Button 
                variant="outline" 
                onClick={() => setShowIntegrationManager(true)}
              >
                <Send className="w-4 h-4 mr-2" />
                API Integration
              </Button>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Claim
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 mb-6">
            {/* Search and Panel Filter Row */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search claims..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={panelFilter} onValueChange={setPanelFilter}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Panel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Panels</SelectItem>
                  {panels
                    .filter(panel => panel.id && panel.id.trim() !== '')
                    .map((panel) => (
                      <SelectItem key={panel.id} value={panel.id}>
                        {panel.panel_name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter Tabs */}
            <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
              <TabsList className="w-full justify-start flex-wrap h-auto">
                <TabsTrigger value="all" className="gap-2">
                  All Claims
                  <Badge variant="secondary" className="ml-1 bg-muted text-muted-foreground">
                    {statusCounts.all}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="draft" className="gap-2">
                  Drafts
                  <Badge variant="secondary" className="ml-1 bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400">
                    {statusCounts.draft}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="submitted" className="gap-2">
                  Submitted
                  <Badge variant="secondary" className="ml-1 bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400">
                    {statusCounts.submitted}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="approved" className="gap-2">
                  Approved
                  <Badge variant="secondary" className="ml-1 bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                    {statusCounts.approved}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="rejected" className="gap-2">
                  Rejected
                  <Badge variant="secondary" className="ml-1 bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400">
                    {statusCounts.rejected}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="paid" className="gap-2">
                  Paid
                  <Badge variant="secondary" className="ml-1 bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400">
                    {statusCounts.paid}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="short_paid" className="gap-2">
                  Short Paid
                  <Badge variant="secondary" className="ml-1 bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400">
                    {statusCounts.short_paid}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {/* Bulk Actions Toolbar */}
          <BulkActionToolbar
            selectedClaims={selectedClaims}
            claims={filteredClaims}
            onClearSelection={() => setSelectedClaims([])}
            onBulkStatusChange={handleBulkStatusChange}
          />


          {/* Claims Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      onCheckedChange={handleSelectAll}
                      aria-label="Select all claims"
                      className={isIndeterminate ? "data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground" : ""}
                    />
                  </TableHead>
                  <TableHead>Claim Number</TableHead>
                  <TableHead>Panel</TableHead>
                  <TableHead>Period</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Loading claims...
                    </TableCell>
                  </TableRow>
                ) : filteredClaims.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      No claims found matching your criteria
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedClaims.includes(claim.id)}
                          onCheckedChange={(checked) => handleSelectClaim(claim.id, checked as boolean)}
                          aria-label={`Select claim ${claim.claim_number}`}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{claim.claim_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{claim.panel?.panel_name}</div>
                          <div className="text-sm text-muted-foreground">{claim.panel?.panel_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatInTimeZone(parseISO(claim.billing_period_start), 'Asia/Kuala_Lumpur', 'MMM dd')} - {formatInTimeZone(parseISO(claim.billing_period_end), 'Asia/Kuala_Lumpur', 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>{claim.total_items}</TableCell>
                      <TableCell>{formatCurrency(claim.total_amount)}</TableCell>
                      <TableCell>
                        {claim.status === 'short_paid' ? (
                          <div className="flex flex-col gap-1">
                            <Badge className={getStatusColor(claim.status)}>
                              Short-paid
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatCurrency(claim.paid_amount || 0)} / {formatCurrency(claim.total_amount)}
                            </span>
                          </div>
                        ) : (
                          <Badge className={getStatusColor(claim.status)}>
                            {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{formatInTimeZone(parseISO(claim.created_at), 'Asia/Kuala_Lumpur', 'MMM dd, yyyy')}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedClaim(claim)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Footer Summary */}
      <PanelClaimsFooterSummary claims={filteredClaims} />

      {/* Modals */}
      <CreateClaimModal 
        open={showCreateModal} 
        onOpenChange={setShowCreateModal}
        onClaimCreated={() => fetchClaims()}
      />

      {selectedClaim && (
        <ClaimDetailsModal
          claim={selectedClaim}
          open={!!selectedClaim}
          onOpenChange={(open) => !open && setSelectedClaim(null)}
          onStatusChange={() => {
            fetchClaims();
            setSelectedClaim(null);
          }}
        />
      )}
      
      {/* Integration Manager Modal */}
      <Dialog open={showIntegrationManager} onOpenChange={setShowIntegrationManager}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Claims Integration Manager</DialogTitle>
          </DialogHeader>
          <ClaimsIntegrationManager />
        </DialogContent>
      </Dialog>

      {/* Batch Status Update Modal */}
      {showBatchModal && batchStatus && (
        <BatchStatusUpdateModal
          open={showBatchModal}
          onOpenChange={setShowBatchModal}
          selectedClaims={selectedClaims.map(id => filteredClaims.find(c => c.id === id)!).filter(Boolean)}
          newStatus={batchStatus}
          onConfirm={handleBatchConfirm}
        />
      )}
    </div>
  );
}