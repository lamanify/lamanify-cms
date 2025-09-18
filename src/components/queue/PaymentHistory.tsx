import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { PrinterIcon, TrashIcon, CreditCardIcon } from 'lucide-react';
import { format } from 'date-fns';
import { PaymentRecord, PaymentSummary } from '@/hooks/usePayments';
import { useUserPermissions } from '@/hooks/useUserPermissions';

interface PaymentHistoryProps {
  payments: PaymentRecord[];
  summary: PaymentSummary;
  onDeletePayment?: (paymentId: string) => Promise<boolean>;
  onPrintReceipt?: (payment: PaymentRecord) => void;
  loading?: boolean;
  patientName: string;
}

const paymentMethodLabels: Record<string, string> = {
  cash: 'Cash',
  card: 'Card',
  online: 'Online',
  insurance: 'Insurance',
  others: 'Others'
};

const paymentMethodColors: Record<string, string> = {
  cash: 'bg-green-100 text-green-800',
  card: 'bg-blue-100 text-blue-800',
  online: 'bg-purple-100 text-purple-800',
  insurance: 'bg-orange-100 text-orange-800',
  others: 'bg-gray-100 text-gray-800'
};

export function PaymentHistory({
  payments,
  summary,
  onDeletePayment,
  onPrintReceipt,
  loading = false,
  patientName
}: PaymentHistoryProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { hasPermission } = useUserPermissions();
  const canDeletePayments = true; // Simplified for now - can be enhanced later

  const handleDeletePayment = async (paymentId: string) => {
    if (!onDeletePayment) return;
    
    setDeletingId(paymentId);
    try {
      await onDeletePayment(paymentId);
    } finally {
      setDeletingId(null);
    }
  };

  const generateReceipt = (payment: PaymentRecord) => {
    const receiptData = {
      receiptNumber: `RCP-${payment.created_at.split('T')[0].replace(/-/g, '')}-${payment.id.slice(-6).toUpperCase()}`,
      paymentDate: format(new Date(payment.payment_date), 'dd/MM/yyyy'),
      amount: payment.amount,
      paymentMethod: paymentMethodLabels[payment.payment_method],
      referenceNumber: payment.reference_number,
      processedBy: payment.processed_by_profile 
        ? `${payment.processed_by_profile.first_name} ${payment.processed_by_profile.last_name}`
        : 'Unknown',
      notes: payment.notes,
      patientName
    };

    const receiptHTML = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Payment Receipt</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .receipt { max-width: 400px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
            .row { display: flex; justify-content: space-between; margin: 5px 0; }
            .amount { font-size: 18px; font-weight: bold; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h2>PAYMENT RECEIPT</h2>
              <p>Receipt #: ${receiptData.receiptNumber}</p>
            </div>
            
            <div class="row">
              <span>Patient:</span>
              <span><strong>${receiptData.patientName}</strong></span>
            </div>
            
            <div class="row">
              <span>Date:</span>
              <span>${receiptData.paymentDate}</span>
            </div>
            
            <div class="row">
              <span>Payment Method:</span>
              <span>${receiptData.paymentMethod}</span>
            </div>
            
            ${receiptData.referenceNumber ? `
            <div class="row">
              <span>Reference:</span>
              <span>${receiptData.referenceNumber}</span>
            </div>
            ` : ''}
            
            <hr style="margin: 15px 0;">
            
            <div class="row amount">
              <span>Amount Paid:</span>
              <span>RM${receiptData.amount.toFixed(2)}</span>
            </div>
            
            ${receiptData.notes ? `
            <div style="margin-top: 15px;">
              <strong>Notes:</strong> ${receiptData.notes}
            </div>
            ` : ''}
            
            <div class="footer">
              <p>Processed by: ${receiptData.processedBy}</p>
              <p>Thank you for your payment</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(receiptHTML);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
      printWindow.close();
    }

    if (onPrintReceipt) {
      onPrintReceipt(payment);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading payments...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCardIcon className="h-5 w-5" />
          Payment History
        </CardTitle>
        
        {/* Payment Summary */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-2xl font-bold">RM{summary.total_amount.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Amount</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-success">RM{summary.total_paid.toFixed(2)}</div>
            <div className="text-sm text-muted-foreground">Total Paid</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold ${summary.amount_due === 0 ? 'text-success' : 'text-destructive'}`}>
              RM{summary.amount_due.toFixed(2)}
            </div>
            <div className="text-sm text-muted-foreground">Outstanding</div>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {payments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No payments recorded yet
          </div>
        ) : (
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Processed By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell>
                      {format(new Date(payment.payment_date), 'dd/MM/yyyy')}
                    </TableCell>
                    <TableCell className="font-medium">
                      RM{payment.amount.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant="outline" 
                        className={paymentMethodColors[payment.payment_method] || 'bg-gray-100 text-gray-800'}
                      >
                        {paymentMethodLabels[payment.payment_method] || payment.payment_method}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {payment.reference_number || '-'}
                    </TableCell>
                    <TableCell>
                      {payment.processed_by_profile 
                        ? `${payment.processed_by_profile.first_name} ${payment.processed_by_profile.last_name}`
                        : 'Unknown'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={payment.status === 'confirmed' ? 'default' : 'secondary'}
                      >
                        {payment.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => generateReceipt(payment)}
                          title="Print Receipt"
                        >
                          <PrinterIcon className="h-4 w-4" />
                        </Button>
                        
                        {canDeletePayments && onDeletePayment && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={deletingId === payment.id}
                                title="Delete Payment"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete this payment of RM{payment.amount.toFixed(2)}? 
                                  This action cannot be undone and will affect the total payment calculations.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => handleDeletePayment(payment.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete Payment
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}