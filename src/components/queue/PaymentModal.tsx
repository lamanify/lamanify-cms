import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, DollarSignIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { PaymentRecord, PaymentSummary } from '@/hooks/usePayments';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentAdded: (paymentData: {
    visit_id?: string;
    patient_id: string;
    amount: number;
    payment_method: string;
    reference_number?: string;
    payment_date: string;
    notes?: string;
  }) => Promise<boolean>;
  summary: PaymentSummary;
  visitId?: string;
  patientId: string;
  patientName: string;
}

const paymentMethods = [
  { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card Payment' },
  { value: 'online', label: 'Online Transfer' },
  { value: 'insurance', label: 'Insurance Panel' },
  { value: 'others', label: 'Others' }
];

export function PaymentModal({
  isOpen,
  onClose,
  onPaymentAdded,
  summary,
  visitId,
  patientId,
  patientName
}: PaymentModalProps) {
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: '',
    reference_number: '',
    payment_date: new Date(),
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Auto-fill amount with outstanding balance when modal opens
  useEffect(() => {
    if (isOpen && summary.amount_due > 0) {
      setFormData(prev => ({
        ...prev,
        amount: summary.amount_due.toFixed(2)
      }));
    }
  }, [isOpen, summary.amount_due]);

  // Real-time calculation
  const enteredAmount = parseFloat(formData.amount) || 0;
  const newTotalPaid = summary.total_paid + enteredAmount;
  const newAmountDue = Math.max(0, summary.total_amount - newTotalPaid);

  // Validation
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.amount || enteredAmount <= 0) {
      newErrors.amount = 'Amount must be greater than 0';
    } else if (enteredAmount > summary.amount_due) {
      newErrors.amount = `Amount cannot exceed outstanding balance of RM${summary.amount_due.toFixed(2)}`;
    }

    if (!formData.payment_method) {
      newErrors.payment_method = 'Payment method is required';
    }

    if ((formData.payment_method === 'card' || formData.payment_method === 'online') && !formData.reference_number) {
      newErrors.reference_number = 'Reference number is required for card/online payments';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setLoading(true);
    try {
      const paymentData = {
        visit_id: visitId,
        patient_id: patientId,
        amount: enteredAmount,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number || undefined,
        payment_date: format(formData.payment_date, 'yyyy-MM-dd'),
        notes: formData.notes || undefined
      };

      const success = await onPaymentAdded(paymentData);
      
      if (success) {
        handleClose();
      }
    } catch (error) {
      console.error('Error submitting payment:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      amount: '',
      payment_method: '',
      reference_number: '',
      payment_date: new Date(),
      notes: ''
    });
    setErrors({});
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      handleClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSignIcon className="h-5 w-5" />
            Add Payment - {patientName}
          </DialogTitle>
        </DialogHeader>

        {/* Payment Summary Display */}
        <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span>Total Amount:</span>
            <span className="font-medium">RM{summary.total_amount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span>Already Paid:</span>
            <span className="font-medium text-success">RM{summary.total_paid.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm font-semibold border-t pt-2">
            <span>Outstanding:</span>
            <span className="text-destructive">RM{summary.amount_due.toFixed(2)}</span>
          </div>
          
          {enteredAmount > 0 && (
            <>
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Payment Amount:</span>
                  <span>RM{enteredAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-semibold">
                  <span>New Balance:</span>
                  <span className={newAmountDue === 0 ? 'text-success' : 'text-destructive'}>
                    RM{newAmountDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Amount */}
          <div>
            <Label htmlFor="amount">Payment Amount (RM) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              max={summary.amount_due}
              value={formData.amount}
              onChange={(e) => {
                setFormData(prev => ({ ...prev, amount: e.target.value }));
                // Clear amount error when value changes
                if (errors.amount && parseFloat(e.target.value) > 0) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.amount;
                    return newErrors;
                  });
                }
              }}
              placeholder="0.00"
              autoFocus
              className={errors.amount ? 'border-destructive' : ''}
            />
            {errors.amount && <p className="text-sm text-destructive mt-1">{errors.amount}</p>}
          </div>

          {/* Payment Method */}
          <div>
            <Label htmlFor="payment_method">Payment Method *</Label>
            <Select 
              value={formData.payment_method} 
              onValueChange={(value: string) => {
                setFormData(prev => ({ ...prev, payment_method: value }));
                // Clear payment method error when selection is made
                if (errors.payment_method) {
                  setErrors(prev => {
                    const newErrors = { ...prev };
                    delete newErrors.payment_method;
                    return newErrors;
                  });
                }
              }}
            >
              <SelectTrigger className={errors.payment_method ? 'border-destructive' : ''}>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                {paymentMethods.map(method => (
                  <SelectItem key={method.value} value={method.value}>
                    {method.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.payment_method && <p className="text-sm text-destructive mt-1">{errors.payment_method}</p>}
          </div>

          {/* Reference Number (for card/online) */}
          {(formData.payment_method === 'card' || formData.payment_method === 'online') && (
            <div>
              <Label htmlFor="reference_number">
                Reference/Transaction Number *
              </Label>
              <Input
                id="reference_number"
                value={formData.reference_number}
                onChange={(e) => {
                  setFormData(prev => ({ ...prev, reference_number: e.target.value }));
                  // Clear reference number error when value changes
                  if (errors.reference_number && e.target.value.trim()) {
                    setErrors(prev => {
                      const newErrors = { ...prev };
                      delete newErrors.reference_number;
                      return newErrors;
                    });
                  }
                }}
                placeholder="Enter transaction reference"
                className={errors.reference_number ? 'border-destructive' : ''}
              />
              {errors.reference_number && <p className="text-sm text-destructive mt-1">{errors.reference_number}</p>}
            </div>
          )}

          {/* Payment Date */}
          <div>
            <Label>Payment Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !formData.payment_date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.payment_date ? format(formData.payment_date, "PPP") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={formData.payment_date}
                  onSelect={(date) => date && setFormData(prev => ({ ...prev, payment_date: date }))}
                  initialFocus
                  className="pointer-events-auto"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Internal remarks or additional details"
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading || Object.keys(errors).length > 0}
            >
              {loading ? 'Processing...' : `Record Payment (RM${enteredAmount.toFixed(2)})`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}