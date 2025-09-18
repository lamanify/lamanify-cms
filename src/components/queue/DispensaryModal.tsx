import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { QueueEntry } from '@/hooks/useQueue';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueueSessionSync } from '@/hooks/useQueueSessionSync';
import { PrinterIcon, EditIcon, TrashIcon, FileTextIcon, DollarSignIcon, PlusIcon, SearchIcon, SaveIcon, XIcon } from 'lucide-react';
import { PrintInvoice } from './PrintInvoice';
import { PaymentModal } from './PaymentModal';
import { PaymentHistory } from './PaymentHistory';
import { AdjustmentModal } from './AdjustmentModal';
import { useMedications } from '@/hooks/useMedications';
import { useServices } from '@/hooks/useServices';
import { useTierPricing } from '@/hooks/useTierPricing';
import { useHeaderSettings } from '@/hooks/useHeaderSettings';
import { usePayments } from '@/hooks/usePayments';

interface TreatmentItem {
  id: string;
  item_type: 'medication' | 'service';
  medication_id?: string;
  service_id?: string;
  quantity: number;
  dosage_instructions?: string;
  frequency?: string;
  duration_days?: number;
  rate: number;
  total_amount: number;
  notes?: string;
  medication?: {
    name: string;
    brand_name?: string;
  };
  service?: {
    name: string;
    description?: string;
  };
}

interface DispensaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueEntry: QueueEntry | null;
  onStatusChange: (queueId: string, status: string) => void;
}

