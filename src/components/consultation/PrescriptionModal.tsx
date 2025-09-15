import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { X } from "lucide-react";

interface PrescriptionItem {
  id: string;
  item: string;
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
  const [formData, setFormData] = useState<Omit<PrescriptionItem, 'id'>>({
    item: editItem?.item || '',
    quantity: editItem?.quantity || 1,
    priceTier: editItem?.priceTier || 'Standard',
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
        quantity: 1,
        priceTier: 'Standard',
        rate: 0,
        amount: 0,
        dosage: '',
        instruction: '',
        frequency: '',
        duration: ''
      });
    }
  }, [editItem, isOpen]);

  React.useEffect(() => {
    const amount = formData.quantity * formData.rate;
    setFormData(prev => ({ ...prev, amount }));
  }, [formData.quantity, formData.rate]);

  const handleSubmit = () => {
    if (!formData.item.trim()) return;
    
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
        className="h-[90vh] w-3/5 max-w-none m-0 rounded-none translate-x-2/5 translate-y-[5vh] top-0 right-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right flex flex-col overflow-hidden"
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
              <Input
                id="item"
                value={formData.item}
                onChange={(e) => setFormData(prev => ({ ...prev, item: e.target.value }))}
                placeholder="Medicine/Service name"
              />
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
              <Label htmlFor="priceTier">Price Tier</Label>
              <Select value={formData.priceTier} onValueChange={(value) => setFormData(prev => ({ ...prev, priceTier: value }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Insurance">Insurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="rate">Rate</Label>
              <Input
                id="rate"
                type="number"
                min="0"
                step="0.01"
                value={formData.rate}
                onChange={(e) => setFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                placeholder="0.00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount.toFixed(2)}
              readOnly
              className="bg-muted"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosage</Label>
              <Input
                id="dosage"
                value={formData.dosage}
                onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                placeholder="e.g., 500mg"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
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

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              value={formData.duration}
              onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
              placeholder="e.g., 7 days, 2 weeks"
            />
          </div>

            <div className="space-y-2">
              <Label htmlFor="instruction">Instructions</Label>
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

          <div className="flex justify-end gap-3 border-t pt-4 mt-6 flex-shrink-0">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!formData.item.trim()}>
              {editItem ? 'Update' : 'Add'} Item
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}