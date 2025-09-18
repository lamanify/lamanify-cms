import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent } from '@/components/ui/card';
import { MinusIcon, PlusIcon } from 'lucide-react';

interface AdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (adjustment: {
    type: 'add' | 'deduct';
    amountType: 'fixed' | 'percentage';
    amount: number;
  }) => void;
  currentTotal: number;
}

export function AdjustmentModal({ isOpen, onClose, onConfirm, currentTotal }: AdjustmentModalProps) {
  const [adjustmentType, setAdjustmentType] = useState<'add' | 'deduct'>('deduct');
  const [amountType, setAmountType] = useState<'fixed' | 'percentage'>('fixed');
  const [amount, setAmount] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    const numAmount = parseFloat(amount);

    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      newErrors.amount = 'Please enter a valid amount greater than 0';
    } else if (amountType === 'percentage' && numAmount > 100) {
      newErrors.amount = 'Percentage cannot exceed 100%';
    } else if (amountType === 'fixed' && adjustmentType === 'deduct' && numAmount > currentTotal) {
      newErrors.amount = `Discount cannot exceed the current total of RM${currentTotal.toFixed(2)}`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = () => {
    if (!validateForm()) return;

    const numAmount = parseFloat(amount);
    onConfirm({
      type: adjustmentType,
      amountType,
      amount: numAmount
    });

    // Reset form
    setAdjustmentType('deduct');
    setAmountType('fixed');
    setAmount('');
    setErrors({});
    onClose();
  };

  const handleClose = () => {
    setAdjustmentType('deduct');
    setAmountType('fixed');
    setAmount('');
    setErrors({});
    onClose();
  };

  // Calculate preview of adjustment
  const calculateAdjustment = () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount)) return 0;
    
    if (amountType === 'percentage') {
      return (currentTotal * numAmount) / 100;
    }
    return numAmount;
  };

  const adjustmentAmount = calculateAdjustment();
  const newTotal = adjustmentType === 'add' 
    ? currentTotal + adjustmentAmount 
    : currentTotal - adjustmentAmount;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Adjustment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Add or Deduct Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">
              Would you like to add or deduct from amount?
            </Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={adjustmentType === 'add' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('add')}
                className="flex-1 h-12"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Add
              </Button>
              <Button
                type="button"
                variant={adjustmentType === 'deduct' ? 'default' : 'outline'}
                onClick={() => setAdjustmentType('deduct')}
                className="flex-1 h-12"
              >
                <MinusIcon className="h-4 w-4 mr-2" />
                Deduct
              </Button>
            </div>
          </div>

          {/* Amount Type Selection */}
          <div>
            <Label className="text-base font-medium mb-3 block">Choose type</Label>
            <RadioGroup
              value={amountType}
              onValueChange={(value: 'fixed' | 'percentage') => setAmountType(value)}
              className="grid grid-cols-2 gap-4"
            >
              <Card className={`cursor-pointer transition-colors ${amountType === 'fixed' ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4 text-center">
                  <RadioGroupItem value="fixed" id="fixed" className="sr-only" />
                  <Label htmlFor="fixed" className="cursor-pointer">
                    <div className="font-medium">RM</div>
                    <div className="text-sm text-muted-foreground">Fixed amount</div>
                  </Label>
                </CardContent>
              </Card>
              <Card className={`cursor-pointer transition-colors ${amountType === 'percentage' ? 'ring-2 ring-primary' : ''}`}>
                <CardContent className="p-4 text-center">
                  <RadioGroupItem value="percentage" id="percentage" className="sr-only" />
                  <Label htmlFor="percentage" className="cursor-pointer">
                    <div className="font-medium">%</div>
                    <div className="text-sm text-muted-foreground">Percentage</div>
                  </Label>
                </CardContent>
              </Card>
            </RadioGroup>
          </div>

          {/* Amount Input */}
          <div>
            <Label htmlFor="adjustment-amount" className="text-base font-medium">
              Enter adjustment amount
            </Label>
            <div className="mt-2 relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                {amountType === 'fixed' ? 'RM' : '%'}
              </div>
              <Input
                id="adjustment-amount"
                type="number"
                step="0.01"
                min="0"
                max={amountType === 'percentage' ? 100 : undefined}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={amountType === 'fixed' ? '0.00' : '0'}
                className={`pl-12 h-12 text-lg ${errors.amount ? 'border-destructive' : ''}`}
                autoFocus
              />
            </div>
            {errors.amount && (
              <p className="text-sm text-destructive mt-1">{errors.amount}</p>
            )}
          </div>

          {/* Preview */}
          {amount && !isNaN(parseFloat(amount)) && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Current Total:</span>
                    <span>RM{currentTotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>
                      {adjustmentType === 'add' ? 'Addition' : 'Discount'}:
                    </span>
                    <span className={adjustmentType === 'add' ? 'text-green-600' : 'text-red-600'}>
                      {adjustmentType === 'add' ? '+' : '-'}RM{adjustmentAmount.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between font-semibold border-t pt-2">
                    <span>New Total:</span>
                    <span>RM{Math.max(0, newTotal).toFixed(2)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm} 
            disabled={!amount || Object.keys(errors).length > 0}
          >
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}