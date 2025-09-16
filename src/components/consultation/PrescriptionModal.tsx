import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";
import { useMedications, MedicationWithPricing } from "@/hooks/useMedications";
import { useServices } from "@/hooks/useServices";
import { usePriceTiers } from "@/hooks/usePriceTiers";

interface PrescriptionItem {
  id: string;
  item: string;
  itemId: string;
  itemType: 'medication' | 'service';
  quantity: number;
  priceTier: string;
  rate: number;
  amount: number;
  dosage: string;
  instruction: string;
  frequency: string;
  duration: string;
}

interface PrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: PrescriptionItem) => void;
  editItem?: PrescriptionItem | null;
}

export function PrescriptionModal({ isOpen, onClose, onAdd, editItem }: PrescriptionModalProps) {
  const { medications, loading: medicationsLoading } = useMedications();
  const { services, loading: servicesLoading } = useServices();
  const { priceTiers } = usePriceTiers();
  
  const [formData, setFormData] = useState<Omit<PrescriptionItem, 'id'>>({
    item: editItem?.item || '',
    itemId: editItem?.itemId || '',
    itemType: editItem?.itemType || 'medication',
    quantity: editItem?.quantity || 1,
    priceTier: editItem?.priceTier || '',
    rate: editItem?.rate || 0,
    amount: editItem?.amount || 0,
    dosage: editItem?.dosage || '',
    instruction: editItem?.instruction || '',
    frequency: editItem?.frequency || '',
    duration: editItem?.duration || ''
  });

  React.useEffect(() => {
    if (editItem) {
      setFormData({
        item: editItem.item,
        itemId: editItem.itemId,
        itemType: editItem.itemType,
        quantity: editItem.quantity,
        priceTier: editItem.priceTier,
        rate: editItem.rate,
        amount: editItem.amount,
        dosage: editItem.dosage,
        instruction: editItem.instruction,
        frequency: editItem.frequency,
        duration: editItem.duration
      });
    } else {
      setFormData({
        item: '',
        itemId: '',
        itemType: 'medication',
        quantity: 1,
        priceTier: '',
        rate: 0,
        amount: 0,
        dosage: '',
        instruction: '',
        frequency: '',
        duration: ''
      });
    }
  }, [editItem, isOpen]);

  // Auto-fill pricing when item or price tier changes
  React.useEffect(() => {
    if (formData.itemId && formData.priceTier) {
      let rate = 0;
      
      if (formData.itemType === 'medication') {
        const medication = medications.find(med => med.id === formData.itemId);
        if (medication?.pricing[formData.priceTier]) {
          rate = medication.pricing[formData.priceTier];
        }
      } else if (formData.itemType === 'service') {
        const service = services.find(svc => svc.id === formData.itemId);
        if (service?.pricing[formData.priceTier]) {
          rate = service.pricing[formData.priceTier];
        }
      }
      
      setFormData(prev => ({ ...prev, rate }));
    }
  }, [formData.itemId, formData.priceTier, medications, services]);

  // Auto-fill dosage information when medication is selected
  React.useEffect(() => {
    if (formData.itemType === 'medication' && formData.itemId) {
      const medication = medications.find(med => med.id === formData.itemId);
      if (medication?.dosage_template) {
        const template = medication.dosage_template;
        setFormData(prev => ({
          ...prev,
          dosage: template.dosage_amount && template.dosage_unit 
            ? `${template.dosage_amount}${template.dosage_unit}` 
            : prev.dosage,
          instruction: template.instruction || prev.instruction,
          frequency: template.frequency || prev.frequency,
          duration: template.duration_value && template.duration_unit 
            ? `${template.duration_value} ${template.duration_unit}` 
            : prev.duration,
          quantity: template.dispense_quantity || prev.quantity
        }));
      }
    }
  }, [formData.itemType, formData.itemId, medications]);

  React.useEffect(() => {
    const amount = formData.quantity * formData.rate;
    setFormData(prev => ({ ...prev, amount }));
  }, [formData.quantity, formData.rate]);

  const handleItemSelect = (value: string) => {
    const [itemType, itemId] = value.split(':');
    let itemName = '';
    
    if (itemType === 'medication') {
      const medication = medications.find(med => med.id === itemId);
      itemName = medication?.name || '';
    } else if (itemType === 'service') {
      const service = services.find(svc => svc.id === itemId);
      itemName = service?.name || '';
    }
    
    setFormData(prev => ({
      ...prev,
      itemId,
      itemType: itemType as 'medication' | 'service',
      item: itemName,
      // Reset dependent fields
      priceTier: '',
      rate: 0,
      dosage: '',
      instruction: '',
      frequency: '',
      duration: ''
    }));
  };

  const handleSubmit = () => {
    if (!formData.item.trim() || !formData.itemId || !formData.priceTier) return;
    
    const newItem: PrescriptionItem = {
      id: editItem?.id || `item-${Date.now()}`,
      ...formData
    };
    
    onAdd(newItem);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="h-[90vh] w-[600px] max-w-[90vw] m-0 rounded-none translate-x-0 translate-y-[5vh] top-0 right-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right flex flex-col overflow-hidden"
        style={{ 
          position: 'fixed',
          animation: isOpen ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-out'
        }}
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 px-6 pt-4 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">{editItem ? 'Edit Prescription Item' : 'Add Prescription Item'}</DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item">Item *</Label>
              <Select 
                value={formData.itemId ? `${formData.itemType}:${formData.itemId}` : ''} 
                onValueChange={handleItemSelect}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select medication or service" />
                </SelectTrigger>
                <SelectContent>
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Medications</div>
                  {medications.map((medication) => (
                    <SelectItem key={`medication:${medication.id}`} value={`medication:${medication.id}`}>
                      <div className="flex flex-col">
                        <span>{medication.name}</span>
                        {medication.generic_name && (
                          <span className="text-xs text-muted-foreground">{medication.generic_name}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Services</div>
                  {services.map((service) => (
                    <SelectItem key={`service:${service.id}`} value={`service:${service.id}`}>
                      <div className="flex flex-col">
                        <span>{service.name}</span>
                        {service.category && (
                          <span className="text-xs text-muted-foreground">{service.category}</span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priceTier">Price Tier *</Label>
              <Select 
                value={formData.priceTier} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, priceTier: value }))}
                disabled={!formData.itemId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select price tier" />
                </SelectTrigger>
                <SelectContent>
                  {priceTiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      {tier.tier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rate">Rate (Auto-filled)</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.rate}
                readOnly
                className="bg-muted"
                placeholder="Select item and tier first"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (Auto-calculated)</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount.toFixed(2)}
              readOnly
              className="bg-muted"
            />
          </div>

          {formData.itemType === 'medication' && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="dosage">Dosage (Auto-filled from template)</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                  placeholder="e.g., 500mg"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency (Auto-filled from template)</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Once daily">Once daily</SelectItem>
                    <SelectItem value="Twice daily">Twice daily</SelectItem>
                    <SelectItem value="Three times daily">Three times daily</SelectItem>
                    <SelectItem value="Four times daily">Four times daily</SelectItem>
                    <SelectItem value="As needed">As needed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {formData.itemType === 'medication' && (
            <div className="space-y-2">
              <Label htmlFor="duration">Duration (Auto-filled from template)</Label>
              <Input
                id="duration"
                value={formData.duration}
                onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                placeholder="e.g., 7 days, 2 weeks"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="instruction">Instructions (Auto-filled from template)</Label>
            <Textarea
              id="instruction"
              value={formData.instruction}
              onChange={(e) => setFormData(prev => ({ ...prev, instruction: e.target.value }))}
              placeholder="Additional instructions for patient"
              rows={2}
              className="resize-none"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4 px-6 pb-4 flex-shrink-0 bg-background">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!formData.item.trim() || !formData.itemId || !formData.priceTier}>
            {editItem ? 'Update' : 'Add'} Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}