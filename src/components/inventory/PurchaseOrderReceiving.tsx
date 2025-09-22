import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { PurchaseOrder, PurchaseOrderItem } from '@/hooks/usePurchaseOrders';
import { supabase } from '@/integrations/supabase/client';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';

interface PurchaseOrderReceivingProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  onUpdate: () => void;
}

interface ReceivingItem extends PurchaseOrderItem {
  receiving_quantity: number;
  received_unit_cost: number;
  batch_number: string;
  expiry_date: string;
  is_selected: boolean;
}

export function PurchaseOrderReceiving({ isOpen, onClose, purchaseOrder, onUpdate }: PurchaseOrderReceivingProps) {
  const [receivingItems, setReceivingItems] = useState<ReceivingItem[]>([]);
  const [deliveryDate, setDeliveryDate] = useState(new Date().toISOString().split('T')[0]);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [shippingCost, setShippingCost] = useState('0');
  const [notes, setNotes] = useState('');
  const [isPartialReceiving, setIsPartialReceiving] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Initialize receiving items when purchase order changes
  useEffect(() => {
    if (purchaseOrder?.items) {
      const items: ReceivingItem[] = purchaseOrder.items.map(item => ({
        ...item,
        receiving_quantity: (item.quantity_ordered || 0) - (item.quantity_received || 0),
        received_unit_cost: item.unit_cost || 0,
        batch_number: '',
        expiry_date: '',
        is_selected: true
      }));
      setReceivingItems(items);
    }
  }, [purchaseOrder]);

  const updateReceivingItem = (index: number, field: keyof ReceivingItem, value: any) => {
    const updatedItems = [...receivingItems];
    updatedItems[index] = { ...updatedItems[index], [field]: value };
    setReceivingItems(updatedItems);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!purchaseOrder?.id) return;

    setSubmitting(true);

    try {
      const selectedItems = receivingItems.filter(item => item.is_selected && item.receiving_quantity > 0);
      
      if (selectedItems.length === 0) {
        toast.error('Please select at least one item to receive');
        return;
      }

      // Prepare items for receipt processing
      const receiptItems = selectedItems.map(item => ({
        item_id: item.id,
        medication_id: item.medication_id,
        received_quantity: item.receiving_quantity,
        received_unit_cost: item.received_unit_cost,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date || null
      }));

      // Process receipt using the database function
      const { error: receiptError } = await supabase.rpc('process_po_receipt', {
        p_po_id: purchaseOrder.id,
        p_items: receiptItems
      });

      if (receiptError) throw receiptError;

      // Update purchase order status
      const allItemsReceived = receivingItems.every(item => 
        !item.is_selected || (item.quantity_received || 0) + item.receiving_quantity >= (item.quantity_ordered || 0)
      );

      const newStatus = allItemsReceived ? 'received' : 'partially_received';

      const { error: poError } = await supabase
        .from('purchase_orders')
        .update({
          status: newStatus,
          delivery_date: deliveryDate,
          tracking_number: trackingNumber || null,
          shipping_cost: parseFloat(shippingCost) || 0,
          received_at: new Date().toISOString(),
          received_by: (await supabase.auth.getUser()).data.user?.id,
          notes: notes || null
        })
        .eq('id', purchaseOrder.id);

      if (poError) throw poError;

      toast.success('Purchase order received successfully');
      onUpdate();
      onClose();
    } catch (error) {
      console.error('Error processing receipt:', error);
      toast.error('Failed to process receipt');
    } finally {
      setSubmitting(false);
    }
  };

  const totalReceivingValue = receivingItems
    .filter(item => item.is_selected)
    .reduce((sum, item) => sum + (item.receiving_quantity * item.received_unit_cost), 0);

  if (!purchaseOrder) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Receive Purchase Order - {purchaseOrder.po_number}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Receipt Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="deliveryDate">Delivery Date</Label>
              <Input
                id="deliveryDate"
                type="date"
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="trackingNumber">Tracking Number</Label>
              <Input
                id="trackingNumber"
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                placeholder="Enter tracking number"
              />
            </div>
            <div>
              <Label htmlFor="shippingCost">Shipping Cost</Label>
              <Input
                id="shippingCost"
                type="number"
                step="0.01"
                value={shippingCost}
                onChange={(e) => setShippingCost(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="partialReceiving"
                  checked={isPartialReceiving}
                  onCheckedChange={(checked) => setIsPartialReceiving(!!checked)}
                />
                <Label htmlFor="partialReceiving">Partial Receiving</Label>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">Select</TableHead>
                  <TableHead>Item</TableHead>
                  <TableHead>Ordered</TableHead>
                  <TableHead>Prev. Received</TableHead>
                  <TableHead>Receiving Qty</TableHead>
                  <TableHead>Unit Cost</TableHead>
                  <TableHead>Batch Number</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {receivingItems.map((item, index) => (
                  <TableRow key={item.id || index}>
                    <TableCell>
                      <Checkbox
                        checked={item.is_selected}
                        onCheckedChange={(checked) => 
                          updateReceivingItem(index, 'is_selected', !!checked)
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{item.item_name}</div>
                        {item.notes && (
                          <div className="text-sm text-muted-foreground">{item.notes}</div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{item.quantity_ordered}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {item.quantity_received || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        min="0"
                        max={(item.quantity_ordered || 0) - (item.quantity_received || 0)}
                        value={item.receiving_quantity}
                        onChange={(e) => 
                          updateReceivingItem(index, 'receiving_quantity', parseInt(e.target.value) || 0)
                        }
                        disabled={!item.is_selected}
                        className="w-20"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        step="0.01"
                        value={item.received_unit_cost}
                        onChange={(e) => 
                          updateReceivingItem(index, 'received_unit_cost', parseFloat(e.target.value) || 0)
                        }
                        disabled={!item.is_selected}
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        value={item.batch_number}
                        onChange={(e) => 
                          updateReceivingItem(index, 'batch_number', e.target.value)
                        }
                        disabled={!item.is_selected}
                        placeholder="Batch #"
                        className="w-24"
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="date"
                        value={item.expiry_date}
                        onChange={(e) => 
                          updateReceivingItem(index, 'expiry_date', e.target.value)
                        }
                        disabled={!item.is_selected}
                        className="w-32"
                      />
                    </TableCell>
                    <TableCell>
                      {item.is_selected ? (item.receiving_quantity * item.received_unit_cost).toFixed(2) : '-'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Receipt Summary */}
          <div className="flex justify-between items-center p-4 bg-muted rounded-lg">
            <div className="text-sm text-muted-foreground">
              Total Receiving Value: <span className="font-semibold">${totalReceivingValue.toFixed(2)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              Shipping Cost: <span className="font-semibold">${parseFloat(shippingCost).toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <Label htmlFor="notes">Receipt Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any additional notes about this receipt..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Processing...' : 'Receive Items'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}