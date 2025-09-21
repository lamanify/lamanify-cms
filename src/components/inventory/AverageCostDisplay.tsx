import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface AverageCostDisplayProps {
  medication: {
    id: string;
    name: string;
    average_cost?: number;
    cost_price?: number;
    stock_level?: number;
  };
  showComparison?: boolean;
}

export function AverageCostDisplay({ medication, showComparison = true }: AverageCostDisplayProps) {
  const averageCost = medication.average_cost || 0;
  const costPrice = medication.cost_price || 0;
  const stockLevel = medication.stock_level || 0;
  const totalValue = averageCost * stockLevel;

  const getCostVariance = () => {
    if (!showComparison || costPrice === 0) return null;
    
    const variance = ((averageCost - costPrice) / costPrice) * 100;
    const isPositive = variance > 0;
    const isNeutral = Math.abs(variance) < 1;

    return {
      percentage: Math.abs(variance),
      isPositive,
      isNeutral,
      icon: isNeutral ? Minus : isPositive ? TrendingUp : TrendingDown,
      color: isNeutral ? 'text-muted-foreground' : isPositive ? 'text-red-500' : 'text-green-500'
    };
  };

  const variance = getCostVariance();

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <span>Average Cost Analysis</span>
          {variance && (
            <Badge variant={variance.isPositive ? 'destructive' : variance.isNeutral ? 'secondary' : 'default'}>
              <variance.icon className="h-3 w-3 mr-1" />
              {variance.percentage.toFixed(1)}%
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm text-muted-foreground">Moving Average</p>
            <p className="text-2xl font-bold text-primary">
              ${averageCost.toFixed(4)}
            </p>
          </div>
          
          {showComparison && (
            <div>
              <p className="text-sm text-muted-foreground">List Price</p>
              <p className="text-2xl font-bold">
                ${costPrice.toFixed(2)}
              </p>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Current Stock:</span>
            <span className="font-medium">{stockLevel} units</span>
          </div>
          
          <div className="flex justify-between">
            <span className="text-sm text-muted-foreground">Total Value:</span>
            <span className="font-medium">${totalValue.toFixed(2)}</span>
          </div>

          {variance && (
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Cost Variance:</span>
              <span className={`font-medium ${variance.color}`}>
                {variance.isPositive ? '+' : variance.isNeutral ? '±' : '-'}
                ${Math.abs(averageCost - costPrice).toFixed(4)}
              </span>
            </div>
          )}
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs text-muted-foreground">
            Average cost is calculated using weighted moving average method based on purchase history.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}