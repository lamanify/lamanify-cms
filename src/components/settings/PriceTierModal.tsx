import { useState, useEffect } from 'react';
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
import { usePanels } from '@/hooks/usePanels';

const priceTierSchema = z.object({
  tier_name: z.string().min(1, 'Tier name is required'),
  description: z.string().optional(),
  payment_methods: z.array(z.string()).min(1, 'At least one payment method must be selected'),
  panel_ids: z.array(z.string()).optional().default([])
});

type PriceTierFormData = z.infer<typeof priceTierSchema>;

const PAYMENT_METHODS = [
  { id: 'credit_card', label: 'Credit Card' },
  { id: 'voucher', label: 'Voucher' },
  { id: 'e_wallet', label: 'E Wallet' },
  { id: 'qr_pay', label: 'QR Pay' },
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Card' }
];

interface PriceTierModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingTier?: {
    id: string;
    tier_name: string;
    description?: string;
    payment_methods?: string[];
    panel_ids?: string[];
  } | null;
  onSubmit: (data: { tier_name: string; description?: string; payment_methods: string[]; panel_ids: string[] }) => Promise<boolean>;
}

export function PriceTierModal({ open, onOpenChange, editingTier, onSubmit }: PriceTierModalProps) {
  const [selectedMethods, setSelectedMethods] = useState<string[]>([]);
  const [selectedPanels, setSelectedPanels] = useState<string[]>([]);
  const { panels, loading: panelsLoading } = usePanels();

  const form = useForm<PriceTierFormData>({
    resolver: zodResolver(priceTierSchema),
    defaultValues: {
      tier_name: '',
      description: '',
      payment_methods: [],
      panel_ids: []
    }
  });

  // Update form and selected methods when editingTier changes
  useEffect(() => {
    if (editingTier) {
      const methods = editingTier.payment_methods || [];
      const panelIds = editingTier.panel_ids || [];
      setSelectedMethods(methods);
      setSelectedPanels(panelIds);
      form.reset({
        tier_name: editingTier.tier_name,
        description: editingTier.description || '',
        payment_methods: methods,
        panel_ids: panelIds
      });
    } else {
      setSelectedMethods([]);
      setSelectedPanels([]);
      form.reset({
        tier_name: '',
        description: '',
        payment_methods: [],
        panel_ids: []
      });
    }
  }, [editingTier, form]);

  const handlePaymentMethodToggle = (methodId: string) => {
    const newMethods = selectedMethods.includes(methodId)
      ? selectedMethods.filter(id => id !== methodId)
      : [...selectedMethods, methodId];
    
    setSelectedMethods(newMethods);
    form.setValue('payment_methods', newMethods);
  };

  const handlePanelToggle = (panelId: string) => {
    const newPanels = selectedPanels.includes(panelId)
      ? selectedPanels.filter(id => id !== panelId)
      : [...selectedPanels, panelId];
    
    setSelectedPanels(newPanels);
    form.setValue('panel_ids', newPanels);
  };

  const handleSubmit = async (data: PriceTierFormData) => {
    console.log('Form submitted with data:', data);
    console.log('Selected methods:', selectedMethods);
    console.log('Selected panels:', selectedPanels);
    
    try {
      const success = await onSubmit({
        tier_name: data.tier_name,
        description: data.description,
        payment_methods: selectedMethods,
        panel_ids: selectedPanels
      });

      console.log('Submit result:', success);

      if (success) {
        form.reset();
        setSelectedMethods([]);
        setSelectedPanels([]);
        onOpenChange(false);
      }
    } catch (error) {
      console.error('Error in handleSubmit:', error);
    }
  };

  const handleCancel = () => {
    if (editingTier) {
      const methods = editingTier.payment_methods || [];
      const panelIds = editingTier.panel_ids || [];
      setSelectedMethods(methods);
      setSelectedPanels(panelIds);
      form.reset({
        tier_name: editingTier.tier_name,
        description: editingTier.description || '',
        payment_methods: methods,
        panel_ids: panelIds
      });
    } else {
      setSelectedMethods([]);
      setSelectedPanels([]);
      form.reset({
        tier_name: '',
        description: '',
        payment_methods: [],
        panel_ids: []
      });
    }
    onOpenChange(false);
  };


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

                {/* Payment Methods Section */}
                <FormField
                  control={form.control}
                  name="payment_methods"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Payment Methods</FormLabel>
                      
                      <div className="space-y-3 mt-3">
                        {/* Payment Methods */}
                        <div className="space-y-2">
                          {PAYMENT_METHODS.map((method) => (
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

              {/* Right Column - Panel Selection */}
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="panel_ids"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">Associated Panels</FormLabel>
                      <div className="text-xs text-muted-foreground mb-3">
                        Select panels that will use this pricing tier. If no panels are selected, this tier can be used for self-pay or custom pricing.
                      </div>
                      
                      <div className="border rounded-lg p-4 max-h-80 overflow-y-auto">
                        {panelsLoading ? (
                          <div className="text-sm text-muted-foreground">Loading panels...</div>
                        ) : panels.length === 0 ? (
                          <div className="text-sm text-muted-foreground">
                            No panels available. Create panels first in Panel Management.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {panels.map((panel) => (
                              <div key={panel.id} className="flex items-start space-x-2">
                                <Checkbox
                                  id={`panel-${panel.id}`}
                                  checked={selectedPanels.includes(panel.id)}
                                  onCheckedChange={() => handlePanelToggle(panel.id)}
                                />
                                <div className="grid gap-1 leading-none">
                                  <label
                                    htmlFor={`panel-${panel.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                  >
                                    {panel.panel_name}
                                  </label>
                                  <p className="text-xs text-muted-foreground">
                                    Code: {panel.panel_code} • Status: {panel.default_status}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
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