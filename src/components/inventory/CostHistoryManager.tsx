import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useCostHistory } from '@/hooks/useCostHistory';
import { Edit, TrendingUp, History } from 'lucide-react';
import { format } from 'date-fns';

interface CostHistoryManagerProps {
  medicationId?: string;
  medicationName?: string;
}

export function CostHistoryManager({ medicationId, medicationName }: CostHistoryManagerProps) {
  const { costHistory, loading, updateHistoricalCost, fetchCostHistory } = useCostHistory();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingCost, setEditingCost] = useState<string>('');

  const handleEdit = (id: string, currentCost: number) => {
    setEditingId(id);
    setEditingCost(currentCost.toString());
  };

  const handleSave = async () => {
    if (!editingId) return;
    
    const newCost = parseFloat(editingCost);
    if (isNaN(newCost) || newCost < 0) return;

    const success = await updateHistoricalCost(editingId, newCost);
    if (success) {
      setEditingId(null);
      setEditingCost('');
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditingCost('');
  };

  const getMovementTypeBadge = (type: string) => {
    const variants = {
      receipt: 'default',
      purchase: 'default',
      adjustment: 'secondary'
    } as const;
    
    return (
      <Badge variant={variants[type as keyof typeof variants] || 'outline'}>
        {type.replace('_', ' ').toUpperCase()}
      </Badge>
    );
  };

  const filteredHistory = medicationId 
    ? costHistory.filter(entry => entry.medication_id === medicationId)
    : costHistory;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <History className="h-4 w-4 mr-2" />
          Cost History
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Cost History {medicationName && `- ${medicationName}`}
          </DialogTitle>
        </DialogHeader>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Cost Movement History</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8">Loading cost history...</div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No cost history available
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Medication</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Qty</TableHead>
                      <TableHead>Unit Cost</TableHead>
                      <TableHead>Total Cost</TableHead>
                      <TableHead>Avg Before</TableHead>
                      <TableHead>Avg After</TableHead>
                      <TableHead>Stock</TableHead>
                      <TableHead>Created By</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredHistory.map((entry) => (
                      <TableRow key={entry.id}>
                        <TableCell>
                          {format(new Date(entry.created_at), 'MMM dd, yyyy HH:mm')}
                        </TableCell>
                        <TableCell className="font-medium">
                          {entry.medication_name}
                        </TableCell>
                        <TableCell>
                          {getMovementTypeBadge(entry.movement_type)}
                        </TableCell>
                        <TableCell>{entry.quantity}</TableCell>
                        <TableCell>
                          {editingId === entry.id ? (
                            <div className="flex items-center gap-2">
                              <Input
                                type="number"
                                value={editingCost}
                                onChange={(e) => setEditingCost(e.target.value)}
                                className="w-20"
                                step="0.01"
                                min="0"
                              />
                              <Button size="sm" onClick={handleSave}>
                                Save
                              </Button>
                              <Button size="sm" variant="outline" onClick={handleCancel}>
                                Cancel
                              </Button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              ${entry.unit_cost?.toFixed(2) || '0.00'}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(entry.id, entry.unit_cost || 0)}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          ${entry.total_cost?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          ${entry.cost_per_unit_before?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell className="font-medium">
                          ${entry.cost_per_unit_after?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          {entry.previous_stock} → {entry.new_stock}
                        </TableCell>
                        <TableCell>{entry.created_by_name || 'Unknown'}</TableCell>
                        <TableCell>
                          {entry.batch_number && (
                            <div className="text-xs text-muted-foreground">
                              Batch: {entry.batch_number}
                            </div>
                          )}
                          {entry.expiry_date && (
                            <div className="text-xs text-muted-foreground">
                              Exp: {format(new Date(entry.expiry_date), 'MMM yyyy')}
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}