import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TrendingUp, DollarSign, Wallet, Info } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';
import { PanelClaim } from '@/hooks/usePanelClaims';
import { format } from 'date-fns';

interface PanelClaimsFooterSummaryProps {
  claims: PanelClaim[];
}

export function PanelClaimsFooterSummary({ claims }: PanelClaimsFooterSummaryProps) {
  const { formatCurrency } = useCurrency();
  
  // Total claims value
  const totalClaimsValue = claims.reduce((sum, claim) => sum + claim.total_amount, 0);
  
  // Estimated panel A/R (sum of panel_amount where status ≠ paid)
  const estimatedPanelAR = claims
    .filter(claim => claim.status !== 'paid')
    .reduce((sum, claim) => sum + claim.panel_amount, 0);
  
  // Co-pay collected today (sum of patient_amount where payment date = today)
  const today = format(new Date(), 'yyyy-MM-dd');
  const coPayCollectedToday = claims
    .filter(claim => claim.paid_at && format(new Date(claim.paid_at), 'yyyy-MM-dd') === today)
    .reduce((sum, claim) => sum + claim.patient_amount, 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
      <TooltipProvider>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Total Claims Value
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Sum of all claim amounts in the current filtered view</p>
                    </TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold">{formatCurrency(totalClaimsValue)}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Estimated Panel A/R
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Sum of panel amounts (90% of total) for all unpaid claims. This represents the accounts receivable from panels.</p>
                    </TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold text-orange-600">{formatCurrency(estimatedPanelAR)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-orange-600 opacity-20" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground flex items-center gap-1">
                  Co-pay Collected Today
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="h-3 w-3 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p className="max-w-xs">Sum of patient co-pay amounts (10% of total) for all claims paid today</p>
                    </TooltipContent>
                  </Tooltip>
                </p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(coPayCollectedToday)}</p>
              </div>
              <Wallet className="h-8 w-8 text-green-600 opacity-20" />
            </div>
          </CardContent>
        </Card>
      </TooltipProvider>
    </div>
  );
}