export function DispensaryModal({ isOpen, onClose, queueEntry, onStatusChange }: DispensaryModalProps) {
  const [treatmentItems, setTreatmentItems] = useState<TreatmentItem[]>([]);
  const [consultationNotes, setConsultationNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showAdjustmentModal, setShowAdjustmentModal] = useState(false);
  const [currentVisitId, setCurrentVisitId] = useState<string | null>(null);
  const [adjustments, setAdjustments] = useState<Array<{
    id: string;
    type: 'add' | 'deduct';
    amountType: 'fixed' | 'percentage';
    amount: number;
    description: string;
  }>>([]);

  // Edit state management
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<TreatmentItem>>({});
  
  // Invoice edit mode state
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [addItemMode, setAddItemMode] = useState<'medication' | 'service' | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [newItemData, setNewItemData] = useState<{
    quantity: number;
    rate: number;
    dosage?: string;
    frequency?: string;
    duration?: number;
    notes?: string;
  }>({ quantity: 1, rate: 0 });
  const [originalItems, setOriginalItems] = useState<TreatmentItem[]>([]);

  const { toast } = useToast();
  const { sessionData, refreshSessionData, saveSessionData } = useQueueSessionSync(queueEntry?.id || null);
  const { medications } = useMedications();
  const { services } = useServices();
  const { getPatientTier, getMedicationWithTierPricing, getServiceWithTierPricing } = useTierPricing();
  const { headerSettings } = useHeaderSettings();
  
  // Initialize payments hook with current visit ID
  const { 
    payments, 
    summary, 
    loading: paymentsLoading, 
    addPayment, 
    deletePayment,
    refresh: refreshPayments
  } = usePayments(currentVisitId || undefined);

  const totalAmount = treatmentItems.reduce((sum, item) => sum + item.total_amount, 0);
  
  // Calculate adjustments total
  const adjustmentsTotal = adjustments.reduce((sum, adj) => {
    const adjustmentAmount = adj.amountType === 'percentage' 
      ? (totalAmount * adj.amount) / 100 
      : adj.amount;
    return sum + (adj.type === 'add' ? adjustmentAmount : -adjustmentAmount);
  }, 0);
  
  // Final total after adjustments
  const finalTotal = Math.max(0, totalAmount + adjustmentsTotal);

  useEffect(() => {
    if (isOpen && queueEntry) {
      refreshSessionData();
      setTreatmentItems([]);
      setConsultationNotes('');
      setAdjustments([]);
    }
  }, [isOpen, queueEntry, refreshSessionData]);

  useEffect(() => {
    if (sessionData && isOpen) {
      // Load session data when available
      if (sessionData.treatment_items) {
        setTreatmentItems(sessionData.treatment_items);
      }
      if (sessionData.consultation_notes) {
        setConsultationNotes(sessionData.consultation_notes);
      }
      
      // Set current visit ID from session data for payment tracking
      if (sessionData.visit_id) {
        setCurrentVisitId(sessionData.visit_id);
      }
    } else if (isOpen) {
      // If no session data, clear the items
      setTreatmentItems([]);
      setConsultationNotes('');
    }
  }, [sessionData, isOpen]);

  // Handle adjustment confirmation
  const handleAdjustmentConfirm = (adjustment: {
    type: 'add' | 'deduct';
    amountType: 'fixed' | 'percentage';
    amount: number;
  }) => {
    const newAdjustment = {
      id: Date.now().toString(),
      ...adjustment,
      description: `${adjustment.type === 'add' ? 'Addition' : 'Discount'} - ${
        adjustment.amountType === 'fixed' 
          ? `RM${adjustment.amount.toFixed(2)}` 
          : `${adjustment.amount}%`
      }`
    };
    
    setAdjustments(prev => [...prev, newAdjustment]);
    
    toast({
      title: "Adjustment Added",
      description: newAdjustment.description,
    });
  };

  // Remove adjustment
  const removeAdjustment = (adjustmentId: string) => {
    setAdjustments(prev => prev.filter(adj => adj.id !== adjustmentId));
    toast({
      title: "Adjustment Removed",
      description: "The adjustment has been removed from the invoice",
    });
  };

  // Complete and finalize patient visit
  const handleCompleteVisit = async () => {
    if (!queueEntry) return;

    setLoading(true);
    try {
      // Check if payment is required and if there's an outstanding balance
      // Use finalTotal instead of summary.total_amount to account for adjustments
      const outstandingAmount = finalTotal - summary.total_paid;
      if (outstandingAmount > 0) {
        toast({
          title: "Payment Required",
          description: `Outstanding balance of RM${outstandingAmount.toFixed(2)} must be paid before completing the visit`,
          variant: "destructive",
        });
        return;
      }

      // Update queue status to completed
      onStatusChange(queueEntry.id, 'completed');
      
      toast({
        title: "Visit Completed",
        description: "Patient visit has been marked as completed",
      });
      
      onClose();
    } catch (error: any) {
      toast({
        title: "Error completing visit",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Print medication label functionality
  const handlePrintLabel = (medicationItem: TreatmentItem) => {
    if (!queueEntry?.patient || !headerSettings) return;

    const labelHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Medication Label</title>
          <style>
            @page { size: 70mm 35mm; margin: 2mm; }
            body { 
              font-family: Arial, sans-serif; 
              font-size: 8pt; 
              line-height: 1.2; 
              margin: 0; 
              padding: 2mm;
              width: 66mm;
              height: 31mm;
            }
            .clinic-header { 
              text-align: center; 
              font-weight: bold; 
              font-size: 9pt; 
              margin-bottom: 2mm; 
              border-bottom: 1px solid #000;
              padding-bottom: 1mm;
            }
            .patient-info { margin: 1mm 0; }
            .medication-name { 
              font-weight: bold; 
              font-size: 10pt; 
              text-transform: uppercase; 
              margin: 1mm 0; 
            }
            .dosage-info { margin: 1mm 0; }
            .warning { 
              font-size: 7pt; 
              text-align: center; 
              margin-top: 2mm; 
              border-top: 1px solid #000;
              padding-top: 1mm;
            }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="clinic-header">
            ${headerSettings.clinic_name || 'KLINIK'}<br>
            ${headerSettings.address ? headerSettings.address.split('\n')[0] : ''}<br>
            ${headerSettings.phone || ''}
          </div>
          
          <div class="patient-info">
            <strong>Patient:</strong> ${queueEntry.patient.first_name} ${queueEntry.patient.last_name}<br>
            <strong>Date:</strong> ${new Date().toLocaleDateString('en-GB')}
          </div>
          
          <div class="medication-name">
            ${medicationItem.medication?.name || 'MEDICATION'}
          </div>
          
          <div class="dosage-info">
            <strong>Qty:</strong> ${medicationItem.quantity} ${medicationItem.medication?.name?.toLowerCase().includes('tablet') ? 'tablets' : 'units'}<br>
            ${medicationItem.dosage_instructions ? `<strong>DOSAGE:</strong> ${medicationItem.dosage_instructions}<br>` : ''}
            ${medicationItem.frequency ? `<strong>FREQUENCY:</strong> ${medicationItem.frequency}<br>` : ''}
            ${medicationItem.duration_days ? `<strong>DURATION:</strong> ${medicationItem.duration_days} days<br>` : ''}
            ${medicationItem.notes ? `<strong>INSTRUCTIONS:</strong> ${medicationItem.notes}<br>` : ''}
          </div>
          
          <div class="warning">
            <strong>Jauhkan daripada capaian kanak-kanak<br>
            Keep out of reach of children</strong>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(labelHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }
  };

  // Edit handlers
  const handleEditItem = (item: TreatmentItem) => {
    setEditingItemId(item.id);
    setEditFormData({
      quantity: item.quantity,
      dosage_instructions: item.dosage_instructions || '',
      frequency: item.frequency || '',
      duration_days: item.duration_days || 0,
      rate: item.rate,
      notes: item.notes || ''
    });
  };

  const handleSaveEdit = async () => {
    if (!editingItemId || !editFormData.quantity || !editFormData.rate) {
      toast({
        title: "Error",
        description: "Please fill in required fields (quantity and rate)",
        variant: "destructive",
      });
      return;
    }

    try {
      // Calculate new total amount
      const newTotalAmount = editFormData.quantity! * editFormData.rate!;
      
      // Update the treatment item
      const updatedItems = treatmentItems.map(item => {
        if (item.id === editingItemId) {
          return {
            ...item,
            quantity: editFormData.quantity!,
            dosage_instructions: editFormData.dosage_instructions || '',
            frequency: editFormData.frequency || '',
            duration_days: editFormData.duration_days || 0,
            rate: editFormData.rate!,
            total_amount: newTotalAmount,
            notes: editFormData.notes || ''
          };
        }
        return item;
      });

      setTreatmentItems(updatedItems);

      // Update session data with the new prescribed items
      if (sessionData) {
        const updatedSessionItems = updatedItems.map(item => ({
          type: item.item_type as 'medication' | 'service',
          name: getItemDisplayName(item),
          quantity: item.quantity,
          dosage: item.dosage_instructions || '',
          frequency: item.frequency || '',
          duration: item.duration_days ? `${item.duration_days} days` : '',
          price: item.total_amount,
          instructions: item.notes || '',
          rate: item.rate
        }));

        await saveSessionData({
          prescribed_items: updatedSessionItems
        });
      }

      // Reset edit state
      setEditingItemId(null);
      setEditFormData({});
      
      toast({
        title: "Item Updated",
        description: "Treatment item updated successfully",
      });
    } catch (error) {
      console.error('Error updating item:', error);
      toast({
        title: "Error",
        description: "Failed to update item",
        variant: "destructive",
      });
    }
  };

  const handleCancelEdit = () => {
    setEditingItemId(null);
    setEditFormData({});
  };

  // Invoice edit handlers
  const handleStartEditInvoice = () => {
    setIsEditingInvoice(true);
    setOriginalItems([...treatmentItems]);
  };

  const handleCancelEditInvoice = () => {
    setIsEditingInvoice(false);
    setAddItemMode(null);
    setSearchQuery('');
    setSelectedItem(null);
    setNewItemData({ quantity: 1, rate: 0 });
    setTreatmentItems([...originalItems]);
    setEditingItemId(null);
    setEditFormData({});
  };

  const handleSaveEditInvoice = async () => {
    try {
      // Update session data with all changes
      if (sessionData) {
        const updatedSessionItems = treatmentItems.map(item => ({
          type: item.item_type as 'medication' | 'service',
          name: getItemDisplayName(item),
          quantity: item.quantity,
          dosage: item.dosage_instructions || '',
          frequency: item.frequency || '',
          duration: item.duration_days ? `${item.duration_days} days` : '',
          price: item.total_amount,
          instructions: item.notes || '',
          rate: item.rate
        }));

        await saveSessionData({
          prescribed_items: updatedSessionItems
        });
      }

      setIsEditingInvoice(false);
      setAddItemMode(null);
      setSearchQuery('');
      setSelectedItem(null);
      setNewItemData({ quantity: 1, rate: 0 });
      setEditingItemId(null);
      setEditFormData({});

      toast({
        title: "Invoice Updated",
        description: "Invoice changes saved successfully",
      });
    } catch (error) {
      console.error('Error saving invoice changes:', error);
      toast({
        title: "Error",
        description: "Failed to save invoice changes",
        variant: "destructive",
      });
    }
  };

  const handleRemoveItem = (itemId: string) => {
    const updatedItems = treatmentItems.filter(item => item.id !== itemId);
    setTreatmentItems(updatedItems);
  };

  const handleAddNewItem = async () => {
    if (!selectedItem || !newItemData.quantity || !newItemData.rate) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const newItem: TreatmentItem = {
      id: `new-${Date.now()}`,
      item_type: addItemMode!,
      quantity: newItemData.quantity,
      rate: newItemData.rate,
      total_amount: newItemData.quantity * newItemData.rate,
      dosage_instructions: newItemData.dosage || '',
      frequency: newItemData.frequency || '',
      duration_days: newItemData.duration || 0,
      notes: newItemData.notes || '',
      [addItemMode === 'medication' ? 'medication_id' : 'service_id']: selectedItem.id,
      [addItemMode === 'medication' ? 'medication' : 'service']: {
        name: selectedItem.name,
        ...(addItemMode === 'service' ? { description: selectedItem.description } : {})
      }
    };

    setTreatmentItems(prev => [...prev, newItem]);
    
    // Reset add item form
    setAddItemMode(null);
    setSelectedItem(null);
    setSearchQuery('');
    setNewItemData({ quantity: 1, rate: 0 });

    toast({
      title: "Item Added",
      description: "New item added to invoice",
    });
  };

  // Filter medications and services based on search
  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (med.brand_name && med.brand_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (med.generic_name && med.generic_name.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (service.description && service.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getItemDisplayName = (item: TreatmentItem) => {
    if (item.item_type === 'medication') {
      return item.medication?.name || 'Unknown Medication';
    } else {
      return item.service?.name || 'Unknown Service';
    }
  };

  const getItemInstructions = (item: TreatmentItem) => {
    if (item.item_type === 'medication') {
      const parts = [];
      if (item.dosage_instructions) parts.push(`Dosage: ${item.dosage_instructions}`);
      if (item.frequency) parts.push(`Frequency: ${item.frequency}`);
      if (item.duration_days) parts.push(`Duration: ${item.duration_days} days`);
      return parts.join(' • ');
    }
    return item.service?.description || '';
  };

  if (!queueEntry) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl h-[95vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>
            Dispensary - {queueEntry.patient?.first_name} {queueEntry.patient?.last_name}
            {queueEntry.patient?.patient_id && (
              <span className="text-muted-foreground ml-2">
                (ID: {queueEntry.patient.patient_id})
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-6 h-full overflow-hidden">
          {/* Left Column - Treatment Items */}
          <div className="flex-1 space-y-4 overflow-y-auto">
            {/* Treatment Items Table */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">Treatment Items</h3>
                <div className="flex gap-2">
                  {!isEditingInvoice ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setOriginalItems([...treatmentItems]);
                        setIsEditingInvoice(true);
                      }}
                    >
                      <EditIcon className="h-4 w-4 mr-2" />
                      Edit Invoice
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTreatmentItems(originalItems);
                          setIsEditingInvoice(false);
                          setAddItemMode(null);
                          setEditingItemId(null);
                        }}
                      >
                        <XIcon className="h-4 w-4 mr-2" />
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => {
                          // Save changes to session
                          if (sessionData) {
                            saveSessionData({
                              ...sessionData,
                              treatment_items: treatmentItems
                            });
                          }
                          setIsEditingInvoice(false);
                          setAddItemMode(null);
                          setEditingItemId(null);
                          toast({
                            title: "Invoice Updated",
                            description: "Treatment items have been updated successfully",
                          });
                        }}
                      >
                        <SaveIcon className="h-4 w-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Treatment Items List */}
              <div className="border rounded-lg overflow-hidden">
                <div className="bg-muted/50 px-4 py-2 border-b">
                  <div className="grid grid-cols-12 gap-4 text-sm font-medium">
                    <div className="col-span-4">ITEM</div>
                    <div className="col-span-2">QTY</div>
                    <div className="col-span-2">RATE</div>
                    <div className="col-span-2">AMOUNT</div>
                    <div className="col-span-2">ACTION</div>
                  </div>
                </div>

                <div className="divide-y">
                  {treatmentItems.map((item) => (
                    <div key={item.id} className="px-4 py-3">
                      <div className="grid grid-cols-12 gap-4 items-center">
                        <div className="col-span-4">
                          <div className="font-medium">
                            {item.item_type === 'medication' 
                              ? item.medication?.name 
                              : item.service?.name
                            }
                          </div>
                          {item.dosage_instructions && (
                            <div className="text-sm text-muted-foreground">
                              {item.dosage_instructions}
                              {item.frequency && ` - ${item.frequency}`}
                              {item.duration_days && ` (${item.duration_days} days)`}
                            </div>
                          )}
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">{item.quantity}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-medium">RM {item.rate.toFixed(2)}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="font-bold">RM {item.total_amount.toFixed(2)}</span>
                        </div>
                        <div className="col-span-2">
                          <div className="flex items-center gap-1">
                            {item.item_type === 'medication' && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePrintLabel(item)}
                                title="Print Medication Label"
                              >
                                <PrinterIcon className="h-4 w-4" />
                              </Button>
                            )}
                            {isEditingInvoice && (
                              <>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setEditingItemId(item.id);
                                    setEditFormData(item);
                                  }}
                                >
                                  <EditIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setTreatmentItems(prev => prev.filter(i => i.id !== item.id));
                                  }}
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}

                  {treatmentItems.length === 0 && (
                    <div className="px-4 py-8 text-center text-muted-foreground">
                      No treatment items found. Items will appear here from the consultation session.
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Consultation Notes */}
            <div className="space-y-2">
              <Label htmlFor="consultation-notes">Consultation Notes</Label>
              <Textarea
                id="consultation-notes"
                value={consultationNotes}
                onChange={(e) => setConsultationNotes(e.target.value)}
                placeholder="Additional notes from consultation..."
                rows={4}
                readOnly
                className="bg-muted/50"
              />
            </div>

            {/* Payment History */}
            {currentVisitId && (
              <PaymentHistory
                payments={payments}
                summary={{
                  ...summary,
                  total_amount: finalTotal,
                  amount_due: Math.max(0, finalTotal - summary.total_paid)
                }}
                onDeletePayment={deletePayment}
                loading={paymentsLoading}
                patientName={queueEntry.patient ? `${queueEntry.patient.first_name} ${queueEntry.patient.last_name}` : 'Unknown Patient'}
              />
            )}
          </div>

          {/* Right Column - Checkout/Payment Menu */}
          <div className="w-80 bg-secondary/10 p-4 rounded-lg overflow-y-auto">
            <div className="space-y-6">
              {/* Total Amount */}
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Invoice</div>
                <div className="text-3xl font-bold">RM {finalTotal.toFixed(2)}</div>
              </div>

              <Separator />

              {/* Payment Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Record payment</h3>
                
                <Button 
                  variant="link" 
                  className="h-auto p-0 text-primary"
                  onClick={() => setShowPaymentModal(true)}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Add payment
                </Button>

                {/* Payment History Summary */}
                {payments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Recent Payments</h4>
                    {payments.slice(0, 3).map((payment) => (
                      <div key={payment.id} className="text-sm bg-background p-2 rounded">
                        <div className="flex justify-between">
                          <span>{payment.payment_method}</span>
                          <span className="font-medium">RM {payment.amount.toFixed(2)}</span>
                        </div>
                        {payment.notes && (
                          <div className="text-muted-foreground mt-1 text-xs">{payment.notes}</div>
                        )}
                      </div>
                    ))}
                    {payments.length > 3 && (
                      <div className="text-xs text-muted-foreground text-center">
                        +{payments.length - 3} more payments
                      </div>
                    )}
                  </div>
                )}
              </div>

              <Separator />

              {/* Adjustments Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Adjustments</h3>
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-primary"
                    onClick={() => setShowAdjustmentModal(true)}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add Adjustment
                  </Button>
                </div>

                {/* Adjustments List */}
                {adjustments.length > 0 && (
                  <div className="space-y-2">
                    {adjustments.map((adjustment) => {
                      const adjustmentAmount = adjustment.amountType === 'percentage' 
                        ? (totalAmount * adjustment.amount) / 100 
                        : adjustment.amount;
                      
                      return (
                        <div key={adjustment.id} className="flex items-center justify-between bg-background p-2 rounded">
                          <div className="flex-1">
                            <div className="text-sm font-medium">{adjustment.description}</div>
                            <div className="text-xs text-muted-foreground">
                              {adjustment.amountType === 'percentage' && `${adjustment.amount}% of RM${totalAmount.toFixed(2)}`}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`font-medium ${adjustment.type === 'add' ? 'text-green-600' : 'text-red-600'}`}>
                              {adjustment.type === 'add' ? '+' : '-'}RM{adjustmentAmount.toFixed(2)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAdjustment(adjustment.id)}
                            >
                              <XIcon className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />

              {/* Financial Summary */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium">RM {totalAmount.toFixed(2)}</span>
                </div>
                
                {adjustments.length > 0 && (
                  <div className="flex justify-between">
                    <span>Adjustments</span>
                    <span className={`font-medium ${adjustmentsTotal >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {adjustmentsTotal >= 0 ? '+' : ''}RM {adjustmentsTotal.toFixed(2)}
                    </span>
                  </div>
                )}
                
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Total</span>
                  <span>RM {finalTotal.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between">
                  <span>Paid</span>
                  <span className="font-medium text-success">RM {summary.total_paid.toFixed(2)}</span>
                </div>
                
                <div className="flex justify-between font-bold">
                  <span>Amount due</span>
                  <span className={finalTotal - summary.total_paid === 0 ? 'text-success' : 'text-destructive'}>
                    RM {Math.max(0, finalTotal - summary.total_paid).toFixed(2)}
                  </span>
                </div>
              </div>

              {finalTotal - summary.total_paid === 0 && finalTotal > 0 && (
                <Badge className="w-full justify-center bg-success text-success-foreground">
                  Fully Paid
                </Badge>
              )}

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button 
                  className="w-full" 
                  onClick={handleCompleteVisit}
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Complete Visit'}
                </Button>
                
                {finalTotal > 0 && (
                  <PrintInvoice 
                    queueEntry={queueEntry}
                    treatmentItems={treatmentItems}
                    payments={payments.map(p => ({ 
                      id: p.id, 
                      amount: p.amount, 
                      method: p.payment_method, 
                      notes: p.notes, 
                      created_at: p.created_at 
                    }))}
                    consultationNotes={consultationNotes}
                    totalAmount={finalTotal}
                    totalPaid={summary.total_paid}
                    amountDue={Math.max(0, finalTotal - summary.total_paid)}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Adjustment Modal */}
        <AdjustmentModal
          isOpen={showAdjustmentModal}
          onClose={() => setShowAdjustmentModal(false)}
          onConfirm={handleAdjustmentConfirm}
          currentTotal={totalAmount}
        />

        {/* Payment Modal */}
        {queueEntry && (
          <PaymentModal
            isOpen={showPaymentModal}
            onClose={() => setShowPaymentModal(false)}
            onPaymentAdded={addPayment}
            summary={{
              ...summary,
              total_amount: finalTotal,
              amount_due: Math.max(0, finalTotal - summary.total_paid)
            }}
            visitId={currentVisitId || undefined}
            patientId={queueEntry.patient_id}
            patientName={queueEntry.patient ? `${queueEntry.patient.first_name} ${queueEntry.patient.last_name}` : 'Unknown Patient'}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}
