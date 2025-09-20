import { Button } from '@/components/ui/button';
import { LayoutGrid, List } from 'lucide-react';

interface PatientViewToggleProps {
  viewMode: 'card' | 'table';
  onViewModeChange: (mode: 'card' | 'table') => void;
}

export function PatientViewToggle({ viewMode, onViewModeChange }: PatientViewToggleProps) {
  return (
    <div className="flex items-center border rounded-lg p-1">
      <Button
        variant={viewMode === 'card' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('card')}
        className="h-8 px-3"
      >
        <LayoutGrid className="h-4 w-4 mr-1" />
        Cards
      </Button>
      <Button
        variant={viewMode === 'table' ? 'default' : 'ghost'}
        size="sm"
        onClick={() => onViewModeChange('table')}
        className="h-8 px-3"
      >
        <List className="h-4 w-4 mr-1" />
        List
      </Button>
    </div>
  );
}