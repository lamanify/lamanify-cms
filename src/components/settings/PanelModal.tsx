import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { PhoneInput } from '@/components/ui/phone-input';
import { X } from 'lucide-react';
import { Panel, CreatePanelData } from '@/hooks/usePanels';
import { usePriceTiers } from '@/hooks/usePriceTiers';

interface PanelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreatePanelData) => Promise<boolean>;
  editingPanel?: Panel | null;
}

export function PanelModal({ isOpen, onClose, onSubmit, editingPanel }: PanelModalProps) {
  const { priceTiers } = usePriceTiers();
  const [formData, setFormData] = useState<CreatePanelData>({
    panel_name: '',
    panel_code: '',
    person_in_charge_name: '',
    person_in_charge_phone: '',
    default_status: 'active',
    verification_method: 'manual',
    verification_url: '',
    manual_remarks: '',
    price_tier_ids: []
  });

  useEffect(() => {
    if (editingPanel) {
      setFormData({
        panel_name: editingPanel.panel_name,
        panel_code: editingPanel.panel_code,
        person_in_charge_name: editingPanel.person_in_charge_name || '',
        person_in_charge_phone: editingPanel.person_in_charge_phone || '',
        default_status: editingPanel.default_status,
        verification_method: editingPanel.verification_method,
        verification_url: editingPanel.verification_url || '',
        manual_remarks: editingPanel.manual_remarks || '',
        price_tier_ids: editingPanel.price_tiers?.map(tier => tier.id) || []
      });
    } else {
      setFormData({
        panel_name: '',
        panel_code: '',
        person_in_charge_name: '',
        person_in_charge_phone: '',
        default_status: 'active',
        verification_method: 'manual',
        verification_url: '',
        manual_remarks: '',
        price_tier_ids: []
      });
    }
  }, [editingPanel, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await onSubmit(formData);
    if (success) {
      onClose();
    }
  };

  const handlePriceTierToggle = (tierId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      price_tier_ids: checked 
        ? [...prev.price_tier_ids, tierId]
        : prev.price_tier_ids.filter(id => id !== tierId)
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {editingPanel ? 'Edit Panel' : 'Add Panel'}
            </DialogTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Panel Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Panel Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="panel_name">Panel Name</Label>
                <Input
                  id="panel_name"
                  value={formData.panel_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, panel_name: e.target.value }))}
                  placeholder="MEDKAD"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="panel_code">Panel Code</Label>
                <Input
                  id="panel_code"
                  value={formData.panel_code}
                  onChange={(e) => setFormData(prev => ({ ...prev, panel_code: e.target.value }))}
                  placeholder="ANDA4002"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="person_name">Person in Charge</Label>
                <Input
                  id="person_name"
                  value={formData.person_in_charge_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, person_in_charge_name: e.target.value }))}
                  placeholder="Name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="person_phone">Person in Charge Phone</Label>
                <PhoneInput
                  id="person_phone"
                  value={formData.person_in_charge_phone}
                  onChange={(value) => setFormData(prev => ({ ...prev, person_in_charge_phone: value }))}
                  placeholder="(123) 456-7890"
                />
              </div>

              <div className="space-y-2">
                <Label>Default Status</Label>
                <RadioGroup 
                  value={formData.default_status} 
                  onValueChange={(value: 'active' | 'inactive') => 
                    setFormData(prev => ({ ...prev, default_status: value }))
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="active" id="active" />
                    <Label htmlFor="active">Active</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="inactive" id="inactive" />
                    <Label htmlFor="inactive">Inactive</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            {/* Choose Price Tier */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Choose Price Tier</h3>
              <div className="space-y-3 max-h-48 overflow-y-auto">
                {priceTiers.map((tier) => (
                  <div key={tier.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={tier.id}
                      checked={formData.price_tier_ids.includes(tier.id)}
                      onCheckedChange={(checked) => 
                        handlePriceTierToggle(tier.id, checked as boolean)
                      }
                    />
                    <Label htmlFor={tier.id} className="text-sm font-medium">
                      {tier.tier_name.toUpperCase()}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Panel Verification */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">Panel Verification</h3>
            <p className="text-xs text-muted-foreground">
              Show helpful links or remarks for users to review panel information during registration.
            </p>

            <RadioGroup 
              value={formData.verification_method} 
              onValueChange={(value: 'url' | 'manual') => 
                setFormData(prev => ({ ...prev, verification_method: value }))
              }
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="url" id="url" />
                <Label htmlFor="url">URL to panel platform</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="manual" id="manual" />
                <Label htmlFor="manual">Manual remarks</Label>
              </div>
            </RadioGroup>

            {formData.verification_method === 'url' && (
              <div className="space-y-2">
                <Label htmlFor="verification_url">Panel Verification URL</Label>
                <Input
                  id="verification_url"
                  type="url"
                  value={formData.verification_url}
                  onChange={(e) => setFormData(prev => ({ ...prev, verification_url: e.target.value }))}
                  placeholder="https://panel.medkad.com/login"
                />
              </div>
            )}

            {formData.verification_method === 'manual' && (
              <div className="space-y-2">
                <Label htmlFor="manual_remarks">Manual Remarks</Label>
                <Textarea
                  id="manual_remarks"
                  value={formData.manual_remarks}
                  onChange={(e) => setFormData(prev => ({ ...prev, manual_remarks: e.target.value }))}
                  placeholder="Enter manual verification instructions..."
                  rows={3}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end space-x-2 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {editingPanel ? 'Update' : 'Create'} Panel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}