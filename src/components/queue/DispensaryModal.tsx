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
import { useMedications } from '@/hooks/useMedications';
import { useServices } from '@/hooks/useServices';
import { useTierPricing } from '@/hooks/useTierPricing';
import { useHeaderSettings } from '@/hooks/useHeaderSettings';

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

interface Payment {
  id: string;
  amount: number;
  method: string;
  notes?: string;
  created_at: string;
}

interface DispensaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  queueEntry: QueueEntry | null;
  onStatusChange: (queueId: string, status: string) => void;
}

export function DispensaryModal({ isOpen, onClose, queueEntry, onStatusChange }: DispensaryModalProps) {
  const [treatmentItems, setTreatmentItems] = useState<TreatmentItem[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [consultationNotes, setConsultationNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentNotes, setPaymentNotes] = useState('');
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

  const totalAmount = treatmentItems.reduce((sum, item) => sum + item.total_amount, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const amountDue = totalAmount - totalPaid;

  useEffect(() => {
    if (isOpen && queueEntry) {
      refreshSessionData(); // Refresh session data on modal open
      // Initialize empty states - data will be populated from session sync
      setTreatmentItems([]);
      setConsultationNotes('');
      setPayments([]);
    }
  }, [isOpen, queueEntry, refreshSessionData]);

  // Sync with real-time session data
  useEffect(() => {
    if (sessionData && isOpen) {
      console.log('Syncing dispensary with session data:', sessionData);
      
      // Update consultation notes
      if (sessionData.consultation_notes || sessionData.diagnosis) {
        const notesText = [
          sessionData.consultation_notes ? `Notes: ${sessionData.consultation_notes}` : '',
          sessionData.diagnosis ? `Diagnosis: ${sessionData.diagnosis}` : ''
        ].filter(Boolean).join('\n\n');
        setConsultationNotes(notesText);
      } else {
        setConsultationNotes('');
      }

      // Update treatment items from session data
      if (sessionData.prescribed_items && sessionData.prescribed_items.length > 0) {
        const convertedItems: TreatmentItem[] = sessionData.prescribed_items.map((item, index) => ({
          id: `session-${index}`,
          item_type: item.type,
          medication_id: item.type === 'medication' ? `med-${index}` : undefined,
          service_id: item.type === 'service' ? `svc-${index}` : undefined,
          quantity: item.quantity,
          dosage_instructions: item.dosage,
          frequency: item.frequency,
          duration_days: item.duration ? parseInt(item.duration.replace(/\D/g, '')) || null : null,
          rate: item.rate,
          total_amount: item.price,
          notes: item.instructions,
          medication: item.type === 'medication' ? {
            name: item.name,
            brand_name: undefined
          } : undefined,
          service: item.type === 'service' ? {
            name: item.name,
            description: undefined
          } : undefined
        }));
        setTreatmentItems(convertedItems);
      } else {
        setTreatmentItems([]);
      }
    } else if (isOpen) {
      // If no session data, clear the items
      setTreatmentItems([]);
      setConsultationNotes('');
    }
  }, [sessionData, isOpen]);

  const handlePaymentSubmit = async () => {
    if (!paymentAmount || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in payment amount and method",
        variant: "destructive",
      });
      return;
    }

    try {
      const amount = parseFloat(paymentAmount);
      
      // Add payment (mock implementation - you can store this in a payments table)
      const newPayment: Payment = {
        id: Date.now().toString(),
        amount,
        method: paymentMethod,
        notes: paymentNotes,
        created_at: new Date().toISOString()
      };
      
      setPayments(prev => [...prev, newPayment]);
      
      // Reset form
      setPaymentAmount('');
      setPaymentMethod('');
      setPaymentNotes('');
      setShowPaymentForm(false);
      
      // Check if fully paid and update status to completed
      const newTotalPaid = totalPaid + amount;
      if (newTotalPaid >= totalAmount && queueEntry) {
        onStatusChange(queueEntry.id, 'completed');
        toast({
          title: "Payment Completed",
          description: "Payment recorded and patient status updated to completed",
        });
      } else {
        toast({
          title: "Payment Recorded",
          description: `Payment of RM ${amount.toFixed(2)} recorded successfully`,
        });
      }
    } catch (error) {
      console.error('Error recording payment:', error);
      toast({
        title: "Error",
        description: "Failed to record payment",
        variant: "destructive",
      });
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

  const handlePrintInvoice = () => {
    // Create a new window with the print-optimized invoice
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Create the print document
    const printContent = document.createElement('div');
    printContent.className = 'print-invoice';

    // Render the PrintInvoice component to string (we'll use a different approach)
    // For now, we'll create the print content directly
    printContent.innerHTML = `
      <div class="print-invoice bg-white text-black p-8 max-w-4xl mx-auto">
        <!-- Header -->
        <div class="print-header text-center mb-8 border-b-2 border-gray-800 pb-4">
          <h1 class="text-2xl font-bold mb-2">Medical Invoice</h1>
          <div class="text-sm">
            <p>Invoice Date: ${new Date().toLocaleDateString()}</p>
            <p>Invoice #: INV-${Date.now().toString().slice(-6)}</p>
          </div>
        </div>

        <!-- Patient Information -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">Patient Information</h2>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <p><strong>Name:</strong> ${queueEntry.patient?.first_name} ${queueEntry.patient?.last_name}</p>
              <p><strong>Patient ID:</strong> ${queueEntry.patient?.patient_id || 'N/A'}</p>
            </div>
            <div>
              <p><strong>Phone:</strong> ${queueEntry.patient?.phone || 'N/A'}</p>
              <p><strong>Email:</strong> ${queueEntry.patient?.email || 'N/A'}</p>
            </div>
          </div>
        </div>

        ${consultationNotes ? `
        <!-- Consultation Notes -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">Consultation Notes</h2>
          <div class="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border">
            ${consultationNotes}
          </div>
        </div>
        ` : ''}

        <!-- Treatment Items -->
        <div class="mb-6">
          <h2 class="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">Prescribed Items</h2>
          ${treatmentItems.length === 0 ? 
            '<p class="text-center py-4 text-gray-500">No items prescribed</p>' :
            `<table class="w-full border-collapse border border-gray-300">
              <thead>
                <tr class="bg-gray-100">
                  <th class="border border-gray-300 p-2 text-left w-8">#</th>
                  <th class="border border-gray-300 p-2 text-left">Item</th>
                  <th class="border border-gray-300 p-2 text-center w-16">Qty</th>
                  <th class="border border-gray-300 p-2 text-right w-20">Rate</th>
                  <th class="border border-gray-300 p-2 text-right w-24">Total</th>
                </tr>
              </thead>
              <tbody>
                ${treatmentItems.map((item, index) => `
                  <tr>
                    <td class="border border-gray-300 p-2 text-center">${index + 1}</td>
                    <td class="border border-gray-300 p-2">
                      <div class="font-medium">${getItemDisplayName(item)}</div>
                      ${getItemInstructions(item) ? `
                        <div class="text-xs text-gray-600 mt-1">
                          ${getItemInstructions(item)}
                        </div>
                      ` : ''}
                      ${item.notes ? `
                        <div class="text-xs text-gray-600 mt-1">
                          Note: ${item.notes}
                        </div>
                      ` : ''}
                    </td>
                    <td class="border border-gray-300 p-2 text-center">${item.quantity}</td>
                    <td class="border border-gray-300 p-2 text-right">RM ${item.rate.toFixed(2)}</td>
                    <td class="border border-gray-300 p-2 text-right font-medium">RM ${item.total_amount.toFixed(2)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>`
          }
        </div>

        <!-- Payment Summary -->
        <div class="border-t-2 border-gray-800 pt-4">
          <div class="grid grid-cols-2 gap-8">
            <!-- Payment History -->
            <div>
              <h3 class="font-semibold mb-2">Payment History</h3>
              ${payments.length === 0 ? 
                '<p class="text-sm text-gray-500">No payments recorded</p>' :
                `<div class="space-y-1">
                  ${payments.map(payment => `
                    <div class="flex justify-between text-sm">
                      <span>${payment.method}</span>
                      <span>RM ${payment.amount.toFixed(2)}</span>
                    </div>
                  `).join('')}
                </div>`
              }
            </div>

            <!-- Total Summary -->
            <div class="text-right">
              <div class="space-y-2">
                <div class="flex justify-between">
                  <span>Subtotal:</span>
                  <span>RM ${totalAmount.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-green-600">
                  <span>Total Paid:</span>
                  <span>RM ${totalPaid.toFixed(2)}</span>
                </div>
                <div class="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-2">
                  <span>Amount Due:</span>
                  <span class="${amountDue > 0 ? 'text-red-600' : 'text-green-600'}">
                    RM ${amountDue.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
          <p>Thank you for choosing our medical services.</p>
          <p>For inquiries, please contact us at your convenience.</p>
        </div>
      </div>
    `;

    // Set up the print window
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medical Invoice</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: Arial, sans-serif; font-size: 12pt; line-height: 1.4; color: black; background: white; padding: 20px; }
          .print-header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .grid { display: grid; }
          .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
          .gap-4 { gap: 1rem; }
          .gap-8 { gap: 2rem; }
          .mb-2 { margin-bottom: 0.5rem; }
          .mb-3 { margin-bottom: 0.75rem; }
          .mb-6 { margin-bottom: 1.5rem; }
          .mb-8 { margin-bottom: 2rem; }
          .mt-1 { margin-top: 0.25rem; }
          .mt-8 { margin-top: 2rem; }
          .p-2 { padding: 0.5rem; }
          .p-3 { padding: 0.75rem; }
          .p-8 { padding: 2rem; }
          .pb-1 { padding-bottom: 0.25rem; }
          .pb-4 { padding-bottom: 1rem; }
          .pt-2 { padding-top: 0.5rem; }
          .pt-4 { padding-top: 1rem; }
          .py-4 { padding-top: 1rem; padding-bottom: 1rem; }
          .text-center { text-align: center; }
          .text-left { text-align: left; }
          .text-right { text-align: right; }
          .text-xs { font-size: 10pt; }
          .text-sm { font-size: 11pt; }
          .text-lg { font-size: 14pt; }
          .text-xl { font-size: 16pt; }
          .text-2xl { font-size: 18pt; }
          .font-medium { font-weight: 500; }
          .font-semibold { font-weight: 600; }
          .font-bold { font-weight: bold; }
          .border { border: 1px solid #ccc; }
          .border-b { border-bottom: 1px solid #ccc; }
          .border-t { border-top: 1px solid #ccc; }
          .border-b-2 { border-bottom: 2px solid #333; }
          .border-t-2 { border-top: 2px solid #333; }
          .border-gray-300 { border-color: #d1d5db; }
          .border-gray-800 { border-color: #1f2937; }
          .bg-gray-50 { background-color: #f9fafb; }
          .bg-gray-100 { background-color: #f3f4f6; }
          .text-gray-500 { color: #6b7280; }
          .text-gray-600 { color: #4b5563; }
          .text-green-600 { color: #059669; }
          .text-red-600 { color: #dc2626; }
          .rounded { border-radius: 0.25rem; }
          .space-y-1 > * + * { margin-top: 0.25rem; }
          .space-y-2 > * + * { margin-top: 0.5rem; }
          .whitespace-pre-wrap { white-space: pre-wrap; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #333; padding: 8px; text-align: left; }
          .w-8 { width: 2rem; }
          .w-16 { width: 4rem; }
          .w-20 { width: 5rem; }
          .w-24 { width: 6rem; }
          .max-w-4xl { max-width: 56rem; }
          .mx-auto { margin-left: auto; margin-right: auto; }
        </style>
      </head>
      <body>
        ${printContent.innerHTML}
      </body>
      </html>
    `);

    printWindow.document.close();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);
  };

  const handlePrintLabel = (itemId: string) => {
    const item = treatmentItems.find(i => i.id === itemId);
    if (!item || item.item_type !== 'medication') {
      toast({
        title: "Error",
        description: "Only medication items can have labels printed",
        variant: "destructive",
      });
      return;
    }

    if (!queueEntry || !queueEntry.patient) {
      toast({
        title: "Error",
        description: "Patient information not available",
        variant: "destructive",
      });
      return;
    }

    const patient = queueEntry.patient;
    const clinicName = headerSettings?.clinic_name || 'MEDICAL CLINIC';
    const clinicAddress = headerSettings?.address || 'Address not set';
    const clinicPhone = headerSettings?.phone || 'Phone not set';
    
    const labelHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Medication Label</title>
        <style>
          * { 
            margin: 0; 
            padding: 0; 
            box-sizing: border-box; 
          }
          
          @page {
            size: 70mm 35mm;
            margin: 2mm;
          }
          
          body { 
            font-family: 'Arial', sans-serif;
            font-size: 8pt;
            line-height: 1.2;
            color: black;
            background: white;
            padding: 2mm;
            width: 66mm;
            height: 31mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          
          .clinic-header {
            text-align: center;
            border-bottom: 1px solid #000;
            padding-bottom: 1mm;
            margin-bottom: 1mm;
          }
          
          .clinic-name {
            font-weight: bold;
            font-size: 9pt;
            margin-bottom: 0.5mm;
          }
          
          .clinic-info {
            font-size: 7pt;
            line-height: 1.1;
          }
          
          .patient-info {
            margin-bottom: 1mm;
            font-size: 7pt;
          }
          
          .medication-name {
            font-weight: bold;
            font-size: 10pt;
            text-transform: uppercase;
            margin: 1mm 0;
          }
          
          .quantity {
            font-size: 8pt;
            margin-bottom: 1mm;
          }
          
          .dosage-info {
            margin-bottom: 1mm;
          }
          
          .dosage-line {
            font-size: 7pt;
            margin-bottom: 0.5mm;
          }
          
          .instructions {
            font-size: 7pt;
            margin-bottom: 1mm;
          }
          
          .warning {
            font-size: 6pt;
            text-align: center;
            border-top: 1px solid #000;
            padding-top: 1mm;
            line-height: 1.1;
          }
          
          .bold { font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="clinic-header">
          <div class="clinic-name">KLINIK ${clinicName.toUpperCase()}</div>
          <div class="clinic-info">
            ${clinicAddress}<br>
            ${clinicPhone}
          </div>
        </div>
        
        <div class="patient-info">
          <div><span class="bold">Patient:</span> ${patient.first_name} ${patient.last_name}</div>
          <div><span class="bold">Date:</span> ${new Date().toLocaleDateString('en-MY')}</div>
        </div>
        
        <div class="medication-name">
          ${item.medication?.name || 'MEDICATION'}
        </div>
        
        <div class="quantity">
          <span class="bold">Qty:</span> ${item.quantity} ${item.medication?.name?.toLowerCase().includes('tablet') || item.medication?.name?.toLowerCase().includes('capsule') ? 'tablets' : 'units'}
        </div>
        
        <div class="dosage-info">
          ${item.dosage_instructions ? `<div class="dosage-line"><span class="bold">DOSAGE:</span> ${item.dosage_instructions}</div>` : ''}
          ${item.frequency ? `<div class="dosage-line"><span class="bold">FREQUENCY:</span> ${item.frequency}</div>` : ''}
          ${item.duration_days ? `<div class="dosage-line"><span class="bold">DURATION:</span> ${item.duration_days} days</div>` : ''}
        </div>
        
        ${item.notes ? `<div class="instructions"><span class="bold">INSTRUCTIONS:</span> ${item.notes}</div>` : ''}
        
        <div class="warning">
          <div><strong>Jauhkan daripada capaian kanak-kanak</strong></div>
          <div><strong>Keep out of reach of children</strong></div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast({
        title: "Error",
        description: "Unable to open print window. Please check your browser settings.",
        variant: "destructive",
      });
      return;
    }

    printWindow.document.write(labelHTML);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 500);

    toast({
      title: "Label Printed",
      description: `Medication label for ${item.medication?.name} has been sent to printer`,
    });
  };

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
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-2xl">Dispensary - {queueEntry.patient?.first_name} {queueEntry.patient?.last_name}</DialogTitle>
        </DialogHeader>
        
        <div className="flex gap-6 h-[70vh]">
          {/* Left Column - Invoice Menu */}
          <div className="flex-1 overflow-y-auto">
            <div className="space-y-6">
              {/* Summary Section */}
              <div className="bg-secondary/20 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Summary</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Patient:</span>
                    <span className="font-medium">
                      {queueEntry.patient?.first_name} {queueEntry.patient?.last_name}
                    </span>
                  </div>
                  {consultationNotes && (
                    <div className="mt-3 p-3 bg-background rounded border">
                      <h4 className="font-medium text-sm mb-2">Consultation Notes:</h4>
                      <div className="text-sm text-muted-foreground whitespace-pre-wrap">
                        {consultationNotes}
                      </div>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>Billed to:</span>
                    <span>-</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Billing details:</span>
                    <span>-</span>
                  </div>
                  <Button variant="link" className="h-auto p-0 text-primary">
                    Change billing details
                  </Button>
                </div>
              </div>

              {/* Status Change Section */}
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="text-lg font-semibold mb-3 text-blue-800">Patient Status</h3>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Current Status:</span>
                    <Badge variant={queueEntry.status === 'dispensary' ? 'default' : 'secondary'}>
                      {queueEntry.status === 'dispensary' ? 'Ready for Dispensary' : queueEntry.status === 'in_consultation' ? 'In Consultation' : queueEntry.status}
                    </Badge>
                  </div>
                  {queueEntry.status === 'dispensary' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        onStatusChange(queueEntry.id, 'in_consultation');
                        onClose();
                      }}
                      className="border-orange-300 text-orange-700 hover:bg-orange-50"
                    >
                      ← Back to Consultation
                    </Button>
                  )}
                  {queueEntry.status === 'in_consultation' && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => onStatusChange(queueEntry.id, 'dispensary')}
                      className="border-green-300 text-green-700 hover:bg-green-50"
                    >
                      Ready for Dispensary →
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button variant="outline" size="sm">
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print all labels
                </Button>
                {!isEditingInvoice ? (
                  <Button variant="outline" size="sm" onClick={handleStartEditInvoice}>
                    <EditIcon className="h-4 w-4 mr-2" />
                    Edit invoice
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={handleSaveEditInvoice}>
                      <SaveIcon className="h-4 w-4 mr-2" />
                      Save Changes
                    </Button>
                    <Button variant="ghost" size="sm" onClick={handleCancelEditInvoice}>
                      <XIcon className="h-4 w-4 mr-2" />
                      Cancel
                    </Button>
                  </div>
                )}
                <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print invoice
                </Button>
              </div>

              {/* Add Item Interface - Only visible in edit mode */}
              {isEditingInvoice && (
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                  <h3 className="text-lg font-semibold mb-3 text-blue-800">Add Items to Invoice</h3>
                  {!addItemMode ? (
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setAddItemMode('medication')}
                        className="flex-1"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Medication
                      </Button>
                      <Button 
                        variant="outline" 
                        onClick={() => setAddItemMode('service')}
                        className="flex-1"
                      >
                        <PlusIcon className="h-4 w-4 mr-2" />
                        Add Service
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-medium">Add {addItemMode}</h4>
                        <Button variant="ghost" size="sm" onClick={() => setAddItemMode(null)}>
                          <XIcon className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {/* Search */}
                      <div className="relative">
                        <SearchIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder={`Search ${addItemMode}s...`}
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>

                      {/* Item Selection */}
                      {searchQuery && (
                        <div className="max-h-40 overflow-y-auto border rounded-lg">
                          {addItemMode === 'medication' ? 
                            filteredMedications.slice(0, 10).map((med) => (
                              <div 
                                key={med.id} 
                                className={`p-2 cursor-pointer hover:bg-secondary/50 border-b last:border-b-0 ${selectedItem?.id === med.id ? 'bg-primary/10' : ''}`}
                                onClick={() => {
                                  setSelectedItem(med);
                                  setNewItemData(prev => ({ ...prev, rate: med.price_per_unit || 0 }));
                                }}
                              >
                                <div className="font-medium">{med.name}</div>
                                {med.brand_name && <div className="text-sm text-muted-foreground">{med.brand_name}</div>}
                                <div className="text-sm">RM {(med.price_per_unit || 0).toFixed(2)}</div>
                              </div>
                            )) :
                            filteredServices.slice(0, 10).map((service) => (
                              <div 
                                key={service.id} 
                                className={`p-2 cursor-pointer hover:bg-secondary/50 border-b last:border-b-0 ${selectedItem?.id === service.id ? 'bg-primary/10' : ''}`}
                                onClick={() => {
                                  setSelectedItem(service);
                                  setNewItemData(prev => ({ ...prev, rate: service.price || 0 }));
                                }}
                              >
                                <div className="font-medium">{service.name}</div>
                                {service.description && <div className="text-sm text-muted-foreground">{service.description}</div>}
                                <div className="text-sm">RM {(service.price || 0).toFixed(2)}</div>
                              </div>
                            ))
                          }
                        </div>
                      )}

                      {/* Item Form */}
                      {selectedItem && (
                        <div className="bg-white p-3 rounded border">
                          <div className="font-medium mb-3">{selectedItem.name}</div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <Label>Quantity</Label>
                              <Input
                                type="number"
                                min="1"
                                value={newItemData.quantity}
                                onChange={(e) => setNewItemData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                              />
                            </div>
                            <div>
                              <Label>Rate (RM)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={newItemData.rate}
                                onChange={(e) => setNewItemData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                              />
                            </div>
                          </div>
                          
                          {addItemMode === 'medication' && (
                            <div className="grid grid-cols-3 gap-3 mt-3">
                              <div>
                                <Label>Dosage</Label>
                                <Input
                                  placeholder="e.g., 1 tablet"
                                  value={newItemData.dosage || ''}
                                  onChange={(e) => setNewItemData(prev => ({ ...prev, dosage: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>Frequency</Label>
                                <Input
                                  placeholder="e.g., twice daily"
                                  value={newItemData.frequency || ''}
                                  onChange={(e) => setNewItemData(prev => ({ ...prev, frequency: e.target.value }))}
                                />
                              </div>
                              <div>
                                <Label>Duration (days)</Label>
                                <Input
                                  type="number"
                                  min="0"
                                  value={newItemData.duration || ''}
                                  onChange={(e) => setNewItemData(prev => ({ ...prev, duration: parseInt(e.target.value) || 0 }))}
                                />
                              </div>
                            </div>
                          )}
                          
                          <div className="mt-3">
                            <Label>Notes</Label>
                            <Textarea
                              placeholder="Additional notes..."
                              value={newItemData.notes || ''}
                              onChange={(e) => setNewItemData(prev => ({ ...prev, notes: e.target.value }))}
                              rows={2}
                            />
                          </div>

                          <div className="flex justify-between items-center mt-3">
                            <div className="font-medium">
                              Total: RM {(newItemData.quantity * newItemData.rate).toFixed(2)}
                            </div>
                            <Button onClick={handleAddNewItem}>Add Item</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Itemized List */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Invoice Items</h3>
                {loading ? (
                  <div className="text-center py-4">Loading items...</div>
                 ) : treatmentItems.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <div className="mb-2">No prescribed items found in current session</div>
                    <div className="text-sm">Only items prescribed in the current queue session will appear here</div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium text-muted-foreground border-b pb-2">
                      <div className="col-span-1">#</div>
                      <div className="col-span-5">ITEM</div>
                      <div className="col-span-2 text-center">QTY</div>
                      <div className="col-span-2 text-right">TOTAL PRICE</div>
                      <div className="col-span-2 text-center">ACTION</div>
                    </div>
                     {treatmentItems.map((item, index) => (
                       <div key={item.id} className="grid grid-cols-12 gap-2 py-3 border-b last:border-b-0">
                         <div className="col-span-1 text-center">{index + 1}</div>
                         {editingItemId === item.id ? (
                           // Edit Form
                           <>
                             <div className="col-span-5 space-y-2">
                               <div className="font-medium">{getItemDisplayName(item)}</div>
                               {item.item_type === 'medication' && (
                                 <div className="space-y-2">
                                   <div>
                                     <Label className="text-xs">Dosage Instructions</Label>
                                     <Input
                                       value={editFormData.dosage_instructions || ''}
                                       onChange={(e) => setEditFormData(prev => ({ ...prev, dosage_instructions: e.target.value }))}
                                       className="h-8 text-sm"
                                       placeholder="e.g., 1 tablet"
                                     />
                                   </div>
                                   <div className="grid grid-cols-2 gap-2">
                                     <div>
                                       <Label className="text-xs">Frequency</Label>
                                       <Input
                                         value={editFormData.frequency || ''}
                                         onChange={(e) => setEditFormData(prev => ({ ...prev, frequency: e.target.value }))}
                                         className="h-8 text-sm"
                                         placeholder="e.g., twice daily"
                                       />
                                     </div>
                                     <div>
                                       <Label className="text-xs">Duration (days)</Label>
                                       <Input
                                         type="number"
                                         value={editFormData.duration_days || ''}
                                         onChange={(e) => setEditFormData(prev => ({ ...prev, duration_days: parseInt(e.target.value) || 0 }))}
                                         className="h-8 text-sm"
                                         placeholder="7"
                                       />
                                     </div>
                                   </div>
                                 </div>
                               )}
                               <div>
                                 <Label className="text-xs">Notes</Label>
                                 <Textarea
                                   value={editFormData.notes || ''}
                                   onChange={(e) => setEditFormData(prev => ({ ...prev, notes: e.target.value }))}
                                   className="h-16 text-sm resize-none"
                                   placeholder="Additional notes..."
                                 />
                               </div>
                             </div>
                             <div className="col-span-2 space-y-2">
                               <div>
                                 <Label className="text-xs">Quantity</Label>
                                 <Input
                                   type="number"
                                   value={editFormData.quantity || ''}
                                   onChange={(e) => setEditFormData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                   className="h-8 text-sm text-center"
                                   min="1"
                                 />
                               </div>
                               <div>
                                 <Label className="text-xs">Rate (RM)</Label>
                                 <Input
                                   type="number"
                                   step="0.01"
                                   value={editFormData.rate || ''}
                                   onChange={(e) => setEditFormData(prev => ({ ...prev, rate: parseFloat(e.target.value) || 0 }))}
                                   className="h-8 text-sm text-right"
                                   min="0"
                                 />
                               </div>
                             </div>
                             <div className="col-span-2 text-right font-medium">
                               RM {((editFormData.quantity || 0) * (editFormData.rate || 0)).toFixed(2)}
                             </div>
                             <div className="col-span-2 flex flex-col gap-1">
                               <Button 
                                 variant="outline" 
                                 size="sm" 
                                 onClick={handleSaveEdit}
                                 className="h-7 text-xs"
                               >
                                 Save
                               </Button>
                               <Button 
                                 variant="ghost" 
                                 size="sm" 
                                 onClick={handleCancelEdit}
                                 className="h-7 text-xs"
                               >
                                 Cancel
                               </Button>
                             </div>
                           </>
                         ) : (
                           // Display Mode
                           <>
                             <div className="col-span-5">
                               <div className="font-medium">{getItemDisplayName(item)}</div>
                               {getItemInstructions(item) && (
                                 <div className="text-sm text-muted-foreground mt-1">
                                   {getItemInstructions(item)}
                                 </div>
                               )}
                               {item.notes && (
                                 <div className="text-sm text-muted-foreground mt-1">
                                   Note: {item.notes}
                                 </div>
                               )}
                             </div>
                             <div className="col-span-2 text-center">{item.quantity}</div>
                             <div className="col-span-2 text-right font-medium">
                               RM {item.total_amount.toFixed(2)}
                             </div>
                               <div className="col-span-2 flex justify-center gap-2">
                                 <Button 
                                   variant="ghost" 
                                   size="sm"
                                   onClick={() => handleEditItem(item)}
                                   disabled={!isEditingInvoice}
                                 >
                                   <EditIcon className="h-4 w-4" />
                                 </Button>
                                 {isEditingInvoice && (
                                   <Button 
                                     variant="ghost" 
                                     size="sm" 
                                     onClick={() => handleRemoveItem(item.id)}
                                     className="text-destructive hover:text-destructive"
                                   >
                                     <TrashIcon className="h-4 w-4" />
                                   </Button>
                                 )}
                                 {item.item_type === 'medication' && (
                                   <Button 
                                     variant="ghost" 
                                     size="sm" 
                                     onClick={() => handlePrintLabel(item.id)}
                                     title="Print Medication Label"
                                   >
                                     <PrinterIcon className="h-4 w-4" />
                                   </Button>
                                 )}
                               </div>
                           </>
                         )}
                       </div>
                     ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Checkout/Payment Menu */}
          <div className="w-80 bg-secondary/10 p-4 rounded-lg overflow-y-auto">
            <div className="space-y-6">
              {/* Total Amount */}
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Invoice 552</div>
                <div className="text-3xl font-bold">RM {totalAmount.toFixed(2)}</div>
              </div>

              <Separator />

              {/* Payment Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Record payment</h3>
                
                {!showPaymentForm ? (
                  <Button 
                    variant="link" 
                    className="h-auto p-0 text-primary"
                    onClick={() => setShowPaymentForm(true)}
                  >
                    <PlusIcon className="h-4 w-4 mr-1" />
                    Add payment
                  </Button>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="payment-amount">Amount</Label>
                      <Input
                        id="payment-amount"
                        type="number"
                        step="0.01"
                        value={paymentAmount}
                        onChange={(e) => setPaymentAmount(e.target.value)}
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <Label htmlFor="payment-method">Payment Method</Label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cash">Cash</SelectItem>
                          <SelectItem value="card">Credit/Debit Card</SelectItem>
                          <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                          <SelectItem value="online">Online Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="payment-notes">Notes (optional)</Label>
                      <Textarea
                        id="payment-notes"
                        value={paymentNotes}
                        onChange={(e) => setPaymentNotes(e.target.value)}
                        placeholder="Payment notes..."
                        rows={2}
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handlePaymentSubmit}>
                        Record Payment
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => setShowPaymentForm(false)}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}

                {/* Payment History */}
                {payments.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-medium">Payment History</h4>
                    {payments.map((payment) => (
                      <div key={payment.id} className="text-sm bg-background p-2 rounded">
                        <div className="flex justify-between">
                          <span>{payment.method}</span>
                          <span className="font-medium">RM {payment.amount.toFixed(2)}</span>
                        </div>
                        {payment.notes && (
                          <div className="text-muted-foreground mt-1">{payment.notes}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <Separator />

              {/* Adjustments */}
              <div className="space-y-2">
                <Button variant="link" className="h-auto p-0 text-primary">
                  Add Adjustment
                </Button>
                <Button variant="link" className="h-auto p-0 text-primary">
                  Add tax
                </Button>
              </div>

              <Separator />

              {/* Financial Summary */}
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-medium">RM {totalAmount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paid</span>
                  <span className="font-medium">RM {totalPaid.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold">
                  <span>Amount due</span>
                  <span>RM {Math.max(0, amountDue).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Amount to claim</span>
                  <span>RM 0.00</span>
                </div>
              </div>

              {amountDue <= 0 && totalAmount > 0 && (
                <Badge className="w-full justify-center bg-success text-success-foreground">
                  Fully Paid
                </Badge>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}