import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Plus, FileText, ExternalLink, Clock, AlertCircle } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { useBillingSync } from '@/hooks/useBillingSync';

interface BillingRecord {
  id: string;
  invoice_number: string;
  description: string;
  amount: number;
  status: string;
  due_date: string;
  paid_date?: string;
  payment_method?: string;
  created_at: string;
  appointment_id?: string;
  patients: {
    first_name: string;
    last_name: string;
  };
}

export default function Billing() {
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const { toast } = useToast();
  const { isEnabled: billingSyncEnabled } = useBillingSync();

  useEffect(() => {
    fetchBills();
    
    // Set up real-time subscription for billing updates
    const channel = supabase
      .channel('billing-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'billing'
        },
        (payload) => {
          console.log('Billing record changed:', payload);
          setSyncStatus('syncing');
          // Refresh billing data when records change
          fetchBills().finally(() => setSyncStatus('idle'));
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'patient_visits'
        },
        (payload) => {
          console.log('Patient visit updated, checking for billing sync:', payload);
          setSyncStatus('syncing');
          // Refresh billing when patient visit payment status changes
          setTimeout(() => {
            fetchBills().finally(() => setSyncStatus('idle'));
          }, 1000); // Small delay to allow trigger to process
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBills = async () => {
    try {
      setSyncStatus('syncing');
      const { data, error } = await supabase
        .from('billing')
        .select(`
          *,
          patients (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBills(data || []);
      setSyncStatus('idle');
    } catch (error) {
      console.error('Error fetching bills:', error);
      setSyncStatus('error');
      toast({
        title: "Error",
        description: "Failed to fetch billing records",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'outline',
      paid: 'default',
      overdue: 'destructive',
      cancelled: 'secondary'
    };
    return variants[status] || 'outline';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid': return <DollarSign className="h-4 w-4 text-success" />;
      case 'overdue': return <AlertCircle className="h-4 w-4 text-destructive" />;
      case 'pending': return <Clock className="h-4 w-4 text-warning" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const isOverdue = (dueDate: string, status: string) => {
    return status === 'pending' && new Date(dueDate) < new Date();
  };

  const { formatCurrency } = useCurrency();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Billing & Payments</h1>
            <p className="text-muted-foreground">Loading billing records...</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Payments</h1>
          <div className="flex items-center gap-2">
            <p className="text-muted-foreground">Manage invoices, payments, and financial records</p>
            {syncStatus === 'syncing' && (
              <div className="flex items-center gap-1 text-sm text-primary">
                <div className="animate-spin rounded-full h-3 w-3 border-b border-primary"></div>
                Syncing...
              </div>
            )}
            {syncStatus === 'error' && (
              <div className="flex items-center gap-1 text-sm text-destructive">
                <AlertCircle className="h-3 w-3" />
                Sync Error
              </div>
            )}
          </div>
        </div>
        <Button disabled>
          <Plus className="mr-2 h-4 w-4" />
          View Only Mode
        </Button>
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-16rem)]">
        <div className="space-y-4 pr-6">
          {bills.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-semibold text-muted-foreground">No billing records</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Billing records will appear here automatically when visits are completed
                </p>
                <Badge variant="outline" className="text-xs">
                  Read-only: Updates from queue/dispensary system
                </Badge>
              </CardContent>
            </Card>
          ) : (
            bills.map((bill) => {
              const overdue = isOverdue(bill.due_date, bill.status);
              const actualStatus = overdue ? 'overdue' : bill.status;
              
              return (
                <Card key={bill.id} className={`transition-all hover:shadow-md ${overdue ? 'border-destructive/50' : ''}`}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-3">
                        {getStatusIcon(actualStatus)}
                        <div>
                          <p className="text-lg font-semibold">{bill.invoice_number}</p>
                          <p className="text-sm text-muted-foreground">
                            {bill.patients?.first_name} {bill.patients?.last_name}
                          </p>
                        </div>
                      </CardTitle>
                      <div className="flex flex-col items-end gap-2">
                        <Badge variant={getStatusBadge(actualStatus)}>
                          {overdue ? 'Overdue' : bill.status}
                        </Badge>
                        {bill.appointment_id && (
                          <Badge variant="secondary" className="text-xs">
                            Visit ID: {bill.appointment_id.slice(-8)}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-sm">{bill.description}</p>
                    
                    {/* Sync status indicator */}
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-muted-foreground">
                        Status synced from dispensary system
                      </span>
                      {bill.paid_date && (
                        <span className="text-success">
                          Paid: {new Date(bill.paid_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-2xl font-bold">{formatCurrency(bill.amount)}</span>
                      <div className="text-right">
                        <p className={`text-sm ${overdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          Due: {new Date(bill.due_date).toLocaleDateString()}
                        </p>
                        {bill.appointment_id && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-xs h-6 px-2 mt-1"
                            onClick={() => {
                              // Navigate to queue or visit details - placeholder for future implementation
                              toast({
                                title: "Visit Details",
                                description: "Visit tracking integration coming soon",
                              });
                            }}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            View Visit
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </ScrollArea>
    </div>
  );
}