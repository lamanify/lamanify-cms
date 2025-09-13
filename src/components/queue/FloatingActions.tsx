import { Button } from '@/components/ui/button';
import { RefreshCw, Printer, Settings } from 'lucide-react';

interface FloatingActionsProps {
  onRefresh: () => void;
  onPrintSummary: () => void;
  onOpenSettings: () => void;
  isRefreshing: boolean;
}

export function FloatingActions({ onRefresh, onPrintSummary, onOpenSettings, isRefreshing }: FloatingActionsProps) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-3 z-50">
      <Button
        size="icon"
        variant="secondary"
        className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        onClick={onRefresh}
        disabled={isRefreshing}
      >
        <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
      </Button>
      
      <Button
        size="icon"
        variant="secondary"
        className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        onClick={onPrintSummary}
      >
        <Printer className="h-5 w-5" />
      </Button>
      
      <Button
        size="icon"
        variant="secondary"
        className="w-12 h-12 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        onClick={onOpenSettings}
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );
}