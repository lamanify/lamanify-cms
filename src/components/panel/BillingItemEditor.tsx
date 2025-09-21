import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BillingItem {
  id: string;
  invoice_number: string;
  description: string;
  amount: number;
  status: string;
  staff_name?: string;
  staff_ic_passport?: string;
  relationship_to_patient?: string;
  patient_id: string;
  created_at: string;
}

interface BillingItemEditorProps {
  billingItem: BillingItem;
  onUpdate?: (updatedItem: BillingItem) => Promise<void>;
  isEditable?: boolean;
}

const RELATIONSHIP_OPTIONS = [
  { value: 'self', label: 'Self' },
  { value: 'spouse', label: 'Spouse' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'other', label: 'Other' },
];

export function BillingItemEditor({ billingItem, onUpdate, isEditable = true }: BillingItemEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editedItem, setEditedItem] = useState<BillingItem>(billingItem);
  const { toast } = useToast();

  const handleEdit = () => {
    setIsEditing(true);
    setEditedItem({ ...billingItem });
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedItem({ ...billingItem });
  };

  const handleSave = async () => {
    if (!onUpdate) return;

    setIsLoading(true);
    try {
      await onUpdate(editedItem);
      setIsEditing(false);
      toast({
        title: "Billing item updated",
        description: "The billing information has been saved successfully.",
      });
    } catch (error) {
      console.error('Error updating billing item:', error);
      toast({
        title: "Error",
        description: "Failed to update billing item. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (field: keyof BillingItem, value: any) => {
    setEditedItem(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!isEditing) {
    return (
      <div className="space-y-4 p-4 border rounded-lg bg-card">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h3 className="font-medium">Invoice: {billingItem.invoice_number}</h3>
            <p className="text-sm text-muted-foreground">{billingItem.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={billingItem.status === 'paid' ? 'default' : 'secondary'}>
              {billingItem.status}
            </Badge>
            {isEditable && (
              <Button variant="ghost" size="sm" onClick={handleEdit}>
                <Edit className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium">Amount:</span> ${billingItem.amount.toFixed(2)}
          </div>
          {billingItem.staff_name && (
            <div>
              <span className="font-medium">Staff Name:</span> {billingItem.staff_name}
            </div>
          )}
          {billingItem.staff_ic_passport && (
            <div>
              <span className="font-medium">IC/Passport:</span> {billingItem.staff_ic_passport}
            </div>
          )}
          {billingItem.relationship_to_patient && (
            <div>
              <span className="font-medium">Relationship:</span>{' '}
              {RELATIONSHIP_OPTIONS.find(r => r.value === billingItem.relationship_to_patient)?.label}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <Dialog open={isEditing} onOpenChange={setIsEditing}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Billing Item</DialogTitle>
          <DialogDescription>
            Update the staff information and details for this billing item.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="invoice_number" className="text-right">
              Invoice Number
            </Label>
            <Input
              id="invoice_number"
              value={editedItem.invoice_number}
              className="col-span-3"
              disabled
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Description
            </Label>
            <Textarea
              id="description"
              value={editedItem.description}
              onChange={(e) => handleFieldChange('description', e.target.value)}
              className="col-span-3"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Amount
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={editedItem.amount}
              onChange={(e) => handleFieldChange('amount', parseFloat(e.target.value) || 0)}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="staff_name" className="text-right">
              Staff Name
            </Label>
            <Input
              id="staff_name"
              value={editedItem.staff_name || ''}
              onChange={(e) => handleFieldChange('staff_name', e.target.value)}
              className="col-span-3"
              placeholder="Enter staff member name"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="staff_ic_passport" className="text-right">
              IC/Passport Number
            </Label>
            <Input
              id="staff_ic_passport"
              value={editedItem.staff_ic_passport || ''}
              onChange={(e) => handleFieldChange('staff_ic_passport', e.target.value)}
              className="col-span-3"
              placeholder="Enter IC or passport number"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="relationship" className="text-right">
              Relationship to Patient
            </Label>
            <Select
              value={editedItem.relationship_to_patient || 'self'}
              onValueChange={(value) => handleFieldChange('relationship_to_patient', value)}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
            <X className="h-4 w-4 mr-2" />
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isLoading}>
            <Save className="h-4 w-4 mr-2" />
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}