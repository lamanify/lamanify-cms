import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface CurrentQueueDisplayProps {
  currentNumber: string | null;
  currentPatient: {
    firstName: string;
    lastName: string;
    patientId?: string;
  } | null;
  isServing: boolean;
}

export function CurrentQueueDisplay({ currentNumber, currentPatient, isServing }: CurrentQueueDisplayProps) {
  return (
    <div className="bg-primary text-primary-foreground border border-primary">
      <div className="text-center p-8">
        <div className="flex items-center justify-center gap-3 mb-6">
          <h2 className="text-xl font-medium">Now Serving</h2>
          {isServing && (
            <span className="px-2 py-1 bg-primary-foreground/20 text-xs">
              SERVING
            </span>
          )}
        </div>
        {currentPatient && (
          <div className="text-3xl font-medium mb-4">
            {currentPatient.firstName} {currentPatient.lastName}
          </div>
        )}
        <div className="text-2xl font-medium mb-4">
          Queue: {currentNumber || '---'}
        </div>
        {currentPatient?.patientId && (
          <div className="text-sm text-primary-foreground/80 font-mono bg-primary-foreground/10 px-3 py-1 inline-block">
            ID: {currentPatient.patientId}
          </div>
        )}
        {!currentNumber && (
          <div className="text-base mt-2 text-primary-foreground/80">
            No patient currently being served
          </div>
        )}
      </div>
    </div>
  );
}