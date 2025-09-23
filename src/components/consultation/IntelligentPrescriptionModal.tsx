import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { X, AlertTriangle, Package, Unlock, Star, Clock, Search, Check, ChevronsUpDown } from "lucide-react";
import { useMedications, MedicationWithPricing } from "@/hooks/useMedications";
import { useServices } from "@/hooks/useServices";
import { usePriceTiers } from "@/hooks/usePriceTiers";
import { useDosageTemplates } from "@/hooks/useDosageTemplates";

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

interface IntelligentPrescriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (item: PrescriptionItem) => void;
  editItem?: PrescriptionItem | null;
  patientPriceTier?: string; // Auto-selected from patient registration
  patientPaymentMethod?: string; // Patient's payment method for auto-selection
}

export function IntelligentPrescriptionModal({ 
  isOpen, 
  onClose, 
  onAdd, 
  editItem, 
  patientPriceTier,
  patientPaymentMethod 
}: IntelligentPrescriptionModalProps) {
  const { medications, loading: medicationsLoading } = useMedications();
  const { services, loading: servicesLoading } = useServices();
  const { priceTiers } = usePriceTiers();
  const { getTemplateForMedication } = useDosageTemplates();

  // Auto-select price tier based on patient's payment method
  const getAutoSelectedTier = () => {
    if (patientPaymentMethod && priceTiers.length > 0) {
      const matchingTier = priceTiers.find(tier => 
        tier.payment_methods && tier.payment_methods.includes(patientPaymentMethod)
      );
      return matchingTier?.id || patientPriceTier || '';
    }
    return patientPriceTier || '';
  };
  
  const [formData, setFormData] = useState<Omit<PrescriptionItem, 'id'>>({
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

  // Update price tier when component loads or when payment method/tiers change
  useEffect(() => {
    const autoTier = getAutoSelectedTier();
    if (autoTier && formData.priceTier !== autoTier) {
      setFormData(prev => ({ ...prev, priceTier: autoTier }));
    }
  }, [patientPaymentMethod, priceTiers.length]);

  const [searchQuery, setSearchQuery] = useState('');
  const [comboOpen, setComboOpen] = useState(false);
  const [dosageFieldsDisabled, setDosageFieldsDisabled] = useState(false);
  const [stockWarning, setStockWarning] = useState<string | null>(null);
  const [priceWarning, setPriceWarning] = useState<string | null>(null);

  // Get current selected medication for additional info
  const selectedMedication = medications.find(med => med.id === formData.itemId);
  const selectedService = services.find(svc => svc.id === formData.itemId);

  // Filter and sort medications for intelligent display
  const processedMedications = useMemo(() => {
    let filtered = medications.filter(med => {
      const matchesSearch = !searchQuery || 
        med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (med.generic_name && med.generic_name.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    });

    // Sort by stock status and alphabetically
    return filtered.sort((a, b) => {
      // Out of stock items go to bottom
      const aStock = a.stock_level || 0;
      const bStock = b.stock_level || 0;
      
      if (aStock === 0 && bStock > 0) return 1;
      if (bStock === 0 && aStock > 0) return -1;
      
      // Low stock items show prominently  
      if (aStock <= 10 && bStock > 10) return -1;
      if (bStock <= 10 && aStock > 10) return 1;
      
      // Alphabetical
      return a.name.localeCompare(b.name);
    });
  }, [medications, searchQuery]);

  // Filter services for search
  const filteredServices = useMemo(() => {
    return services.filter(service => {
      const matchesSearch = !searchQuery || 
        service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (service.category && service.category.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesSearch;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [services, searchQuery]);

  // Reset form when modal opens/closes
  useEffect(() => {
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
        priceTier: patientPriceTier || '',
        rate: 0,
        amount: 0,
        dosage: '',
        instruction: '',
        frequency: '',
        duration: ''
      });
    }
    setSearchQuery('');
    setComboOpen(false);
    setStockWarning(null);
    setPriceWarning(null);
  }, [editItem, isOpen, patientPriceTier]);

  // Auto-fill system when medication is selected
  useEffect(() => {
    if (formData.itemType === 'medication' && formData.itemId) {
      const medication = medications.find(med => med.id === formData.itemId);
      const dosageTemplate = getTemplateForMedication(formData.itemId);
      
      if (medication?.enable_dosage_settings && dosageTemplate) {
        // Auto-fill from inventory defaults - disable fields
        setDosageFieldsDisabled(true);
        setFormData(prev => ({
          ...prev,
          dosage: dosageTemplate.dosage_amount && dosageTemplate.dosage_unit 
            ? `${dosageTemplate.dosage_amount}${dosageTemplate.dosage_unit}`
            : prev.dosage,
          frequency: dosageTemplate.frequency || prev.frequency,
          duration: dosageTemplate.duration_value && dosageTemplate.duration_unit
            ? `${dosageTemplate.duration_value} ${dosageTemplate.duration_unit}`
            : prev.duration,
          instruction: dosageTemplate.instruction || prev.instruction,
          quantity: dosageTemplate.dispense_quantity || prev.quantity
        }));
      } else {
        // No defaults - enable fields for manual input
        setDosageFieldsDisabled(false);
      }
    } else {
      setDosageFieldsDisabled(false);
    }
  }, [formData.itemType, formData.itemId, medications, getTemplateForMedication]);

  // Auto-fill pricing when item or price tier changes
  useEffect(() => {
    if (formData.itemId && formData.priceTier) {
      let rate = 0;
      
      if (formData.itemType === 'medication') {
        const medication = medications.find(med => med.id === formData.itemId);
        if (medication?.pricing[formData.priceTier]) {
          rate = medication.pricing[formData.priceTier];
        } else {
          setPriceWarning("Selected price tier not available for this medication");
        }
      } else if (formData.itemType === 'service') {
        const service = services.find(svc => svc.id === formData.itemId);
        if (service?.pricing[formData.priceTier]) {
          rate = service.pricing[formData.priceTier];
        } else {
          setPriceWarning("Selected price tier not available for this service");
        }
      }
      
      setFormData(prev => ({ ...prev, rate }));
      if (rate > 0) setPriceWarning(null);
    }
  }, [formData.itemId, formData.priceTier, medications, services]);

  // Stock validation
  useEffect(() => {
    if (formData.itemType === 'medication' && selectedMedication && formData.quantity > 0) {
      const currentStock = selectedMedication.stock_level || 0;
      if (currentStock === 0) {
        setStockWarning("⚠️ This medication is out of stock");
      } else if (formData.quantity > currentStock) {
        setStockWarning(`⚠️ Prescribed quantity (${formData.quantity}) exceeds available stock (${currentStock})`);
      } else if (currentStock <= 10) {
        setStockWarning(`⚠️ Low stock: Only ${currentStock} units remaining`);
      } else {
        setStockWarning(null);
      }
    } else {
      setStockWarning(null);
    }
  }, [formData.quantity, selectedMedication, formData.itemType]);

  // Auto-calculate amount
  useEffect(() => {
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
      // Reset dependent fields but keep auto-selected price tier
      priceTier: getAutoSelectedTier(),
      rate: 0,
      dosage: '',
      instruction: '',
      frequency: '',
      duration: '',
      quantity: 1
    }));
    setComboOpen(false);
    setSearchQuery('');
  };

  const handleSubmit = () => {
    // Validation
    if (!formData.item.trim() || !formData.itemId || !formData.priceTier) {
      return;
    }

    // Additional validation for enabled dosage fields
    if (formData.itemType === 'medication' && !dosageFieldsDisabled) {
      if (!formData.dosage || !formData.frequency) {
        return;
      }
    }
    
    const newItem: PrescriptionItem = {
      id: editItem?.id || `item-${Date.now()}`,
      ...formData
    };
    
    onAdd(newItem);
    onClose();
  };

  const toggleFieldOverride = () => {
    setDosageFieldsDisabled(!dosageFieldsDisabled);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className="h-[90vh] w-[700px] max-w-[90vw] m-0 rounded-none translate-x-0 translate-y-[5vh] top-0 right-0 data-[state=open]:slide-in-from-right data-[state=closed]:slide-out-to-right flex flex-col overflow-hidden"
        style={{ 
          position: 'fixed',
          animation: isOpen ? 'slideInRight 0.3s ease-out' : 'slideOutRight 0.3s ease-out'
        }}
      >
        <DialogHeader className="flex flex-row items-center justify-between border-b pb-4 px-6 pt-4 flex-shrink-0">
          <DialogTitle className="text-lg font-semibold">
            {editItem ? 'Edit Prescription Item' : 'Add Prescription Item'}
          </DialogTitle>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-4 min-h-0">
          {/* Item Selection with Searchable Combobox */}
          <div className="space-y-2">
            <Label>Medication/Service *</Label>
            <Popover open={comboOpen} onOpenChange={setComboOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboOpen}
                  className="w-full justify-between text-left font-normal"
                >
                  {formData.item || "Search and select medication or service..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[650px] p-0 max-h-[400px]" align="start">
                <Command shouldFilter={false}>
                  <CommandInput 
                    placeholder="Search medications by name or generic name..." 
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandList>
                    <CommandEmpty>No results found.</CommandEmpty>
                    
                    {processedMedications.length > 0 && (
                      <CommandGroup heading="Medications">
                        {processedMedications.map((medication) => {
                          const stockLevel = medication.stock_level || 0;
                          const isOutOfStock = stockLevel === 0;
                          const isLowStock = stockLevel <= 10 && stockLevel > 0;
                          const value = `medication:${medication.id}`;
                          const isSelected = formData.itemId === medication.id && formData.itemType === 'medication';
                          
                          return (
                            <CommandItem
                              key={value}
                              value={value}
                              disabled={isOutOfStock}
                              onSelect={() => handleItemSelect(value)}
                              className={`${isOutOfStock ? "opacity-50" : ""} ${isSelected ? "bg-accent" : ""}`}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-medium truncate">{medication.name}</span>
                                  {medication.generic_name && (
                                    <span className="text-xs text-muted-foreground truncate">{medication.generic_name}</span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                  <Badge variant={
                                    isOutOfStock ? "destructive" : 
                                    isLowStock ? "secondary" : "outline"
                                  } className="text-xs">
                                    {isOutOfStock ? "Out of Stock" : `Stock: ${stockLevel}`}
                                  </Badge>
                                  {medication.unit_of_measure && (
                                    <Badge variant="outline" className="text-xs">
                                      {medication.unit_of_measure}
                                    </Badge>
                                  )}
                                  {isSelected && <Check className="h-4 w-4" />}
                                </div>
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}
                    
                    {filteredServices.length > 0 && (
                      <CommandGroup heading="Services">
                        {filteredServices.map((service) => {
                          const value = `service:${service.id}`;
                          const isSelected = formData.itemId === service.id && formData.itemType === 'service';
                          
                          return (
                            <CommandItem
                              key={value}
                              value={value}
                              onSelect={() => handleItemSelect(value)}
                              className={isSelected ? "bg-accent" : ""}
                            >
                              <div className="flex items-center justify-between w-full">
                                <div className="flex flex-col min-w-0 flex-1">
                                  <span className="font-medium truncate">{service.name}</span>
                                  {service.category && (
                                    <span className="text-xs text-muted-foreground truncate">{service.category}</span>
                                  )}
                                </div>
                                {isSelected && <Check className="h-4 w-4 flex-shrink-0 ml-2" />}
                              </div>
                            </CommandItem>
                          );
                        })}
                      </CommandGroup>
                    )}
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Stock Warning */}
          {stockWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{stockWarning}</AlertDescription>
            </Alert>
          )}

          {/* Quantity and Unit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">
                Quantity * 
                {selectedMedication && (
                  <span className="text-sm text-muted-foreground ml-1">
                    (per {selectedMedication.unit_of_measure || 'unit'})
                  </span>
                )}
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
              />
            </div>
            
            {selectedMedication && (
              <div className="space-y-2">
                <Label>Unit of Measure</Label>
                <div className="flex items-center h-10 px-3 py-2 border rounded-md bg-muted">
                  <Package className="h-4 w-4 mr-2" />
                  <span className="text-sm">{selectedMedication.unit_of_measure || 'Unit'}</span>
                </div>
              </div>
            )}
          </div>

          {/* Price Tier and Rate */}
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
                      <div className="flex items-center justify-between w-full">
                        <span>{tier.tier_name}</span>
                        {formData.priceTier === tier.id && getAutoSelectedTier() === tier.id && (
                          <Badge variant="secondary" className="ml-2 text-xs">
                            {patientPaymentMethod ? 'Auto-selected' : 'Patient Tier'}
                          </Badge>
                        )}
                      </div>
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

          {/* Price Warning */}
          {priceWarning && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{priceWarning}</AlertDescription>
            </Alert>
          )}

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Total Amount (Auto-calculated)</Label>
            <Input
              id="amount"
              type="text"
              value={`RM ${formData.amount.toFixed(2)}`}
              readOnly
              className="bg-muted font-medium"
            />
          </div>

          {/* Dosage Fields for Medications */}
          {formData.itemType === 'medication' && (
            <div className="space-y-4 border-t pt-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Dosage Information</Label>
                {dosageFieldsDisabled && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={toggleFieldOverride}
                    className="text-xs"
                  >
                    <Unlock className="h-3 w-3 mr-1" />
                    Override
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dosage">
                    Dosage *
                    {dosageFieldsDisabled && <span className="text-xs text-muted-foreground ml-1">(Auto-filled)</span>}
                  </Label>
                  <Input
                    id="dosage"
                    value={formData.dosage}
                    onChange={(e) => setFormData(prev => ({ ...prev, dosage: e.target.value }))}
                    placeholder="e.g., 500mg"
                    disabled={dosageFieldsDisabled}
                    className={dosageFieldsDisabled ? "bg-muted" : ""}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="frequency">
                    Frequency *
                    {dosageFieldsDisabled && <span className="text-xs text-muted-foreground ml-1">(Auto-filled)</span>}
                  </Label>
                  <Select 
                    value={formData.frequency} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, frequency: value }))}
                    disabled={dosageFieldsDisabled}
                  >
                    <SelectTrigger className={dosageFieldsDisabled ? "bg-muted" : ""}>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Once daily">Once daily</SelectItem>
                      <SelectItem value="Twice daily">Twice daily</SelectItem>
                      <SelectItem value="Three times daily">Three times daily</SelectItem>
                      <SelectItem value="Four times daily">Four times daily</SelectItem>
                      <SelectItem value="As needed">As needed</SelectItem>
                      <SelectItem value="Every 4 hours">Every 4 hours</SelectItem>
                      <SelectItem value="Every 6 hours">Every 6 hours</SelectItem>
                      <SelectItem value="Every 8 hours">Every 8 hours</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration">
                  Duration
                  {dosageFieldsDisabled && <span className="text-xs text-muted-foreground ml-1">(Auto-filled)</span>}
                </Label>
                <Input
                  id="duration"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                  placeholder="e.g., 7 days, 2 weeks"
                  disabled={dosageFieldsDisabled}
                  className={dosageFieldsDisabled ? "bg-muted" : ""}
                />
              </div>
            </div>
          )}

          {/* Instructions */}
          <div className="space-y-2">
            <Label htmlFor="instruction">
              Instructions
              {dosageFieldsDisabled && formData.itemType === 'medication' && 
                <span className="text-xs text-muted-foreground ml-1">(Auto-filled)</span>
              }
            </Label>
            <Textarea
              id="instruction"
              value={formData.instruction}
              onChange={(e) => setFormData(prev => ({ ...prev, instruction: e.target.value }))}
              placeholder="Additional instructions for patient"
              rows={2}
              className={`resize-none ${dosageFieldsDisabled && formData.itemType === 'medication' ? "bg-muted" : ""}`}
              disabled={dosageFieldsDisabled && formData.itemType === 'medication'}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t pt-4 px-6 pb-4 flex-shrink-0 bg-background">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={
              !formData.item.trim() || 
              !formData.itemId || 
              !formData.priceTier ||
              (formData.itemType === 'medication' && !dosageFieldsDisabled && (!formData.dosage || !formData.frequency)) ||
              (stockWarning && stockWarning.includes('out of stock'))
            }
          >
            {editItem ? 'Update' : 'Add'} Item
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
