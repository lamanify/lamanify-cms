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
    <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground">
      <CardHeader className="text-center">
        <div className="flex items-center justify-center gap-2 mb-2">
          <CardTitle className="text-2xl font-bold">Now Serving</CardTitle>
          {isServing && (
            <Badge variant="secondary" className="animate-pulse">
              SERVING
            </Badge>
          )}
        </div>
        {currentPatient && (
          <div className="text-5xl font-bold mt-4 mb-2">
            {currentPatient.firstName} {currentPatient.lastName}
          </div>
        )}
        <div className="text-3xl font-bold mb-2">
          Queue: {currentNumber || '---'}
        </div>
        {currentPatient?.patientId && (
          <div className="text-sm text-primary-foreground/70 font-mono bg-primary-foreground/10 px-3 py-1 rounded-full inline-block">
            ID: {currentPatient.patientId}
          </div>
        )}
        {!currentNumber && (
          <div className="text-lg mt-2 opacity-75">
            No patient currently being served
          </div>
        )}
      </CardHeader>
    </Card>
  );
}