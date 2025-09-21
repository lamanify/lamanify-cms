import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, DollarSign, XCircle } from "lucide-react";

interface StatusConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentStatus: string;
  newStatus: string;
  claimAmount: number;
  onConfirm: (data: { reason?: string; paidAmount?: number }) => void;
}

export function StatusConfirmationDialog({
  open,
  onOpenChange,
  currentStatus,
  newStatus,
  claimAmount,
  onConfirm,
}: StatusConfirmationDialogProps) {
  const [reason, setReason] = useState("");
  const [paidAmount, setPaidAmount] = useState(claimAmount);
  
  const isMarkingAsPaid = newStatus === 'paid';
  const isRejecting = newStatus === 'rejected';
  const isIrreversible = newStatus === 'paid';
  
  const getIcon = () => {
    if (isMarkingAsPaid) return <DollarSign className="h-6 w-6 text-green-600" />;
    if (isRejecting) return <XCircle className="h-6 w-6 text-red-600" />;
    return <AlertTriangle className="h-6 w-6 text-amber-600" />;
  };
  
  const getTitle = () => {
    if (isMarkingAsPaid) return "Confirm Payment";
    if (isRejecting) return "Reject Claim";
    return "Change Status";
  };
  
  const getDescription = () => {
    if (isMarkingAsPaid) {
      return "You are about to mark this claim as paid. This action is irreversible and will finalize the claim. Please confirm the payment amount.";
    }
    if (isRejecting) {
      return "You are about to reject this claim. Please provide a reason for rejection. The panel will be notified of this decision.";
    }
    return `Are you sure you want to change the status from "${currentStatus}" to "${newStatus}"?`;
  };
  
  const handleConfirm = () => {
    const data: { reason?: string; paidAmount?: number } = {};
    
    if (isRejecting && reason.trim()) {
      data.reason = reason.trim();
    }
    
    if (isMarkingAsPaid && paidAmount) {
      data.paidAmount = paidAmount;
    }
    
    onConfirm(data);
    onOpenChange(false);
    setReason("");
    setPaidAmount(claimAmount);
  };
  
  const canConfirm = () => {
    if (isRejecting) return reason.trim().length > 0;
    if (isMarkingAsPaid) return paidAmount > 0 && paidAmount <= claimAmount;
    return true;
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <div className="flex items-center gap-2">
            {getIcon()}
            <AlertDialogTitle>{getTitle()}</AlertDialogTitle>
          </div>
          <AlertDialogDescription>
            {getDescription()}
          </AlertDialogDescription>
        </AlertDialogHeader>
        
        <div className="space-y-4 py-4">
          {isMarkingAsPaid && (
            <div className="space-y-2">
              <Label htmlFor="paidAmount">Payment Amount</Label>
              <Input
                id="paidAmount"
                type="number"
                step="0.01"
                min="0"
                max={claimAmount}
                value={paidAmount}
                onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                placeholder="Enter payment amount"
              />
              <p className="text-sm text-muted-foreground">
                Claim amount: ${claimAmount.toFixed(2)}
              </p>
            </div>
          )}
          
          {isRejecting && (
            <div className="space-y-2">
              <Label htmlFor="rejectionReason">Rejection Reason *</Label>
              <Textarea
                id="rejectionReason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Please provide a detailed reason for rejection..."
                className="min-h-[80px]"
                required
              />
            </div>
          )}
          
          {isIrreversible && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
                <div className="text-sm text-amber-800">
                  <strong>Warning:</strong> This action cannot be undone. Once marked as paid, the claim will be finalized and cannot be modified.
                </div>
              </div>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => {
            setReason("");
            setPaidAmount(claimAmount);
          }}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={!canConfirm()}
            className={`
              ${isMarkingAsPaid ? 'bg-green-600 hover:bg-green-700' : ''}
              ${isRejecting ? 'bg-red-600 hover:bg-red-700' : ''}
            `}
          >
            {isMarkingAsPaid ? 'Confirm Payment' : isRejecting ? 'Reject Claim' : 'Confirm'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}