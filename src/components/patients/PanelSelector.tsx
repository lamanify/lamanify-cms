import { useState, useEffect } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { usePanels } from '@/hooks/usePanels';
import { useTierPricing } from '@/hooks/useTierPricing';
import { ExternalLink, AlertCircle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface PanelSelectorProps {
  selectedPanelId?: string;
  onPanelSelect: (panelId: string | null, tierIds: string[]) => void;
  onTierAssigned?: (tierId: string) => void;
  disabled?: boolean;
  showLabel?: boolean;
}

export function PanelSelector({ 
  selectedPanelId, 
  onPanelSelect, 
  onTierAssigned,
  disabled = false,
  showLabel = true 
}: PanelSelectorProps) {
  const { panels, loading } = usePanels();
  const { assignPatientTier } = useTierPricing();
  const { toast } = useToast();
  const [selectedPanel, setSelectedPanel] = useState(selectedPanelId || '');

  const activePanels = panels.filter(panel => panel.default_status === 'active');
  const currentPanel = activePanels.find(panel => panel.id === selectedPanel);

  useEffect(() => {
    if (selectedPanelId) {
      setSelectedPanel(selectedPanelId);
    }
  }, [selectedPanelId]);

  const handlePanelChange = (panelId: string) => {
    if (panelId === 'none') {
      setSelectedPanel('');
      onPanelSelect(null, []);
      return;
    }

    const panel = activePanels.find(p => p.id === panelId);
    if (panel) {
      setSelectedPanel(panelId);
      const tierIds = panel.price_tiers?.map(tier => tier.id) || [];
      onPanelSelect(panelId, tierIds);

      // Auto-assign first tier if available
      if (tierIds.length > 0 && onTierAssigned) {
        onTierAssigned(tierIds[0]);
      }
    }
  };

  const handleVerificationClick = (url: string) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="space-y-2">
        {showLabel && <Label>Panel Company</Label>}
        <Select disabled>
          <SelectTrigger>
            <SelectValue placeholder="Loading panels..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {showLabel && <Label>Panel Company</Label>}
      
      <Select value={selectedPanel} onValueChange={handlePanelChange} disabled={disabled}>
        <SelectTrigger>
          <SelectValue placeholder="Select panel company..." />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No Panel</SelectItem>
          {activePanels.map((panel) => (
            <SelectItem key={panel.id} value={panel.id}>
              <div className="flex items-center justify-between w-full">
                <span>{panel.panel_name}</span>
                <Badge variant="outline" className="ml-2">
                  {panel.panel_code}
                </Badge>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {currentPanel && (
        <Card className="border-muted">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">Panel Information</h4>
              <Badge variant={currentPanel.default_status === 'active' ? 'default' : 'secondary'}>
                {currentPanel.default_status}
              </Badge>
            </div>

            {currentPanel.person_in_charge_name && (
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Person in Charge</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{currentPanel.person_in_charge_name}</span>
                  {currentPanel.person_in_charge_phone && (
                    <Badge variant="outline" className="text-xs">
                      {currentPanel.person_in_charge_phone}
                    </Badge>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Verification Method</Label>
              <div className="flex items-center gap-2">
                {currentPanel.verification_method === 'url' ? (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">URL Verification</span>
                    {currentPanel.verification_url && (
                      <button
                        onClick={() => handleVerificationClick(currentPanel.verification_url!)}
                        className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Verify
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-500" />
                    <span className="text-sm">Manual Verification</span>
                  </div>
                )}
              </div>
              
              {currentPanel.manual_remarks && (
                <div className="p-2 bg-muted rounded-md">
                  <p className="text-xs text-muted-foreground mb-1">Remarks:</p>
                  <p className="text-sm">{currentPanel.manual_remarks}</p>
                </div>
              )}
            </div>

            {currentPanel.price_tiers && currentPanel.price_tiers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Available Price Tiers</Label>
                <div className="flex flex-wrap gap-1">
                  {currentPanel.price_tiers.map((tier) => (
                    <Badge key={tier.id} variant="secondary" className="text-xs">
                      {tier.tier_name}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}