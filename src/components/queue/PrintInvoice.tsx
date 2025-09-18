import React from 'react';
import { QueueEntry } from '@/hooks/useQueue';

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

interface PrintInvoiceProps {
  queueEntry: QueueEntry;
  treatmentItems: TreatmentItem[];
  payments: Payment[];
  consultationNotes: string;
  totalAmount: number;
  totalPaid: number;
  amountDue: number;
}

export function PrintInvoice({ 
  queueEntry, 
  treatmentItems, 
  payments, 
  consultationNotes, 
  totalAmount, 
  totalPaid, 
  amountDue 
}: PrintInvoiceProps) {
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

  return (
    <div className="print-invoice bg-white text-black p-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="print-header">
        <h1 className="text-2xl font-bold mb-2">Medical Invoice</h1>
        <div className="text-sm">
          <p>Invoice Date: {new Date().toLocaleDateString()}</p>
          <p>Invoice #: INV-{Date.now().toString().slice(-6)}</p>
        </div>
      </div>

      {/* Patient Information */}
      <div className="mb-6 print-avoid-break">
        <h2 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">Patient Information</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p><strong>Name:</strong> {queueEntry.patient?.first_name} {queueEntry.patient?.last_name}</p>
            <p><strong>Patient ID:</strong> {queueEntry.patient?.patient_id || 'N/A'}</p>
          </div>
          <div>
            <p><strong>Phone:</strong> {queueEntry.patient?.phone || 'N/A'}</p>
            <p><strong>Email:</strong> {queueEntry.patient?.email || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Consultation Notes */}
      {consultationNotes && (
        <div className="mb-6 print-avoid-break">
          <h2 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">Consultation Notes</h2>
          <div className="text-sm whitespace-pre-wrap bg-gray-50 p-3 rounded border">
            {consultationNotes}
          </div>
        </div>
      )}

      {/* Treatment Items */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-3 border-b border-gray-300 pb-1">Prescribed Items</h2>
        {treatmentItems.length === 0 ? (
          <p className="text-center py-4 text-gray-500">No items prescribed</p>
        ) : (
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 p-2 text-left w-8">#</th>
                <th className="border border-gray-300 p-2 text-left">Item</th>
                <th className="border border-gray-300 p-2 text-center w-16">Qty</th>
                <th className="border border-gray-300 p-2 text-right w-20">Rate</th>
                <th className="border border-gray-300 p-2 text-right w-24">Total</th>
              </tr>
            </thead>
            <tbody>
              {treatmentItems.map((item, index) => (
                <tr key={item.id}>
                  <td className="border border-gray-300 p-2 text-center">{index + 1}</td>
                  <td className="border border-gray-300 p-2">
                    <div className="font-medium">{getItemDisplayName(item)}</div>
                    {getItemInstructions(item) && (
                      <div className="text-xs text-gray-600 mt-1">
                        {getItemInstructions(item)}
                      </div>
                    )}
                    {item.notes && (
                      <div className="text-xs text-gray-600 mt-1">
                        Note: {item.notes}
                      </div>
                    )}
                  </td>
                  <td className="border border-gray-300 p-2 text-center">{item.quantity}</td>
                  <td className="border border-gray-300 p-2 text-right">RM {item.rate.toFixed(2)}</td>
                  <td className="border border-gray-300 p-2 text-right font-medium">RM {item.total_amount.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Payment Summary */}
      <div className="print-total">
        <div className="grid grid-cols-2 gap-8">
          {/* Payment History */}
          <div>
            <h3 className="font-semibold mb-2">Payment History</h3>
            {payments.length === 0 ? (
              <p className="text-sm text-gray-500">No payments recorded</p>
            ) : (
              <div className="space-y-1">
                {payments.map((payment) => (
                  <div key={payment.id} className="flex justify-between text-sm">
                    <span>{payment.method}</span>
                    <span>RM {payment.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Summary */}
          <div className="text-right">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>RM {totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-green-600">
                <span>Total Paid:</span>
                <span>RM {totalPaid.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t-2 border-gray-300 pt-2">
                <span>Amount Due:</span>
                <span className={amountDue > 0 ? 'text-red-600' : 'text-green-600'}>
                  RM {amountDue.toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-300 text-center text-sm text-gray-600">
        <p>Thank you for choosing our medical services.</p>
        <p>For inquiries, please contact us at your convenience.</p>
      </div>
    </div>
  );
}