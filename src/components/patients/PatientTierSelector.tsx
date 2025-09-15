import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Settings, CreditCard } from 'lucide-react';
import { usePriceTiers } from '@/hooks/usePriceTiers';
import { useTierPricing } from '@/hooks/useTierPricing';

interface PatientTierSelectorProps {
  patientId: string;
  currentTierId?: string;
  patientName: string;
  onTierAssigned?: () => void;
}

export function PatientTierSelector({ 
  patientId, 
  currentTierId, 
  patientName, 
  onTierAssigned 
}: PatientTierSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(currentTierId || '');
  const { priceTiers } = usePriceTiers();
  const { assignPatientTier } = useTierPricing();

  const currentTier = priceTiers.find(tier => tier.id === currentTierId);

  const handleAssignTier = async () => {
    if (!selectedTierId) return;
    
    const success = await assignPatientTier(patientId, selectedTierId);
    if (success) {
      setIsOpen(false);
      onTierAssigned?.();
    }
  };

  return (
    <div className="flex items-center gap-2">
      {currentTier ? (
        <Badge variant="outline" className="bg-primary/5">
          <CreditCard className="h-3 w-3 mr-1" />
          {currentTier.tier_name}
        </Badge>
      ) : (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          No Tier Assigned
        </Badge>
      )}
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-1">
            <Settings className="h-3 w-3" />
            {currentTier ? 'Change' : 'Assign'}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Price Tier - {patientName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="tier-select">Select Price Tier</Label>
              <Select value={selectedTierId} onValueChange={setSelectedTierId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a price tier" />
                </SelectTrigger>
                <SelectContent>
                  {priceTiers.map((tier) => (
                    <SelectItem key={tier.id} value={tier.id}>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{tier.tier_name}</span>
                        <Badge variant="outline" className="text-xs">
                          {tier.payment_method}
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {priceTiers.length === 0 && (
                <p className="text-sm text-muted-foreground mt-2">
                  Create price tiers first in Settings → Price Tier Management
                </p>
              )}
            </div>
            
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleAssignTier}
                disabled={!selectedTierId || priceTiers.length === 0}
              >
                Assign Tier
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}