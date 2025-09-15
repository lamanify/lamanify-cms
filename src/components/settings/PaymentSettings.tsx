import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { CreditCard, DollarSign, Receipt, Percent } from 'lucide-react';
import { useClinicSettings } from '@/hooks/useClinicSettings';
import { useToast } from '@/hooks/use-toast';

interface PaymentSettingsProps {
  onBack: () => void;
}

interface PaymentForm {
  default_currency: string;
  tax_rate: number;
  price_rounding: string;
  receipt_template: string;
  payment_methods: string[];
  require_payment_confirmation: boolean;
}

const currencies = [
  { value: 'MYR', label: 'Malaysian Ringgit (MYR)' },
  { value: 'USD', label: 'US Dollar (USD)' },
  { value: 'SGD', label: 'Singapore Dollar (SGD)' },
  { value: 'EUR', label: 'Euro (EUR)' },
  { value: 'GBP', label: 'British Pound (GBP)' },
];

const roundingOptions = [
  { value: 'nearest_cent', label: 'Nearest Cent' },
  { value: 'round_up', label: 'Round Up' },
  { value: 'round_down', label: 'Round Down' },
];

const receiptTemplates = [
  { value: 'standard', label: 'Standard Receipt' },
  { value: 'detailed', label: 'Detailed Receipt' },
  { value: 'minimal', label: 'Minimal Receipt' },
];

const availablePaymentMethods = [
  { id: 'cash', label: 'Cash' },
  { id: 'card', label: 'Credit/Debit Card' },
  { id: 'bank_transfer', label: 'Bank Transfer' },
  { id: 'ewallet', label: 'E-Wallet' },
  { id: 'cheque', label: 'Cheque' },
  { id: 'insurance', label: 'Insurance' },
];

export function PaymentSettings({ onBack }: PaymentSettingsProps) {
  const { getSettingValue, updateMultipleSettings, loading } = useClinicSettings();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<PaymentForm>({
    defaultValues: {
      default_currency: 'MYR',
      tax_rate: 0,
      price_rounding: 'nearest_cent',
      receipt_template: 'standard',
      payment_methods: ['cash', 'card'],
      require_payment_confirmation: false,
    }
  });

  useEffect(() => {
    if (!loading) {
      const paymentMethods = getSettingValue('payment', 'payment_methods', ['cash', 'card']);
      
      form.reset({
        default_currency: getSettingValue('payment', 'default_currency', 'MYR'),
        tax_rate: getSettingValue('payment', 'tax_rate', 0),
        price_rounding: getSettingValue('payment', 'price_rounding', 'nearest_cent'),
        receipt_template: getSettingValue('payment', 'receipt_template', 'standard'),
        payment_methods: Array.isArray(paymentMethods) ? paymentMethods : ['cash', 'card'],
        require_payment_confirmation: getSettingValue('payment', 'require_payment_confirmation', false),
      });
    }
  }, [loading, getSettingValue, form]);

  const onSubmit = async (data: PaymentForm) => {
    setIsSubmitting(true);
    
    const updates = [
      { category: 'payment', key: 'default_currency', value: data.default_currency },
      { category: 'payment', key: 'tax_rate', value: data.tax_rate },
      { category: 'payment', key: 'price_rounding', value: data.price_rounding },
      { category: 'payment', key: 'receipt_template', value: data.receipt_template },
      { category: 'payment', key: 'payment_methods', value: data.payment_methods },
      { category: 'payment', key: 'require_payment_confirmation', value: data.require_payment_confirmation },
    ];

    const success = await updateMultipleSettings(updates);
    if (success) {
      toast({
        title: "Settings Saved",
        description: "Payment and billing settings have been updated successfully",
      });
    }
    
    setIsSubmitting(false);
  };

  const handlePaymentMethodChange = (methodId: string, checked: boolean) => {
    const currentMethods = form.watch('payment_methods');
    if (checked) {
      form.setValue('payment_methods', [...currentMethods, methodId]);
    } else {
      form.setValue('payment_methods', currentMethods.filter(m => m !== methodId));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <CreditCard className="h-6 w-6" />
          Payment & Billing Settings
        </h2>
        <p className="text-muted-foreground">
          Configure currency, tax rates, payment methods, and billing preferences.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Currency & Tax Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Currency & Tax Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="default_currency">Default Currency</Label>
                <Select
                  value={form.watch('default_currency')}
                  onValueChange={(value) => form.setValue('default_currency', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.value} value={currency.value}>
                        {currency.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">
                  Default currency for all transactions
                </p>
              </div>
              <div>
                <Label htmlFor="tax_rate">Tax Rate (%)</Label>
                <Input
                  id="tax_rate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  {...form.register('tax_rate', { 
                    required: 'Tax rate is required',
                    min: { value: 0, message: 'Must be 0 or greater' },
                    max: { value: 100, message: 'Cannot exceed 100%' }
                  })}
                />
                {form.formState.errors.tax_rate && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.tax_rate.message}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-1">
                  Default tax rate (e.g., 6 for 6% GST)
                </p>
              </div>
            </div>
            <div>
              <Label htmlFor="price_rounding">Price Rounding</Label>
              <Select
                value={form.watch('price_rounding')}
                onValueChange={(value) => form.setValue('price_rounding', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roundingOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                How to round final prices
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Available Payment Methods
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {availablePaymentMethods.map((method) => (
                <div key={method.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={method.id}
                    checked={form.watch('payment_methods').includes(method.id)}
                    onCheckedChange={(checked) => handlePaymentMethodChange(method.id, checked as boolean)}
                  />
                  <Label htmlFor={method.id} className="text-sm">
                    {method.label}
                  </Label>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              Select which payment methods are available for patients
            </p>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5" />
              Receipt Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="receipt_template">Receipt Template</Label>
              <Select
                value={form.watch('receipt_template')}
                onValueChange={(value) => form.setValue('receipt_template', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {receiptTemplates.map((template) => (
                    <SelectItem key={template.value} value={template.value}>
                      {template.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Default template for generating receipts
              </p>
            </div>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="require_payment_confirmation">Require Payment Confirmation</Label>
                <p className="text-xs text-muted-foreground">
                  Staff must confirm payment details before processing
                </p>
              </div>
              <Switch
                id="require_payment_confirmation"
                checked={form.watch('require_payment_confirmation')}
                onCheckedChange={(checked) => form.setValue('require_payment_confirmation', checked)}
              />
            </div>
          </CardContent>
        </Card>

        {/* Preview Information */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-green-800 flex items-center gap-2">
                <Percent className="h-4 w-4" />
                Current Settings Preview
              </h4>
              <div className="space-y-1 text-xs text-green-700">
                <div><strong>Currency:</strong> {form.watch('default_currency')}</div>
                <div><strong>Tax Rate:</strong> {form.watch('tax_rate')}%</div>
                <div><strong>Payment Methods:</strong> {form.watch('payment_methods').length} selected</div>
                <div><strong>Rounding:</strong> {roundingOptions.find(r => r.value === form.watch('price_rounding'))?.label}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </div>
  );
}