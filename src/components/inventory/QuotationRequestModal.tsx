import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface Supplier {
  id: string;
  supplier_name: string;
  supplier_code: string;
}

interface Medication {
  id: string;
  name: string;
  unit_of_measure: string;
}

interface RequestItem {
  medication_id?: string;
  item_description: string;
  requested_quantity: number;
  unit_of_measure: string;
  specifications?: string;
  notes?: string;
}

interface QuotationRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const QuotationRequestModal: React.FC<QuotationRequestModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    supplier_id: '',
    required_by_date: '',
    priority: 'normal' as 'low' | 'normal' | 'high' | 'urgent',
    notes: ''
  });

  const [items, setItems] = useState<RequestItem[]>([
    {
      item_description: '',
      requested_quantity: 1,
      unit_of_measure: 'Tablet',
      specifications: '',
      notes: ''
    }
  ]);

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchSuppliers();
      fetchMedications();
    }
  }, [isOpen]);

  const fetchSuppliers = async () => {
    try {
      const { data, error } = await supabase
        .from('suppliers')
        .select('id, supplier_name, supplier_code')
        .order('supplier_name');

      if (error) throw error;
      setSuppliers(data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchMedications = async () => {
    try {
      const { data, error } = await supabase
        .from('medications')
        .select('id, name, unit_of_measure')
        .order('name');

      if (error) throw error;
      setMedications(data || []);
    } catch (error) {
      console.error('Error fetching medications:', error);
    }
  };

  const addItem = () => {
    setItems([...items, {
      item_description: '',
      requested_quantity: 1,
      unit_of_measure: 'Tablet',
      specifications: '',
      notes: ''
    }]);
  };

  const removeItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const updateItem = (index: number, field: keyof RequestItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // If selecting a medication, auto-fill item description and unit
    if (field === 'medication_id' && value) {
      const selectedMed = medications.find(m => m.id === value);
      if (selectedMed) {
        updatedItems[index].item_description = selectedMed.name;
        updatedItems[index].unit_of_measure = selectedMed.unit_of_measure;
      }
    }
    
    setItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Error",
        description: "Please enter a title for the quotation request.",
        variant: "destructive",
      });
      return;
    }

    const validItems = items.filter(item => 
      item.item_description.trim() && item.requested_quantity > 0
    );

    if (validItems.length === 0) {
      toast({
        title: "Error", 
        description: "Please add at least one valid item.",
        variant: "destructive",
      });
      return;
    }

    try {
      setSubmitting(true);

      // Generate request number
      const { data: requestData, error: requestError } = await supabase
        .rpc('generate_quotation_request_number');

      if (requestError) throw requestError;

      // Create quotation request
      const { data: quotationRequest, error: quotationError } = await supabase
        .from('quotation_requests')
        .insert({
          request_number: requestData,
          title: formData.title,
          description: formData.description || null,
          supplier_id: formData.supplier_id || null,
          requested_by: (await supabase.auth.getUser()).data.user?.id,
          required_by_date: formData.required_by_date || null,
          priority: formData.priority,
          notes: formData.notes || null,
          status: 'pending'
        })
        .select()
        .single();

      if (quotationError) throw quotationError;

      // Create request items
      const itemsToInsert = validItems.map(item => ({
        quotation_request_id: quotationRequest.id,
        medication_id: item.medication_id || null,
        item_description: item.item_description,
        requested_quantity: item.requested_quantity,
        unit_of_measure: item.unit_of_measure,
        specifications: item.specifications || null,
        notes: item.notes || null
      }));

      const { error: itemsError } = await supabase
        .from('quotation_request_items')
        .insert(itemsToInsert);

      if (itemsError) throw itemsError;

      toast({
        title: "Success",
        description: "Quotation request created successfully.",
      });

      onSuccess();
      onClose();
      resetForm();
    } catch (error) {
      console.error('Error creating quotation request:', error);
      toast({
        title: "Error",
        description: "Failed to create quotation request.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      supplier_id: '',
      required_by_date: '',
      priority: 'normal',
      notes: ''
    });
    setItems([{
      item_description: '',
      requested_quantity: 1,
      unit_of_measure: 'Tablet',
      specifications: '',
      notes: ''
    }]);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Quotation Request</DialogTitle>
          <DialogDescription>
            Request quotations from suppliers for medications and supplies
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Request Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    placeholder="e.g., Monthly medication order"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="supplier">Preferred Supplier (Optional)</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({...formData, supplier_id: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier or leave blank for any" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.supplier_name} ({supplier.supplier_code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Additional details about this quotation request"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="required_by_date">Required By Date</Label>
                  <Input
                    id="required_by_date"
                    type="date"
                    value={formData.required_by_date}
                    onChange={(e) => setFormData({...formData, required_by_date: e.target.value})}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: any) => setFormData({...formData, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Items */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Requested Items</CardTitle>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit</TableHead>
                    <TableHead>Specifications</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Select
                          value={item.medication_id || ''}
                          onValueChange={(value) => updateItem(index, 'medication_id', value || undefined)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select medication" />
                          </SelectTrigger>
                          <SelectContent>
                            {medications.map((medication) => (
                              <SelectItem key={medication.id} value={medication.id}>
                                {medication.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.item_description}
                          onChange={(e) => updateItem(index, 'item_description', e.target.value)}
                          placeholder="Item description"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.requested_quantity}
                          onChange={(e) => updateItem(index, 'requested_quantity', parseInt(e.target.value) || 1)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.unit_of_measure}
                          onChange={(e) => updateItem(index, 'unit_of_measure', e.target.value)}
                          placeholder="Unit"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.specifications || ''}
                          onChange={(e) => updateItem(index, 'specifications', e.target.value)}
                          placeholder="Specifications"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({...formData, notes: e.target.value})}
              placeholder="Any special instructions or requirements"
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create Request'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};