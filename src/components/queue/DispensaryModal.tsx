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
import { PrinterIcon, EditIcon, TrashIcon, FileTextIcon, DollarSignIcon, PlusIcon } from 'lucide-react';

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
  const { toast } = useToast();

  const totalAmount = treatmentItems.reduce((sum, item) => sum + item.total_amount, 0);
  const totalPaid = payments.reduce((sum, payment) => sum + payment.amount, 0);
  const amountDue = totalAmount - totalPaid;

  useEffect(() => {
    if (isOpen && queueEntry) {
      fetchDispensaryData();
    }
  }, [isOpen, queueEntry]);

  const fetchDispensaryData = async () => {
    if (!queueEntry) return;
    
    try {
      setLoading(true);

      // Fetch treatment items from the treatment_items table
      const { data: treatmentItemsData, error: treatmentError } = await supabase
        .from('treatment_items')
        .select(`
          *,
          consultation_session:consultation_sessions!inner(
            patient_id,
            status,
            created_at
          )
        `)
        .eq('consultation_session.patient_id', queueEntry.patient_id)
        .eq('consultation_session.status', 'completed')
        .order('created_at', { ascending: false });

      if (treatmentError) {
        console.error('Error fetching treatment items:', treatmentError);
      }

      if (treatmentItemsData && treatmentItemsData.length > 0) {
        // Since foreign keys (medication_id, service_id) are often NULL, 
        // fetch names from patient_activities which contains the actual names
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('patient_activities')
          .select('*')
          .eq('patient_id', queueEntry.patient_id)
          .in('activity_type', ['medication', 'treatment'])
          .eq('metadata->>queue_id', queueEntry.id)
          .order('created_at', { ascending: false });

        if (activitiesError) {
          console.error('Error fetching patient activities:', activitiesError);
        }

        // Convert to our interface format with names from patient_activities
        const items: TreatmentItem[] = treatmentItemsData.map((item: any) => {
          // Find corresponding activity to get the actual name
          let itemName = 'Unknown';
          let itemDescription = '';
          
          if (item.item_type === 'medication') {
            const medicationActivity = activitiesData?.find(activity => {
              const metadata = activity.metadata as any;
              return activity.activity_type === 'medication' && metadata?.medication_name;
            });
            if (medicationActivity) {
              const metadata = medicationActivity.metadata as any;
              itemName = metadata?.medication_name || 'Unknown Medication';
            }
          } else if (item.item_type === 'service') {
            const serviceActivity = activitiesData?.find(activity => {
              const metadata = activity.metadata as any;
              return activity.activity_type === 'treatment' && metadata?.service_name;
            });
            if (serviceActivity) {
              const metadata = serviceActivity.metadata as any;
              itemName = metadata?.service_name || 'Unknown Service';
              itemDescription = serviceActivity.content || '';
            }
          }
          
          return {
            id: item.id,
            item_type: item.item_type as 'medication' | 'service',
            medication_id: item.medication_id,
            service_id: item.service_id,
            quantity: item.quantity,
            dosage_instructions: item.dosage_instructions,
            frequency: item.frequency,
            duration_days: item.duration_days,
            rate: item.rate,
            total_amount: item.total_amount,
            notes: item.notes,
            medication: item.item_type === 'medication' ? {
              name: itemName,
              brand_name: undefined
            } : undefined,
            service: item.item_type === 'service' ? {
              name: itemName,
              description: itemDescription
            } : undefined
          };
        });
        
        setTreatmentItems(items);
      } else {
        // Fallback: Get data from patient activities for today's consultation
        console.log('No treatment items found, checking patient activities...');
        
        const today = new Date().toISOString().split('T')[0];
        const { data: activities, error: activitiesError } = await supabase
          .from('patient_activities')
          .select('*')
          .eq('patient_id', queueEntry.patient_id)
          .in('activity_type', ['medication', 'treatment'])
          .gte('activity_date', `${today}T00:00:00Z`)
          .lte('activity_date', `${today}T23:59:59Z`)
          .order('created_at', { ascending: false });

        if (!activitiesError && activities) {
          // Filter to get unique items from today's consultation
          const todaysItems = activities.filter(activity => {
            const metadata = activity.metadata as any;
            return metadata?.queue_id === queueEntry.id;
          });

          const items: TreatmentItem[] = todaysItems.map((activity) => {
            const metadata = activity.metadata as any;
            return {
              id: activity.id,
              item_type: activity.activity_type === 'medication' ? 'medication' : 'service',
              medication_id: null,
              service_id: null,
              quantity: metadata?.quantity || 1,
              dosage_instructions: metadata?.dosage,
              frequency: metadata?.frequency,
              duration_days: metadata?.duration ? parseInt(metadata.duration.toString().replace(/\D/g, '')) || null : null,
              rate: metadata?.amount ? parseFloat(metadata.amount) / (metadata?.quantity || 1) : 0,
              total_amount: metadata?.amount ? parseFloat(metadata.amount) : 0,
              notes: metadata?.instructions,
              medication: activity.activity_type === 'medication' ? {
                name: metadata?.medication_name || activity.title.replace('Medication Prescribed: ', ''),
                brand_name: undefined
              } : undefined,
              service: activity.activity_type === 'treatment' ? {
                name: metadata?.service_name || activity.title.replace('Treatment: ', ''),
                description: activity.content
              } : undefined
            } as TreatmentItem;
          });
          
          setTreatmentItems(items);
        } else {
          setTreatmentItems([]);
        }
      }

      // Fetch consultation notes from the latest completed consultation session
      const { data: sessionNotes, error: notesError } = await supabase
        .from('consultation_sessions')
        .select(`
          consultation_notes (
            diagnosis,
            treatment_plan,
            prescriptions,
            chief_complaint
          )
        `)
        .eq('patient_id', queueEntry.patient_id)
        .eq('status', 'completed')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!notesError && sessionNotes?.consultation_notes?.[0]) {
        const notes = sessionNotes.consultation_notes[0];
        const notesText = [
          notes.chief_complaint ? `Notes: ${notes.chief_complaint}` : '',
          notes.diagnosis ? `Diagnosis: ${notes.diagnosis}` : '',
          notes.treatment_plan ? `Treatment Plan: ${notes.treatment_plan}` : '',
          notes.prescriptions ? `Prescriptions: ${notes.prescriptions}` : ''
        ].filter(Boolean).join('\n\n');
        setConsultationNotes(notesText);
      } else {
        // Fallback: Get consultation notes from patient activities
        const { data: consultationActivity } = await supabase
          .from('patient_activities')
          .select('content')
          .eq('patient_id', queueEntry.patient_id)
          .eq('activity_type', 'consultation')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        
        if (consultationActivity) {
          setConsultationNotes(consultationActivity.content || '');
        }
      }

      // Fetch payments for this patient (mock for now - you can implement actual payment tracking)
      setPayments([]);

    } catch (error) {
      console.error('Error fetching dispensary data:', error);
      toast({
        title: "Error",
        description: "Failed to load dispensary data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

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

  const handlePrintInvoice = () => {
    // Implement print functionality
    window.print();
  };

  const handlePrintLabel = (itemId: string) => {
    // Implement label printing for specific item
    console.log('Printing label for item:', itemId);
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
                  <Button variant="link" className="h-auto p-0 text-primary">
                    See consultation notes
                  </Button>
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
                      onClick={() => onStatusChange(queueEntry.id, 'in_consultation')}
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
                <Button variant="outline" size="sm">
                  <EditIcon className="h-4 w-4 mr-2" />
                  Edit invoice
                </Button>
                <Button variant="outline" size="sm" onClick={handlePrintInvoice}>
                  <PrinterIcon className="h-4 w-4 mr-2" />
                  Print invoice
                </Button>
              </div>

              {/* Itemized List */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Invoice Items</h3>
                {loading ? (
                  <div className="text-center py-4">Loading items...</div>
                 ) : treatmentItems.length === 0 ? (
                   <div className="text-center py-8 text-muted-foreground">
                     <div className="mb-2">No prescribed items found for today's consultation</div>
                     <div className="text-sm">Only items prescribed by the doctor in today's consultation will appear here</div>
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
                          <Button variant="ghost" size="sm">
                            <EditIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <TrashIcon className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handlePrintLabel(item.id)}>
                            <PrinterIcon className="h-4 w-4" />
                          </Button>
                        </div>
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