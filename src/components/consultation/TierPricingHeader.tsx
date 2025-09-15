import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { DollarSign, AlertTriangle } from 'lucide-react';
import { PriceTier } from '@/hooks/usePriceTiers';

interface TierPricingHeaderProps {
  patientTier?: PriceTier;
  patientName: string;
  totalAmount: number;
  itemCount: number;
}

export function TierPricingHeader({ 
  patientTier, 
  patientName, 
  totalAmount, 
  itemCount 
}: TierPricingHeaderProps) {
  if (!patientTier) {
    return (
      <Alert className="border-amber-200 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          No pricing tier assigned to {patientName}. Please assign a payment method first in patient settings.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <DollarSign className="h-6 w-6 text-primary" />
            <div>
              <h3 className="text-lg font-semibold">Consultation Billing</h3>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Pricing:</span>
                <Badge variant="outline" className="bg-white">
                  {patientTier.tier_name} Tier
                </Badge>
                <span className="text-xs text-muted-foreground">
                  ({patientTier.payment_method})
                </span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-primary">
              RM {totalAmount.toFixed(2)}
            </div>
            <p className="text-sm text-muted-foreground">
              Total ({patientTier.tier_name} Tier)
            </p>
            <p className="text-xs text-muted-foreground">
              {itemCount} items
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}