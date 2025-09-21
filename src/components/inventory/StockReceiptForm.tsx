import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, 
  Trash2, 
  Package, 
  TrendingUp,
  Save,
  Calculator
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStockMovements } from '@/hooks/useStockMovements';
import { useMedications } from '@/hooks/useMedications';
import { format } from 'date-fns';

interface ReceiptItem {
  id: string;
  medication_id: string;
  medication_name: string;
  quantity: number;
  unit_cost: number;
  total_cost: number;
  batch_number?: string;
  expiry_date?: string;
}

interface ReceiptFormData {
  supplier_name: string;
  reference_number: string;
  receipt_date: string;
  notes: string;
  items: ReceiptItem[];
}

export function StockReceiptForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<ReceiptFormData>({
    supplier_name: '',
    reference_number: '',
    receipt_date: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    items: []
  });

  const { createStockMovement } = useStockMovements();
  const { medications } = useMedications();
  const { toast } = useToast();

  const addItem = () => {
    const newItem: ReceiptItem = {
      id: `temp-${Date.now()}`,
      medication_id: '',
      medication_name: '',
      quantity: 0,
      unit_cost: 0,
      total_cost: 0,
      batch_number: '',
      expiry_date: ''
    };
    
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }));
  };

  const removeItem = (itemId: string) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter(item => item.id !== itemId)
    }));
  };

  const updateItem = (itemId: string, updates: Partial<ReceiptItem>) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.map(item => {
        if (item.id === itemId) {
          const updatedItem = { ...item, ...updates };
          
          // Update medication name if medication_id changed
          if (updates.medication_id) {
            const medication = medications.find(m => m.id === updates.medication_id);
            updatedItem.medication_name = medication?.name || '';
            // Auto-fill unit cost from medication cost price
            if (medication?.cost_price && !updatedItem.unit_cost) {
              updatedItem.unit_cost = medication.cost_price;
            }
          }
          
          // Recalculate total cost
          updatedItem.total_cost = updatedItem.quantity * updatedItem.unit_cost;
          
          return updatedItem;
        }
        return item;
      })
    }));
  };

  const calculateTotals = () => {
    const totalQuantity = formData.items.reduce((sum, item) => sum + item.quantity, 0);
    const totalValue = formData.items.reduce((sum, item) => sum + item.total_cost, 0);
    
    return { totalQuantity, totalValue };
  };

  const validateForm = () => {
    if (!formData.supplier_name.trim()) {
      toast({
        title: "Validation Error",
        description: "Supplier name is required.",
        variant: "destructive",
      });
      return false;
    }

    if (formData.items.length === 0) {
      toast({
        title: "Validation Error",
        description: "At least one item is required.",
        variant: "destructive",
      });
      return false;
    }

    for (const item of formData.items) {
      if (!item.medication_id || item.quantity <= 0 || item.unit_cost < 0) {
        toast({
          title: "Validation Error",
          description: "All items must have medication, quantity > 0, and unit cost ≥ 0.",
          variant: "destructive",
        });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    
    try {
      let successCount = 0;
      
      // Process each item as a separate stock movement
      for (const item of formData.items) {
        const success = await createStockMovement({
          medication_id: item.medication_id,
          movement_type: 'receipt',
          quantity: item.quantity,
          reason: `Stock receipt from ${formData.supplier_name}`,
          reference_number: formData.reference_number,
          supplier_name: formData.supplier_name,
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          unit_cost: item.unit_cost,
          notes: formData.notes
        });
        
        if (success) successCount++;
      }

      if (successCount === formData.items.length) {
        toast({
          title: "Success",
          description: `Stock receipt processed successfully. ${successCount} items received.`
        });
        
        // Reset form
        setFormData({
          supplier_name: '',
          reference_number: '',
          receipt_date: format(new Date(), 'yyyy-MM-dd'),
          notes: '',
          items: []
        });
      } else {
        toast({
          title: "Partial Success",
          description: `${successCount} of ${formData.items.length} items processed successfully.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error processing stock receipt:', error);
      toast({
        title: "Error",
        description: "Failed to process stock receipt.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const { totalQuantity, totalValue } = calculateTotals();

  return (
    <Card className="w-full max-w-6xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5 text-green-600" />
          Stock Receipt Form
        </CardTitle>
        <CardDescription>
          Record new stock received from suppliers with comprehensive tracking
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Receipt Header */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="supplier">Supplier Name *</Label>
            <Input
              id="supplier"
              value={formData.supplier_name}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
              placeholder="Enter supplier name"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="reference">Reference Number</Label>
            <Input
              id="reference"
              value={formData.reference_number}
              onChange={(e) => setFormData(prev => ({ ...prev, reference_number: e.target.value }))}
              placeholder="PO-2024-001"
            />
          </div>
          
          <div>
            <Label htmlFor="date">Receipt Date</Label>
            <Input
              id="date"
              type="date"
              value={formData.receipt_date}
              onChange={(e) => setFormData(prev => ({ ...prev, receipt_date: e.target.value }))}
            />
          </div>
          
          <div>
            <Label>Total Items</Label>
            <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
              <Badge variant="secondary">
                {formData.items.length} items
              </Badge>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Items Received</h3>
            <Button onClick={addItem} variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>

          {formData.items.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No items added yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Click "Add Item" to start recording your stock receipt
                </p>
                <Button onClick={addItem} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add First Item
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost (RM)</TableHead>
                    <TableHead>Total (RM)</TableHead>
                    <TableHead>Batch No.</TableHead>
                    <TableHead>Expiry Date</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {formData.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <Select 
                          value={item.medication_id} 
                          onValueChange={(value) => updateItem(item.id, { medication_id: value })}
                        >
                          <SelectTrigger className="min-w-[200px]">
                            <SelectValue placeholder="Select medication" />
                          </SelectTrigger>
                          <SelectContent>
                            {medications.map((medication) => (
                              <SelectItem key={medication.id} value={medication.id}>
                                <div className="flex flex-col">
                                   <span>{medication.name}</span>
                                   <span className="text-xs text-muted-foreground">
                                     Stock: {medication.stock_level || 0} | 
                                     {medication.cost_price ? ` List: $${medication.cost_price.toFixed(2)}` : ''} |
                                     {medication.average_cost ? ` Avg: $${medication.average_cost.toFixed(4)}` : ' No avg cost'}
                                   </span>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          min="1"
                          value={item.quantity || ''}
                          onChange={(e) => updateItem(item.id, { quantity: parseInt(e.target.value) || 0 })}
                          placeholder="0"
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          value={item.unit_cost || ''}
                          onChange={(e) => updateItem(item.id, { unit_cost: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {item.total_cost.toFixed(2)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Input
                          value={item.batch_number || ''}
                          onChange={(e) => updateItem(item.id, { batch_number: e.target.value })}
                          placeholder="Batch"
                          className="w-24"
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="date"
                          value={item.expiry_date || ''}
                          onChange={(e) => updateItem(item.id, { expiry_date: e.target.value })}
                          className="w-36"
                        />
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>

        {/* Summary Section */}
        {formData.items.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Receipt Summary
                </h3>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{formData.items.length}</div>
                  <div className="text-sm text-muted-foreground">Total Items</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{totalQuantity}</div>
                  <div className="text-sm text-muted-foreground">Total Quantity</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">RM {totalValue.toFixed(2)}</div>
                  <div className="text-sm text-muted-foreground">Total Value</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Notes */}
        <div>
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
            placeholder="Optional notes about this stock receipt..."
            rows={3}
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => setFormData({
              supplier_name: '',
              reference_number: '',
              receipt_date: format(new Date(), 'yyyy-MM-dd'),
              notes: '',
              items: []
            })}
            disabled={isLoading}
          >
            Clear Form
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isLoading || formData.items.length === 0}
            className="gap-2"
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            Process Receipt
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}