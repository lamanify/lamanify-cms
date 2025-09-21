import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, Edit, Check, X, Clock, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { PanelClaim, usePanelClaims } from '@/hooks/usePanelClaims';
import { StatusConfirmationDialog } from './StatusConfirmationDialog';
import { BillingItemEditor } from './BillingItemEditor';
import { useBillingManagement } from '@/hooks/useBillingManagement';
import { useToast } from '@/hooks/use-toast';

interface ClaimDetailsModalProps {
  claim: PanelClaim;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusChange?: () => void;
}

export function ClaimDetailsModal({ claim, open, onOpenChange, onStatusChange }: ClaimDetailsModalProps) {
  const { fetchClaimDetails, updateClaimStatus, validateStatusTransition } = usePanelClaims();
  const { fetchBillingItemsByClaimId, updateBillingItem } = useBillingManagement();
  const { toast } = useToast();
  const [claimDetails, setClaimDetails] = useState<PanelClaim | null>(null);
  const [billingItems, setBillingItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes] = useState(claim.notes || '');
  const [showStatusConfirmation, setShowStatusConfirmation] = useState(false);
  const [pendingStatusChange, setPendingStatusChange] = useState<{
    status: string;
    currentStatus: string;
  } | null>(null);

  useEffect(() => {
    if (open && claim.id) {
      loadClaimDetails();
    }
  }, [open, claim.id]);

  const loadClaimDetails = async () => {
    setLoading(true);
    try {
      const [details, billing] = await Promise.all([
        fetchClaimDetails(claim.id),
        fetchBillingItemsByClaimId(claim.id)
      ]);
      if (details) {
        setClaimDetails(details);
        setNotes(details.notes || '');
      }
      setBillingItems(billing);
    } catch (error) {
      console.error('Error loading claim details:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: PanelClaim['status']) => {
    switch (status) {
      case 'draft': return <Edit className="w-4 h-4" />;
      case 'submitted': return <Clock className="w-4 h-4" />;
      case 'approved': return <Check className="w-4 h-4" />;
      case 'paid': return <DollarSign className="w-4 h-4" />;
      case 'rejected': return <X className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
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

  const handleStatusChange = async (newStatus: string) => {
    if (!claim) return;
    
    // Check if this requires confirmation (paid or rejected)
    const requiresConfirmation = newStatus === 'paid' || newStatus === 'rejected';
    
    if (requiresConfirmation) {
      setPendingStatusChange({ 
        status: newStatus, 
        currentStatus: displayClaim.status 
      });
      setShowStatusConfirmation(true);
    } else {
      // Validate transition first
      const isValid = await validateStatusTransition(displayClaim.status, newStatus);
      if (!isValid) {
        toast({
          title: "Invalid Status Change",
          description: `Cannot change status from "${displayClaim.status}" to "${newStatus}"`,
          variant: "destructive",
        });
        return;
      }
      
      await updateClaimStatus(claim.id, newStatus as PanelClaim['status'], { notes });
      onStatusChange?.();
      loadClaimDetails();
    }
  };

  const handleConfirmStatusChange = async (data: { reason?: string; paidAmount?: number }) => {
    if (!claim || !pendingStatusChange) return;
    
    await updateClaimStatus(
      claim.id, 
      pendingStatusChange.status as PanelClaim['status'], 
      { 
        notes,
        reason: data.reason,
        paidAmount: data.paidAmount
      }
    );
    
    onStatusChange?.();
    loadClaimDetails();
    setPendingStatusChange(null);
  };

  const displayClaim = claimDetails || claim;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Claim Details - {displayClaim.claim_number}
          </DialogTitle>
          <DialogDescription>
            View and manage panel claim information
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-center">Loading claim details...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Claim Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Claim Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Status:</span>
                    <Badge 
                      className={`${getStatusColor(displayClaim.status)} flex items-center gap-1`}
                      variant="outline"
                    >
                      {getStatusIcon(displayClaim.status)}
                      {displayClaim.status.charAt(0).toUpperCase() + displayClaim.status.slice(1)}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Panel:</span>
                    <span className="text-sm">{displayClaim.panel?.panel_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Panel Code:</span>
                    <span className="text-sm font-mono">{displayClaim.panel?.panel_code}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Billing Period:</span>
                    <span className="text-sm">
                      {format(new Date(displayClaim.billing_period_start), 'MMM dd')} - {format(new Date(displayClaim.billing_period_end), 'MMM dd, yyyy')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Items:</span>
                    <span className="text-sm">{displayClaim.total_items}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Total Amount:</span>
                    <span className="text-sm font-bold">${displayClaim.total_amount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Processing Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Created:</span>
                    <span className="text-sm">{format(new Date(displayClaim.created_at), 'MMM dd, yyyy HH:mm')}</span>
                  </div>
                  {displayClaim.submitted_at && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Submitted:</span>
                      <span className="text-sm">{format(new Date(displayClaim.submitted_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  )}
                  {displayClaim.approved_at && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Approved:</span>
                      <span className="text-sm">{format(new Date(displayClaim.approved_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  )}
                  {displayClaim.paid_at && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Paid:</span>
                      <span className="text-sm">{format(new Date(displayClaim.paid_at), 'MMM dd, yyyy HH:mm')}</span>
                    </div>
                  )}
                  {displayClaim.panel_reference_number && (
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Panel Reference:</span>
                      <span className="text-sm font-mono">{displayClaim.panel_reference_number}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Status Change */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Status Management</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Label htmlFor="status">Change Status:</Label>
                  <Select
                    value={displayClaim.status}
                    onValueChange={handleStatusChange}
                  >
                    <SelectTrigger className="w-48">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Enhanced Billing Items Section */}
            {billingItems && billingItems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Billing Items</CardTitle>
                  <CardDescription>
                    Edit staff information and billing details for each item in this claim.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {billingItems.map((item) => (
                      <BillingItemEditor
                        key={item.id}
                        billingItem={item}
                        onUpdate={async (updatedItem) => {
                          await updateBillingItem(updatedItem);
                          // Refresh billing items after update
                          const updatedBillingItems = await fetchBillingItemsByClaimId(claim.id);
                          setBillingItems(updatedBillingItems);
                        }}
                        isEditable={displayClaim?.status !== 'paid'}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Legacy Claim Items Section (fallback) */}
            {(!billingItems || billingItems.length === 0) && claimDetails?.claim_items && claimDetails.claim_items.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Claim Items</CardTitle>
                  <CardDescription>
                    Billing records included in this claim
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Invoice Number</TableHead>
                          <TableHead>Description</TableHead>
                          <TableHead>Original Amount</TableHead>
                          <TableHead>Claim Amount</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {claimDetails.claim_items.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">
                              {item.billing?.invoice_number}
                            </TableCell>
                            <TableCell>{item.billing?.description}</TableCell>
                            <TableCell>${item.item_amount.toFixed(2)}</TableCell>
                            <TableCell>${item.claim_amount.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge 
                                variant={item.status === 'included' ? 'default' : item.status === 'rejected' ? 'destructive' : 'secondary'}
                              >
                                {item.status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Notes Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Notes</CardTitle>
              </CardHeader>
              <CardContent>
                {editingNotes ? (
                  <div className="space-y-2">
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Add notes about this claim..."
                      rows={4}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => setEditingNotes(false)}>
                        Save
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setNotes(displayClaim.notes || '');
                          setEditingNotes(false);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {notes || 'No notes added yet.'}
                    </p>
                    <Button size="sm" variant="outline" onClick={() => setEditingNotes(true)}>
                      <Edit className="w-4 h-4 mr-2" />
                      Edit Notes
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex gap-2">
            <Button variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Claim
            </Button>
          </div>
        </div>
      </DialogContent>
      
      {/* Status Confirmation Dialog */}
      {pendingStatusChange && (
        <StatusConfirmationDialog
          open={showStatusConfirmation}
          onOpenChange={setShowStatusConfirmation}
          currentStatus={pendingStatusChange.currentStatus}
          newStatus={pendingStatusChange.status}
          claimAmount={claim?.total_amount || 0}
          onConfirm={handleConfirmStatusChange}
        />
      )}
    </Dialog>
  );
}