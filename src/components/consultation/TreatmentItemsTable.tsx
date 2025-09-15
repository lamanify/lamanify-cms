import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Pill, Stethoscope } from 'lucide-react';
import { TreatmentItem } from '@/hooks/useConsultation';
import { PriceTier } from '@/hooks/usePriceTiers';

interface TreatmentItemsTableProps {
  items: TreatmentItem[];
  patientTier?: PriceTier;
  onRemoveItem?: (itemId: string) => void;
  showActions?: boolean;
}

export function TreatmentItemsTable({ 
  items, 
  patientTier, 
  onRemoveItem, 
  showActions = true 
}: TreatmentItemsTableProps) {
  const calculateTotalCost = () => {
    return items.reduce((total, item) => total + item.total_amount, 0);
  };

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="text-muted-foreground">
            <Pill className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No medications or services prescribed</p>
            <p className="text-sm">Start by adding medications or services</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Current Treatment Plan</span>
          {patientTier && (
            <Badge variant="outline" className="bg-primary/5">
              {patientTier.tier_name} Pricing
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Qty</TableHead>
                <TableHead>
                  {patientTier ? `${patientTier.tier_name} Rate` : 'Rate'}
                </TableHead>
                <TableHead>Total</TableHead>
                {showActions && <TableHead>Actions</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {item.item_type === 'medication' ? (
                        <Pill className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Stethoscope className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <div className="font-medium">
                          {item.medication?.name || item.service?.name}
                        </div>
                        {item.dosage_instructions && (
                          <div className="text-xs text-muted-foreground">
                            {item.dosage_instructions}
                          </div>
                        )}
                        {item.frequency && (
                          <div className="text-xs text-muted-foreground">
                            {item.frequency}
                            {item.duration_days && ` for ${item.duration_days} days`}
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {item.item_type === 'medication' ? 'Medication' : 'Service'}
                    </Badge>
                  </TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell>
                    <div>
                      <span className="font-medium">
                        RM {item.rate.toFixed(2)}
                      </span>
                      {item.tier_price_applied && item.tier_price_applied !== item.original_price && (
                        <div className="text-xs text-muted-foreground">
                          <span className="line-through">
                            RM {item.original_price?.toFixed(2)}
                          </span>
                          <span className="text-green-600 ml-1">
                            Tier Applied
                          </span>
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="font-medium">
                      RM {item.total_amount.toFixed(2)}
                    </span>
                  </TableCell>
                  {showActions && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onRemoveItem?.(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        
        {/* Summary */}
        <div className="flex justify-between items-center mt-4 pt-4 border-t">
          <div className="text-sm text-muted-foreground">
            {items.length} item{items.length !== 1 ? 's' : ''}
            {patientTier && ` • ${patientTier.tier_name} Tier Pricing`}
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              RM {calculateTotalCost().toFixed(2)}
            </div>
            {patientTier && (
              <div className="text-sm text-muted-foreground">
                Total ({patientTier.tier_name} Tier)
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}