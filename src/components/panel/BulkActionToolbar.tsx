import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckSquare, X, Users } from 'lucide-react';
import { PanelClaim } from '@/hooks/usePanelClaims';

interface BulkActionToolbarProps {
  selectedClaims: string[];
  claims: PanelClaim[];
  onClearSelection: () => void;
  onBulkStatusChange: (status: PanelClaim['status']) => void;
}

export function BulkActionToolbar({ 
  selectedClaims, 
  claims,
  onClearSelection, 
  onBulkStatusChange 
}: BulkActionToolbarProps) {
  const [selectedStatus, setSelectedStatus] = useState<PanelClaim['status'] | ''>('');

  if (selectedClaims.length === 0) {
    return null;
  }

  const selectedClaimObjects = claims.filter(claim => selectedClaims.includes(claim.id));
  const totalAmount = selectedClaimObjects.reduce((sum, claim) => sum + claim.total_amount, 0);

  const handleBulkAction = () => {
    if (selectedStatus) {
      onBulkStatusChange(selectedStatus);
      setSelectedStatus('');
    }
  };

  return (
    <Card className="mb-4 border-primary/20 bg-primary/5">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-primary" />
              <span className="font-medium">
                {selectedClaims.length} claim{selectedClaims.length > 1 ? 's' : ''} selected
              </span>
              <Badge variant="secondary">
                Total: ${totalAmount.toFixed(2)}
              </Badge>
            </div>
            
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {new Set(selectedClaimObjects.map(c => c.panel_id)).size} panel{new Set(selectedClaimObjects.map(c => c.panel_id)).size > 1 ? 's' : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as PanelClaim['status'])}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Change status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted">Submit</SelectItem>
                <SelectItem value="approved">Approve</SelectItem>
                <SelectItem value="rejected">Reject</SelectItem>
                <SelectItem value="paid">Mark Paid</SelectItem>
              </SelectContent>
            </Select>
            
            <Button 
              onClick={handleBulkAction}
              disabled={!selectedStatus}
              size="sm"
            >
              Apply to {selectedClaims.length}
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={onClearSelection}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}