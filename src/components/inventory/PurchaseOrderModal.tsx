import { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { usePurchaseOrders, PurchaseOrder, PurchaseOrderItem } from '@/hooks/usePurchaseOrders';
import { useMedications } from '@/hooks/useMedications';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder?: PurchaseOrder | null;
}

export function PurchaseOrderModal({ isOpen, onClose, purchaseOrder }: Props) {
  const { suppliers, createPurchaseOrder, updatePurchaseOrder } = usePurchaseOrders();
  const { medications } = useMedications();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<Omit<PurchaseOrder, 'id'>>({
    supplier_id: '',
    order_date: new Date().toISOString().split('T')[0],
    expected_delivery_date: '',
    status: 'draft',
    subtotal: 0,
    tax_amount: 0,
    total_amount: 0,
    notes: '',
    items: []
  });

  const [items, setItems] = useState<PurchaseOrderItem[]>([]);

  useEffect(() => {
    if (purchaseOrder) {
      setFormData({
        supplier_id: purchaseOrder.supplier_id,
        order_date: purchaseOrder.order_date,
        expected_delivery_date: purchaseOrder.expected_delivery_date || '',
        status: purchaseOrder.status,
        subtotal: purchaseOrder.subtotal,
        tax_amount: purchaseOrder.tax_amount || 0,
        total_amount: purchaseOrder.total_amount,
        notes: purchaseOrder.notes || ''
      });
      setItems(purchaseOrder.items || []);
    } else {
      setFormData({
        supplier_id: '',
        order_date: new Date().toISOString().split('T')[0],
        expected_delivery_date: '',
        status: 'draft',
        subtotal: 0,
        tax_amount: 0,
        total_amount: 0,
        notes: '',
        items: []
      });
      setItems([]);
    }
  }, [purchaseOrder, isOpen]);

  const addItem = () => {
    setItems([...items, {
      item_name: '',
      quantity_ordered: 1,
      unit_cost: 0,
      total_cost: 0
    }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof PurchaseOrderItem, value: any) => {
    const updatedItems = [...items];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    
    // Calculate total cost for the item
    if (field === 'quantity_ordered' || field === 'unit_cost') {
      const quantity = field === 'quantity_ordered' ? value : updatedItems[index].quantity_ordered;
      const unitCost = field === 'unit_cost' ? value : updatedItems[index].unit_cost;
      updatedItems[index].total_cost = quantity * unitCost;
    }
    
    setItems(updatedItems);
    calculateTotals(updatedItems);
  };

  const calculateTotals = (itemList: PurchaseOrderItem[]) => {
    const subtotal = itemList.reduce((sum, item) => sum + item.total_cost, 0);
    const taxAmount = subtotal * 0.1; // 10% tax
    const total = subtotal + taxAmount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      tax_amount: taxAmount,
      total_amount: total
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const orderData = {
        ...formData,
        items
      };

      if (purchaseOrder) {
        await updatePurchaseOrder(purchaseOrder.id!, orderData);
      } else {
        await createPurchaseOrder(orderData);
      }
      
      onClose();
    } catch (error) {
      console.error('Error saving purchase order:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectMedication = (index: number, medicationId: string) => {
    const medication = medications.find(m => m.id === medicationId);
    if (medication) {
      updateItem(index, 'medication_id', medicationId);
      updateItem(index, 'item_name', medication.name);
      updateItem(index, 'unit_cost', medication.cost_price || 0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {purchaseOrder ? 'Edit Purchase Order' : 'Create Purchase Order'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="supplier_id">Supplier *</Label>
              <Select
                value={formData.supplier_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, supplier_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a supplier" />
                </SelectTrigger>
                <SelectContent>
                  {suppliers.map((supplier) => (
                    <SelectItem key={supplier.id} value={supplier.id}>
                      {supplier.supplier_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="order_date">Order Date *</Label>
              <Input
                type="date"
                value={formData.order_date}
                onChange={(e) => setFormData(prev => ({ ...prev, order_date: e.target.value }))}
                required
              />
            </div>

            <div>
              <Label htmlFor="expected_delivery_date">Expected Delivery Date</Label>
              <Input
                type="date"
                value={formData.expected_delivery_date}
                onChange={(e) => setFormData(prev => ({ ...prev, expected_delivery_date: e.target.value }))}
              />
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData(prev => ({ ...prev, status: value as any }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="ordered">Ordered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <Label>Items</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="h-4 w-4 mr-2" />
                Add Item
              </Button>
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item/Medication</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="space-y-2">
                        <Select
                          value={item.medication_id || ''}
                          onValueChange={(value) => selectMedication(index, value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select medication" />
                          </SelectTrigger>
                          <SelectContent>
                            {medications.map((med) => (
                              <SelectItem key={med.id} value={med.id}>
                                {med.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Input
                          placeholder="Or enter custom item name"
                          value={item.item_name}
                          onChange={(e) => updateItem(index, 'item_name', e.target.value)}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="1"
                        value={item.quantity_ordered}
                        onChange={(e) => updateItem(index, 'quantity_ordered', parseInt(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={item.unit_cost}
                        onChange={(e) => updateItem(index, 'unit_cost', parseFloat(e.target.value) || 0)}
                      />
                    </TableCell>
                    <TableCell>
                      ${item.total_cost.toFixed(2)}
                    </TableCell>
                    <TableCell>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => removeItem(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <div className="grid grid-cols-3 gap-4 border-t pt-4">
            <div>
              <Label>Subtotal</Label>
              <div className="text-lg font-semibold">${formData.subtotal.toFixed(2)}</div>
            </div>
            <div>
              <Label>Tax (10%)</Label>
              <div className="text-lg font-semibold">${formData.tax_amount.toFixed(2)}</div>
            </div>
            <div>
              <Label>Total Amount</Label>
              <div className="text-xl font-bold">${formData.total_amount.toFixed(2)}</div>
            </div>
          </div>

          <div>
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Additional notes or instructions"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !formData.supplier_id || items.length === 0}>
              {loading ? 'Saving...' : (purchaseOrder ? 'Update' : 'Create')} Purchase Order
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}