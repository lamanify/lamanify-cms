// Panel Claims Status Transitions and Constants

export type ClaimStatus = 'draft' | 'submitted' | 'approved' | 'short_paid' | 'rejected' | 'paid';

// Allowed status transitions mapping
export const ALLOWED_TRANSITIONS: Record<ClaimStatus, ClaimStatus[]> = {
  draft: ['submitted', 'rejected'],
  submitted: ['approved', 'rejected'],
  approved: ['paid', 'short_paid', 'rejected'],
  short_paid: ['paid', 'rejected'],
  paid: [], // Paid is final, no transitions allowed
  rejected: ['draft', 'submitted'], // Can resubmit from rejected
};

// Billing status options for outstanding panel invoices
export const OUTSTANDING_STATUS_OPTIONS: ClaimStatus[] = [
  'submitted',
  'approved',
  'short_paid',
  'rejected',
  'paid',
];

// Validation rules
export const VALIDATION_RULES = {
  MIN_REJECTION_REASON_LENGTH: 5,
  PAID_AMOUNT_MAX_MULTIPLIER: 1.0, // Cannot pay more than 100% of total
};

// Status display configuration
export const STATUS_CONFIG: Record<ClaimStatus, { color: string; label: string }> = {
  draft: { color: 'text-muted-foreground', label: 'Draft' },
  submitted: { color: 'text-yellow-600', label: 'Submitted' },
  approved: { color: 'text-green-600', label: 'Approved' },
  short_paid: { color: 'text-orange-600', label: 'Short Paid' },
  rejected: { color: 'text-red-600', label: 'Rejected' },
  paid: { color: 'text-blue-600', label: 'Paid' },
};

// Helper function to validate status transition
export function isValidTransition(currentStatus: ClaimStatus, newStatus: ClaimStatus): boolean {
  return ALLOWED_TRANSITIONS[currentStatus]?.includes(newStatus) ?? false;
}

// Strongly typed Totals interface
export type Totals = Partial<Record<ClaimStatus, number>> & { count: number };

// Helper function to determine if short_paid should be applied
export function shouldAutoCoerceToShortPaid(paidAmount: number, totalAmount: number): boolean {
  return paidAmount > 0 && paidAmount < totalAmount;
}
