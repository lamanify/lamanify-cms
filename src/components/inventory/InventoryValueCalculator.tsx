import { useMedications } from '@/hooks/useMedications';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calculator, TrendingUp, Package } from 'lucide-react';

export function InventoryValueCalculator() {
  const { medications } = useMedications();

  const calculateInventoryValue = () => {
    const totalItemsWithStock = medications.filter(med => (med.stock_level || 0) > 0);
    
    const valueUsingCostPrice = medications.reduce((sum, med) => {
      const stock = med.stock_level || 0;
      const costPrice = med.cost_price || 0;
      return sum + (stock * costPrice);
    }, 0);

    const valueUsingAverageCost = medications.reduce((sum, med) => {
      const stock = med.stock_level || 0;
      const avgCost = med.average_cost || 0;
      return sum + (stock * avgCost);
    }, 0);

    const variance = valueUsingAverageCost - valueUsingCostPrice;
    const variancePercent = valueUsingCostPrice > 0 ? (variance / valueUsingCostPrice) * 100 : 0;

    return {
      totalItems: medications.length,
      itemsWithStock: totalItemsWithStock.length,
      valueUsingCostPrice,
      valueUsingAverageCost,
      variance,
      variancePercent
    };
  };

  const {
    totalItems,
    itemsWithStock,
    valueUsingCostPrice,
    valueUsingAverageCost,
    variance,
    variancePercent
  } = calculateInventoryValue();

  const getVarianceBadge = () => {
    const isPositive = variance > 0;
    const isSignificant = Math.abs(variancePercent) > 5;
    
    if (!isSignificant) {
      return <Badge variant="secondary">Minimal</Badge>;
    }
    
    return (
      <Badge variant={isPositive ? "destructive" : "default"}>
        {isPositive ? '+' : ''}{variancePercent.toFixed(1)}%
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Inventory Valuation
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Total Items</span>
            </div>
            <div className="text-2xl font-bold">{totalItems}</div>
            <div className="text-xs text-muted-foreground">
              {itemsWithStock} with stock
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Variance</span>
            </div>
            <div className="text-2xl font-bold">
              {getVarianceBadge()}
            </div>
            <div className="text-xs text-muted-foreground">
              ${Math.abs(variance).toFixed(2)}
            </div>
          </div>
        </div>

        {/* Valuation Comparison */}
        <div className="space-y-4">
          <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
            <div>
              <div className="text-sm font-medium">Using List Prices</div>
              <div className="text-xs text-muted-foreground">
                Based on cost_price field
              </div>
            </div>
            <div className="text-lg font-bold">
              ${valueUsingCostPrice.toFixed(2)}
            </div>
          </div>

          <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg border border-primary/20">
            <div>
              <div className="text-sm font-medium text-primary">Using Average Costs</div>
              <div className="text-xs text-muted-foreground">
                Based on moving average calculation
              </div>
            </div>
            <div className="text-lg font-bold text-primary">
              ${valueUsingAverageCost.toFixed(2)}
            </div>
          </div>
        </div>

        {/* Explanation */}
        <div className="text-xs text-muted-foreground p-3 bg-muted/30 rounded-lg">
          <p className="mb-2">
            <strong>Moving Average Cost:</strong> Calculated automatically when stock is received, 
            providing more accurate inventory valuation based on actual purchase prices.
          </p>
          <p>
            A significant variance may indicate pricing inconsistencies or the need to update list prices.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}