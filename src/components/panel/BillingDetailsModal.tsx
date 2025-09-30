import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { BillingRecord } from '@/hooks/useBillingRecords';

interface BillingDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  billingRecords: BillingRecord[];
}

export function BillingDetailsModal({ open, onOpenChange, billingRecords }: BillingDetailsModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    staff_name: '',
    staff_ic_passport: '',
    relationship_to_patient: 'self',
    billing_address: ''
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare billing party snapshot
      const billingPartySnapshot = {
        staff_name: formData.staff_name,
        staff_ic_passport: formData.staff_ic_passport,
        relationship_to_patient: formData.relationship_to_patient,
        billing_address: formData.billing_address,
        updated_at: new Date().toISOString()
      };

      // Update all selected billing records
      const updates = billingRecords.map(record => 
        supabase
          .from('billing')
          .update({
            billing_party_snapshot: billingPartySnapshot,
            staff_name: formData.staff_name,
            staff_ic_passport: formData.staff_ic_passport,
            relationship_to_patient: formData.relationship_to_patient,
            updated_at: new Date().toISOString()
          })
          .eq('id', record.id)
      );

      const results = await Promise.all(updates);
      
      const errors = results.filter(r => r.error);
      if (errors.length > 0) {
        throw new Error('Some updates failed');
      }

      toast({
        title: "Success",
        description: `Updated billing details for ${billingRecords.length} records`,
      });

      onOpenChange(false);
      
      // Refresh page to show updated data
      window.location.reload();
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: "Error updating billing details",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Change Billing Details</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="staff_name">Staff Name</Label>
            <Input
              id="staff_name"
              value={formData.staff_name}
              onChange={(e) => setFormData(prev => ({ ...prev, staff_name: e.target.value }))}
              placeholder="Enter staff name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="staff_ic">Staff IC/Passport</Label>
            <Input
              id="staff_ic"
              value={formData.staff_ic_passport}
              onChange={(e) => setFormData(prev => ({ ...prev, staff_ic_passport: e.target.value }))}
              placeholder="Enter IC or passport number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="relationship">Relationship to Patient</Label>
            <Select
              value={formData.relationship_to_patient}
              onValueChange={(value) => setFormData(prev => ({ ...prev, relationship_to_patient: value }))}
            >
              <SelectTrigger id="relationship">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="self">Self</SelectItem>
                <SelectItem value="spouse">Spouse</SelectItem>
                <SelectItem value="child">Child</SelectItem>
                <SelectItem value="parent">Parent</SelectItem>
                <SelectItem value="sibling">Sibling</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="billing_address">Billing Address</Label>
            <Textarea
              id="billing_address"
              value={formData.billing_address}
              onChange={(e) => setFormData(prev => ({ ...prev, billing_address: e.target.value }))}
              placeholder="Enter billing address"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : `Update ${billingRecords.length} Records`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
