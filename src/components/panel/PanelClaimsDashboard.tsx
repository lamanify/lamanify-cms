import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertCircle, FileText, Plus, Search, Eye, Download, Send } from 'lucide-react';
import { usePanelClaims, PanelClaim } from '@/hooks/usePanelClaims';
import { usePanels } from '@/hooks/usePanels';
import { CreateClaimModal } from './CreateClaimModal';
import { ClaimDetailsModal } from './ClaimDetailsModal';
import { PanelClaimsExportManager } from './PanelClaimsExportManager';
import { ClaimsIntegrationManager } from './ClaimsIntegrationManager';
import { BulkActionToolbar } from './BulkActionToolbar';
import { BatchStatusUpdateModal } from './BatchStatusUpdateModal';
import { format } from 'date-fns';

interface PanelClaimsDashboardProps {
  onViewClaim?: (claimId: string) => void;
}

export function PanelClaimsDashboard({ onViewClaim }: PanelClaimsDashboardProps = {}) {
  const { claims, loading, fetchClaims, updateClaimStatus } = usePanelClaims();
  const { panels } = usePanels();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [panelFilter, setPanelFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedClaim, setSelectedClaim] = useState<PanelClaim | null>(null);
  const [selectedClaims, setSelectedClaims] = useState<string[]>([]);
  const [showIntegrationManager, setShowIntegrationManager] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [batchStatus, setBatchStatus] = useState<PanelClaim['status'] | null>(null);

  const filteredClaims = claims.filter(claim => {
    const matchesSearch = claim.claim_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.panel?.panel_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         claim.panel?.panel_code.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || claim.status === statusFilter;
    const matchesPanel = panelFilter === 'all' || claim.panel_id === panelFilter;
    
    return matchesSearch && matchesStatus && matchesPanel;
  });

  const getStatusBadgeVariant = (status: PanelClaim['status']) => {
    switch (status) {
      case 'draft': return 'secondary';
      case 'submitted': return 'default';
      case 'approved': return 'default';
      case 'paid': return 'default';
      case 'rejected': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusColor = (status: PanelClaim['status']) => {
    switch (status) {
      case 'draft': return 'text-muted-foreground';
      case 'submitted': return 'text-yellow-600';
      case 'approved': return 'text-green-600';
      case 'paid': return 'text-blue-600';
      case 'rejected': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

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
      // Process each selected claim
      for (const claimId of selectedClaims) {
        await updateClaimStatus(claimId, batchStatus, data);
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

  const getTotalsByStatus = () => {
    return claims.reduce((acc, claim) => {
      acc[claim.status] = (acc[claim.status] || 0) + claim.total_amount;
      acc.count = (acc.count || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
  };

  const totals = getTotalsByStatus();

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
              Total value: ${claims.reduce((sum, claim) => sum + claim.total_amount, 0).toFixed(2)}
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
              Value: ${(totals.submitted || 0).toFixed(2)}
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
              Value: ${(totals.approved || 0).toFixed(2)}
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
              Value: ${(totals.paid || 0).toFixed(2)}
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
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Search claims..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="submitted">Submitted</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
            <Select value={panelFilter} onValueChange={setPanelFilter}>
              <SelectTrigger className="w-[160px]">
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
                          {format(new Date(claim.billing_period_start), 'MMM dd')} - {format(new Date(claim.billing_period_end), 'MMM dd, yyyy')}
                        </div>
                      </TableCell>
                      <TableCell>{claim.total_items}</TableCell>
                      <TableCell>${claim.total_amount.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={getStatusBadgeVariant(claim.status)}
                          className={getStatusColor(claim.status)}
                        >
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(claim.created_at), 'MMM dd, yyyy')}</TableCell>
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