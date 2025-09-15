import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X } from 'lucide-react';

const priceTierSchema = z.object({
  tier_name: z.string().min(1, 'Tier name is required'),
  description: z.string().optional(),
  payment_methods: z.array(z.string()).min(1, 'At least one payment method must be selected')
});

type PriceTierFormData = z.infer<typeof priceTierSchema>;

const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Credit Card', category: 'general' },
  { id: 'voucher', label: 'Voucher', category: 'general' },
  { id: 'e_wallet', label: 'E Wallet', category: 'general' },
  { id: 'qr_pay', label: 'QR pay', category: 'general' },
  { id: 'cash', label: 'Cash', category: 'general' },
  { id: 'card', label: 'Card', category: 'general' },
  { id: 'panel', label: 'Panel', category: 'panel_header' },
  { id: 'pm_care', label: 'PM Care', category: 'panel' },
  { id: 'pm_care_pnb', label: 'PM Care - PNB', category: 'panel' },
  { id: 'madani', label: 'Madani', category: 'panel' },
  { id: 'nestle', label: 'Nestle', category: 'panel' },
  { id: 'pmcare', label: 'PMCare', category: 'panel' },
  { id: 'medkad', label: 'MedKad', category: 'panel' },
  { id: 'aia', label: 'AIA', category: 'panel' },
  { id: 'koperasi_guru', label: 'Koperasi Guru Malaysia', category: 'panel' },
  { id: 'etiqa', label: 'Etiqa', category: 'panel' }
];

interface PriceTierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTier?: {
    id: string;
    tier_name: string;
    description?: string;
    payment_methods?: string[];
  } | null;
  onSubmit: (data: { tier_name: string; description?: string; payment_methods: string[] }) => Promise<boolean>;
}

export function PriceTierModal({ open, onOpenChange, editingTier, onSubmit }: PriceTierModalProps) {
  const [selectedMethods, setSelectedMethods] = useState<string[]>(editingTier?.payment_methods || []);

  const form = useForm<PriceTierFormData>({
    resolver: zodResolver(priceTierSchema),
    defaultValues: {
      tier_name: editingTier?.tier_name || '',
      description: editingTier?.description || '',
      payment_methods: editingTier?.payment_methods || []
    }
  });

  const handlePaymentMethodToggle = (methodId: string) => {
    const newMethods = selectedMethods.includes(methodId)
      ? selectedMethods.filter(id => id !== methodId)
      : [...selectedMethods, methodId];
    
    setSelectedMethods(newMethods);
    form.setValue('payment_methods', newMethods);
  };

  const handleSubmit = async (data: PriceTierFormData) => {
    const success = await onSubmit({
      tier_name: data.tier_name,
      description: data.description,
      payment_methods: selectedMethods
    });

    if (success) {
      form.reset();
      setSelectedMethods([]);
      onOpenChange(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setSelectedMethods(editingTier?.payment_methods || []);
    onOpenChange(false);
  };

  const generalMethods = PAYMENT_METHODS.filter(m => m.category === 'general');
  const panelHeader = PAYMENT_METHODS.filter(m => m.category === 'panel_header');
  const panelMethods = PAYMENT_METHODS.filter(m => m.category === 'panel');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-medium">
              {editingTier ? 'Edit Price Tier' : 'New tier'}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)}>
            <div className="grid grid-cols-2 gap-8">
              {/* Left Column - Basic Information */}
              <div className="space-y-6">
                <FormField
                  control={form.control}
                  name="tier_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Tier name *</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Panel A" 
                          {...field}
                          className="mt-1"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Description (optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief description of the tier"
                          rows={4}
                          {...field}
                          className="mt-1 resize-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Right Column - Payment Method Selection */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="payment_methods"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Payment method</FormLabel>
                      
                      <div className="space-y-3 mt-3">
                        {/* General Payment Methods */}
                        <div className="space-y-2">
                          {generalMethods.map((method) => (
                            <div key={method.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={method.id}
                                checked={selectedMethods.includes(method.id)}
                                onCheckedChange={() => handlePaymentMethodToggle(method.id)}
                              />
                              <label
                                htmlFor={method.id}
                                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {method.label}
                              </label>
                            </div>
                          ))}
                        </div>

                        {/* Panel Header */}
                        <div className="space-y-2 pt-2">
                          {panelHeader.map((method) => (
                            <div key={method.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={method.id}
                                checked={selectedMethods.includes(method.id)}
                                onCheckedChange={() => handlePaymentMethodToggle(method.id)}
                              />
                              <label
                                htmlFor={method.id}
                                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {method.label}
                              </label>
                            </div>
                          ))}
                        </div>

                        {/* Panel Options */}
                        <div className="space-y-2 pl-6">
                          {panelMethods.map((method) => (
                            <div key={method.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={method.id}
                                checked={selectedMethods.includes(method.id)}
                                onCheckedChange={() => handlePaymentMethodToggle(method.id)}
                              />
                              <label
                                htmlFor={method.id}
                                className="text-sm font-normal leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                              >
                                {method.label}
                              </label>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                className="px-6"
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-[#e9204f] hover:bg-[#e9204f]/90 text-white px-6"
              >
                {editingTier ? 'Update' : 'Save'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}