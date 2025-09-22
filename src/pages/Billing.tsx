import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { DollarSign, Plus, FileText } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

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
  patients: {
    first_name: string;
    last_name: string;
  };
}

export default function Billing() {
  const [bills, setBills] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    try {
      const { data, error } = await supabase
        .from('billing')
        .select(`
          *,
          patients (first_name, last_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBills(data || []);
    } catch (error) {
      console.error('Error fetching bills:', error);
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

  const { formatCurrency } = useCurrency();

  if (loading) {
    return <div>Loading billing records...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Billing & Payments</h1>
          <p className="text-muted-foreground">Manage invoices, payments, and financial records</p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Invoice
        </Button>
      </div>

      <div className="space-y-4">
        {bills.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <DollarSign className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-semibold text-muted-foreground">No billing records</p>
              <p className="text-sm text-muted-foreground mb-4">
                Start by creating your first invoice
              </p>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Create First Invoice
              </Button>
            </CardContent>
          </Card>
        ) : (
          bills.map((bill) => (
            <Card key={bill.id}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <FileText className="h-5 w-5" />
                    <div>
                      <p className="text-lg font-semibold">{bill.invoice_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {bill.patients?.first_name} {bill.patients?.last_name}
                      </p>
                    </div>
                  </CardTitle>
                  <Badge variant={getStatusBadge(bill.status)}>
                    {bill.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm">{bill.description}</p>
                <div className="flex justify-between items-center">
                  <span className="text-2xl font-bold">{formatCurrency(bill.amount)}</span>
                  <span className="text-sm text-muted-foreground">
                    Due: {new Date(bill.due_date).toLocaleDateString()}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}