import { Button } from '@/components/ui/button';
import { Send, Check, X, DollarSign } from 'lucide-react';
import { PanelClaim } from '@/hooks/usePanelClaims';
import { isValidTransition } from '@/domain/panel';

interface ClaimActionsToolbarProps {
  claim: PanelClaim;
  onStatusChange: (newStatus: PanelClaim['status']) => void;
  disabled?: boolean;
}

export function ClaimActionsToolbar({ claim, onStatusChange, disabled }: ClaimActionsToolbarProps) {
  const currentStatus = claim.status;

  // Determine which action buttons to show based on current status
  const showSubmit = currentStatus === 'draft' && isValidTransition(currentStatus, 'submitted');
  const showApprove = currentStatus === 'submitted' && isValidTransition(currentStatus, 'approved');
  const showReject = (currentStatus === 'submitted' || currentStatus === 'approved') && isValidTransition(currentStatus, 'rejected');
  const showMarkPaid = (currentStatus === 'approved' || currentStatus === 'short_paid') && isValidTransition(currentStatus, 'paid');

  // Don't render if there are no valid actions
  if (!showSubmit && !showApprove && !showReject && !showMarkPaid) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {showSubmit && (
        <Button
          onClick={() => onStatusChange('submitted')}
          disabled={disabled}
          size="sm"
          variant="default"
        >
          <Send className="w-4 h-4 mr-2" />
          Submit Claim
        </Button>
      )}
      
      {showApprove && (
        <Button
          onClick={() => onStatusChange('approved')}
          disabled={disabled}
          size="sm"
          variant="default"
        >
          <Check className="w-4 h-4 mr-2" />
          Approve
        </Button>
      )}
      
      {showReject && (
        <Button
          onClick={() => onStatusChange('rejected')}
          disabled={disabled}
          size="sm"
          variant="destructive"
        >
          <X className="w-4 h-4 mr-2" />
          Reject
        </Button>
      )}
      
      {showMarkPaid && (
        <Button
          onClick={() => onStatusChange('paid')}
          disabled={disabled}
          size="sm"
          variant="default"
        >
          <DollarSign className="w-4 h-4 mr-2" />
          Mark as Paid
        </Button>
      )}
    </div>
  );
}
