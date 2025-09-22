import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { CreditCard, Receipt, DollarSign, Calendar, TrendingUp, TrendingDown } from 'lucide-react';
import { Patient } from '@/pages/Patients';
import { useCurrency } from '@/hooks/useCurrency';

interface PaymentRecord {
  id: string;
  visit_date: string;
  amount: number;
  payment_method: string;
  status: string;
  visit_summary: string;
  doctor_name: string;
  payment_date?: string;
}

interface FinancialSummary {
  totalVisits: number;
  totalAmount: number;
  totalPaid: number;
  outstanding: number;
  lastPayment?: PaymentRecord;
}

interface PatientFinancialTabProps {
  patient: Patient;
  onSave: () => void;
}

export function PatientFinancialTab({ patient, onSave }: PatientFinancialTabProps) {
  const [paymentRecords, setPaymentRecords] = useState<PaymentRecord[]>([]);
  const [financialSummary, setFinancialSummary] = useState<FinancialSummary>({
    totalVisits: 0,
    totalAmount: 0,
    totalPaid: 0,
    outstanding: 0
  });
  const [loading, setLoading] = useState(true);
  const { formatCurrency } = useCurrency();

  useEffect(() => {
    if (patient?.id) {
      fetchFinancialData();
    }
  }, [patient?.id]);

  // Set up real-time subscription
  useEffect(() => {
    if (!patient?.id) return;

    const channel = supabase
      .channel('patient-financial-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'patient_visits',
          filter: `patient_id=eq.${patient.id}`
        },
        () => {
          console.log('Financial records updated, refreshing...');
          fetchFinancialData();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_records'
        },
        (payload) => {
          // Check if the payment is related to this patient
          if (payload.new && 'visit_id' in payload.new) {
            checkPaymentBelongsToPatient(payload.new.visit_id as string);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [patient?.id]);

  const checkPaymentBelongsToPatient = async (visitId: string) => {
    try {
      const { data } = await supabase
        .from('patient_visits')
        .select('patient_id')
        .eq('id', visitId)
        .single();

      if (data && data.patient_id === patient?.id) {
        fetchFinancialData();
      }
    } catch (error) {
      console.error('Error checking payment relation:', error);
    }
  };

  const fetchFinancialData = async () => {
    if (!patient?.id) return;

    setLoading(true);
    try {
      // Fetch visits with payment information
      const { data: visits, error: visitsError } = await supabase
        .from('patient_visits')
        .select(`
          id,
          visit_date,
          total_amount,
          amount_paid,
          payment_status,
          visit_summary,
          created_at,
          profiles!patient_visits_doctor_id_fkey(first_name, last_name),
          payment_records(
            id,
            amount,
            payment_method,
            payment_date,
            status,
            notes
          )
        `)
        .eq('patient_id', patient.id)
        .order('visit_date', { ascending: false });

      if (visitsError) throw visitsError;

      // Transform data
      const records: PaymentRecord[] = [];
      let totalVisits = 0;
      let totalAmount = 0;
      let totalPaid = 0;

      visits?.forEach(visit => {
        totalVisits++;
        totalAmount += visit.total_amount || 0;
        totalPaid += visit.amount_paid || 0;

        const doctorProfile = Array.isArray(visit.profiles) ? visit.profiles[0] : visit.profiles;
        const doctorName = doctorProfile 
          ? `Dr. ${doctorProfile.first_name} ${doctorProfile.last_name}`
          : 'Unknown Doctor';

        // Add visit record
        records.push({
          id: visit.id,
          visit_date: visit.visit_date,
          amount: visit.total_amount || 0,
          payment_method: 'visit',
          status: visit.payment_status || 'pending',
          visit_summary: visit.visit_summary || 'Visit completed',
          doctor_name: doctorName
        });

        // Add individual payment records
        if (visit.payment_records && Array.isArray(visit.payment_records)) {
          visit.payment_records.forEach(payment => {
            records.push({
              id: `payment-${payment.id}`,
              visit_date: visit.visit_date,
              amount: payment.amount,
              payment_method: payment.payment_method || 'cash',
              status: payment.status || 'confirmed',
              visit_summary: `Payment - ${payment.notes || 'Payment received'}`,
              doctor_name: doctorName,
              payment_date: payment.payment_date
            });
          });
        }
      });

      // Sort by date
      records.sort((a, b) => new Date(b.visit_date).getTime() - new Date(a.visit_date).getTime());

      const summary: FinancialSummary = {
        totalVisits,
        totalAmount,
        totalPaid,
        outstanding: totalAmount - totalPaid,
        lastPayment: records.find(r => r.payment_method !== 'visit' && r.status === 'confirmed')
      };

      setPaymentRecords(records);
      setFinancialSummary(summary);
    } catch (error) {
      console.error('Error fetching financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'partial':
        return 'bg-orange-100 text-orange-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      case 'card':
        return <CreditCard className="h-4 w-4" />;
      default:
        return <Receipt className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-32">
          <div className="text-muted-foreground">Loading financial records...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Visits</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{financialSummary.totalVisits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Amount</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(financialSummary.totalAmount)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Paid</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialSummary.totalPaid)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Outstanding</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialSummary.outstanding > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {formatCurrency(financialSummary.outstanding)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Last Payment Info */}
      {financialSummary.lastPayment && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Last Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">{formatCurrency(financialSummary.lastPayment.amount)}</p>
                <p className="text-sm text-muted-foreground">
                  {format(new Date(financialSummary.lastPayment.payment_date || financialSummary.lastPayment.visit_date), 'PPP')}
                </p>
              </div>
              <Badge className={getStatusColor(financialSummary.lastPayment.status)}>
                {financialSummary.lastPayment.payment_method}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Records */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5" />
            Payment Records ({paymentRecords.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paymentRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Receipt className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No payment records found</p>
              <p className="text-sm">Payment records will appear here after visits and payments</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-4">
                {paymentRecords.map((record, index) => (
                  <div key={record.id}>
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="flex-shrink-0 w-8 h-8 bg-muted rounded-full flex items-center justify-center">
                          {getPaymentMethodIcon(record.payment_method)}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium text-sm">
                              {format(new Date(record.payment_date || record.visit_date), 'PPP')}
                            </span>
                            <Badge className={getStatusColor(record.status)}>
                              {record.status}
                            </Badge>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-1">
                            {record.visit_summary}
                          </p>
                          
                          <p className="text-xs text-muted-foreground">
                            {record.doctor_name}
                          </p>
                        </div>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <div className={`font-medium ${record.payment_method === 'visit' ? '' : 'text-green-600'}`}>
                          {record.payment_method === 'visit' ? '' : '+'}
                          {formatCurrency(record.amount)}
                        </div>
                        <div className="text-xs text-muted-foreground capitalize">
                          {record.payment_method}
                        </div>
                      </div>
                    </div>
                    
                    {index < paymentRecords.length - 1 && (
                      <Separator className="my-4" />
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}