import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Search } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { usePanelClaims } from '@/hooks/usePanelClaims';
import { usePanels } from '@/hooks/usePanels';
import { supabase } from '@/integrations/supabase/client';

interface BillingRecord {
  id: string;
  invoice_number: string;
  description: string;
  amount: number;
  patient_id: string;
  status: string;
  due_date: string;
  created_at: string;
  panel_id?: string;
  patient?: {
    first_name: string;
    last_name: string;
  };
}

interface CreateClaimModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onClaimCreated: () => void;
}

export function CreateClaimModal({ open, onOpenChange, onClaimCreated }: CreateClaimModalProps) {
  const { createClaim } = usePanelClaims();
  const { panels } = usePanels();
  const [loading, setLoading] = useState(false);
  const [selectedPanel, setSelectedPanel] = useState<string>('');
  const [periodStart, setPeriodStart] = useState<Date>();
  const [periodEnd, setPeriodEnd] = useState<Date>();
  const [availableBilling, setAvailableBilling] = useState<BillingRecord[]>([]);
  const [selectedBilling, setSelectedBilling] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [loadingBilling, setLoadingBilling] = useState(false);

  const fetchAvailableBilling = async () => {
    if (!selectedPanel || !periodStart || !periodEnd) return;

    setLoadingBilling(true);
    try {
      const { data, error } = await supabase
        .from('billing')
        .select(`
          *,
          patient:patients(first_name, last_name)
        `)
        .eq('panel_id', selectedPanel)
        .gte('created_at', periodStart.toISOString())
        .lte('created_at', periodEnd.toISOString())
        .is('claim_number', null) // Only unbilled records
        .eq('status', 'pending');

      if (error) throw error;
      setAvailableBilling(data || []);
    } catch (error) {
      console.error('Error fetching billing records:', error);
    } finally {
      setLoadingBilling(false);
    }
  };

  useEffect(() => {
    if (selectedPanel && periodStart && periodEnd) {
      fetchAvailableBilling();
    }
  }, [selectedPanel, periodStart, periodEnd]);

  const filteredBilling = availableBilling.filter(record =>
    record.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
    record.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    `${record.patient?.first_name} ${record.patient?.last_name}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async () => {
    if (!selectedPanel || !periodStart || !periodEnd || selectedBilling.size === 0) {
      return;
    }

    setLoading(true);
    try {
      const result = await createClaim({
        panel_id: selectedPanel,
        billing_period_start: format(periodStart, 'yyyy-MM-dd'),
        billing_period_end: format(periodEnd, 'yyyy-MM-dd'),
        billing_ids: Array.from(selectedBilling),
      });

      if (result) {
        onClaimCreated();
        onOpenChange(false);
        resetForm();
      }
    } catch (error) {
      console.error('Error creating claim:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedPanel('');
    setPeriodStart(undefined);
    setPeriodEnd(undefined);
    setAvailableBilling([]);
    setSelectedBilling(new Set());
    setSearchTerm('');
  };

  const toggleBillingSelection = (billingId: string) => {
    const newSelection = new Set(selectedBilling);
    if (newSelection.has(billingId)) {
      newSelection.delete(billingId);
    } else {
      newSelection.add(billingId);
    }
    setSelectedBilling(newSelection);
  };

  const selectedTotal = availableBilling
    .filter(record => selectedBilling.has(record.id))
    .reduce((sum, record) => sum + record.amount, 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Panel Claim</DialogTitle>
          <DialogDescription>
            Generate a new claim for panel insurance billing
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Panel Selection */}
          <div className="space-y-2">
            <Label htmlFor="panel">Panel Company</Label>
            <Select value={selectedPanel} onValueChange={setSelectedPanel}>
              <SelectTrigger>
                <SelectValue placeholder="Select panel company" />
              </SelectTrigger>
              <SelectContent>
                {panels.map((panel) => (
                  <SelectItem key={panel.id} value={panel.id}>
                    <div>
                      <div className="font-medium">{panel.panel_name}</div>
                      <div className="text-sm text-muted-foreground">{panel.panel_code}</div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Billing Period */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Period Start</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !periodStart && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {periodStart ? format(periodStart, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={periodStart}
                    onSelect={setPeriodStart}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Period End</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !periodEnd && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {periodEnd ? format(periodEnd, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={periodEnd}
                    onSelect={setPeriodEnd}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Available Billing Records */}
          {selectedPanel && periodStart && periodEnd && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Select Billing Records</Label>
                <div className="flex items-center gap-2">
                  <Badge variant="outline">
                    {selectedBilling.size} selected • ${selectedTotal.toFixed(2)}
                  </Badge>
                </div>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search billing records..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Card className="max-h-60 overflow-y-auto">
                <CardContent className="p-4">
                  {loadingBilling ? (
                    <div className="text-center py-4">Loading billing records...</div>
                  ) : filteredBilling.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No billing records found for the selected period
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {filteredBilling.map((record) => (
                        <div
                          key={record.id}
                          className="flex items-center space-x-3 p-2 rounded-lg border hover:bg-muted/50"
                        >
                          <Checkbox
                            checked={selectedBilling.has(record.id)}
                            onCheckedChange={() => toggleBillingSelection(record.id)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="font-medium text-sm">{record.invoice_number}</div>
                                <div className="text-sm text-muted-foreground truncate">
                                  {record.patient?.first_name} {record.patient?.last_name} • {record.description}
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="font-medium">${record.amount.toFixed(2)}</div>
                                <div className="text-xs text-muted-foreground">
                                  {format(new Date(record.created_at), 'MMM dd')}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={loading || selectedBilling.size === 0}
          >
            {loading ? 'Creating...' : `Create Claim (${selectedBilling.size} items)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}