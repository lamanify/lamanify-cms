import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { PanelClaim } from '@/hooks/usePanelClaims';
import { parseISO } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { VALIDATION_RULES, shouldAutoCoerceToShortPaid, ClaimStatus, OUTSTANDING_STATUS_OPTIONS } from '@/domain/panel';

interface BatchStatusUpdateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedClaims: PanelClaim[];
  newStatus: PanelClaim['status'] | ClaimStatus;
  onConfirm: (data: { reason?: string; paidAmount?: number }) => void;
  allowedStatuses?: ClaimStatus[];
}

export function BatchStatusUpdateModal({
  open,
  onOpenChange,
  selectedClaims,
  newStatus,
  onConfirm,
  allowedStatuses = OUTSTANDING_STATUS_OPTIONS
}: BatchStatusUpdateModalProps) {
  const [reason, setReason] = useState('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [statusToApply, setStatusToApply] = useState<ClaimStatus>(newStatus as ClaimStatus);
  const [validationError, setValidationError] = useState<string>('');

  const totalAmount = selectedClaims.reduce((sum, claim) => sum + claim.total_amount, 0);
  const requiresReason = statusToApply === 'rejected';
  const requiresPaymentAmount = statusToApply === 'paid' || statusToApply === 'short_paid';
  const isIrreversible = statusToApply === 'paid';

  const getStatusIcon = () => {
    switch (newStatus) {
      case 'submitted':
        return <CheckCircle className="w-5 h-5 text-yellow-600" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'paid':
        return <CheckCircle className="w-5 h-5 text-blue-600" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <CheckCircle className="w-5 h-5" />;
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

  const canConfirm = () => {
    // Validate rejection reason length
    if (requiresReason && reason.trim().length < VALIDATION_RULES.MIN_REJECTION_REASON_LENGTH) {
      return false;
    }
    
    // Validate payment amount
    if (requiresPaymentAmount) {
      if (!paidAmount || Number(paidAmount) <= 0) return false;
      if (Number(paidAmount) > totalAmount * VALIDATION_RULES.PAID_AMOUNT_MAX_MULTIPLIER) return false;
    }
    
    return true;
  };

  const handleConfirm = () => {
    setValidationError('');
    
    // Validate rejection reason
    if (requiresReason && reason.trim().length < VALIDATION_RULES.MIN_REJECTION_REASON_LENGTH) {
      setValidationError(`Rejection reason must be at least ${VALIDATION_RULES.MIN_REJECTION_REASON_LENGTH} characters`);
      return;
    }
    
    const data: { reason?: string; paidAmount?: number } = {};
    
    if (requiresReason) {
      data.reason = reason;
    }
    
    if (requiresPaymentAmount) {
      const paid = Number(paidAmount);
      
      // Validate payment amount doesn't exceed total
      if (paid > totalAmount) {
        setValidationError('Payment amount cannot exceed total amount');
        return;
      }
      
      // Auto-coerce to short_paid if amount is less than total
      if (shouldAutoCoerceToShortPaid(paid, totalAmount) && statusToApply === 'paid') {
        setStatusToApply('short_paid');
        setValidationError('Amount is less than total. Status will be set to "Short Paid"');
        setTimeout(() => setValidationError(''), 3000);
      }
      
      data.paidAmount = paid;
    }
    
    onConfirm(data);
    setReason('');
    setPaidAmount('');
    setValidationError('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setReason('');
    setPaidAmount('');
    setValidationError('');
    setStatusToApply(newStatus as ClaimStatus);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getStatusIcon()}
            Batch Status Update: {statusToApply.charAt(0).toUpperCase() + statusToApply.slice(1)}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Validation Error */}
          {validationError && (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {validationError}
              </AlertDescription>
            </Alert>
          )}
          {/* Warning for irreversible actions */}
          {isIrreversible && (
            <Alert className="border-amber-200 bg-amber-50">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <strong>Warning:</strong> Marking claims as "Paid" is irreversible and cannot be undone.
              </AlertDescription>
            </Alert>
          )}

          {/* Summary */}
          <div className="bg-muted/50 p-4 rounded-lg">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{selectedClaims.length}</div>
                <div className="text-sm text-muted-foreground">Claims</div>
              </div>
              <div>
                <div className="text-2xl font-bold">
                  {new Set(selectedClaims.map(c => c.panel_id)).size}
                </div>
                <div className="text-sm text-muted-foreground">Panels</div>
              </div>
              <div>
                <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Total Amount</div>
              </div>
            </div>
          </div>

          {/* Input fields based on status */}
          {requiresReason && (
            <div className="space-y-2">
              <Label htmlFor="reason">Rejection Reason *</Label>
              <Textarea
                id="reason"
                placeholder="Please provide a reason for rejecting these claims (minimum 5 characters)..."
                value={reason}
                onChange={(e) => {
                  setReason(e.target.value);
                  if (e.target.value.trim().length >= VALIDATION_RULES.MIN_REJECTION_REASON_LENGTH) {
                    setValidationError('');
                  }
                }}
                className="min-h-[100px]"
              />
              <p className="text-sm text-muted-foreground">
                {reason.trim().length}/{VALIDATION_RULES.MIN_REJECTION_REASON_LENGTH} characters minimum
              </p>
            </div>
          )}

          {requiresPaymentAmount && (
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Payment Amount *</Label>
              <Input
                id="paidAmount"
                type="number"
                placeholder="0.00"
                value={paidAmount}
                onChange={(e) => {
                  const value = e.target.value === '' ? '' : Number(e.target.value);
                  setPaidAmount(value);
                  
                  // Auto-validation and status coercion
                  if (value !== '' && Number(value) > 0) {
                    if (Number(value) > totalAmount) {
                      setValidationError('Payment amount cannot exceed total amount');
                    } else if (shouldAutoCoerceToShortPaid(Number(value), totalAmount)) {
                      setValidationError('Amount is less than total. Status will be "Short Paid"');
                      setStatusToApply('short_paid');
                    } else {
                      setValidationError('');
                      if (statusToApply === 'short_paid' && Number(value) === totalAmount) {
                        setStatusToApply('paid');
                      }
                    }
                  }
                }}
                step="0.01"
                min="0"
                max={totalAmount}
              />
              <p className="text-sm text-muted-foreground">
                Maximum amount: ${totalAmount.toFixed(2)}
                {paidAmount !== '' && Number(paidAmount) < totalAmount && (
                  <span className="text-orange-600"> • Will be marked as Short Paid</span>
                )}
              </p>
            </div>
          )}

          <Separator />

          {/* Claims list */}
          <div>
            <h4 className="font-medium mb-3">Claims to be updated:</h4>
            <div className="border rounded-lg max-h-[300px] overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Claim Number</TableHead>
                    <TableHead>Panel</TableHead>
                    <TableHead>Current Status</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selectedClaims.map((claim) => (
                    <TableRow key={claim.id}>
                      <TableCell className="font-medium">{claim.claim_number}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{claim.panel?.panel_name}</div>
                          <div className="text-sm text-muted-foreground">{claim.panel?.panel_code}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="secondary"
                          className={getStatusColor(claim.status)}
                        >
                          {claim.status.charAt(0).toUpperCase() + claim.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>${claim.total_amount.toFixed(2)}</TableCell>
                      <TableCell>{formatInTimeZone(parseISO(claim.created_at), 'Asia/Kuala_Lumpur', 'MMM dd, yyyy')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!canConfirm()}
            className={isIrreversible ? 'bg-red-600 hover:bg-red-700' : ''}
          >
            {isIrreversible ? 'Confirm Payment' : `Update ${selectedClaims.length} Claims`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}