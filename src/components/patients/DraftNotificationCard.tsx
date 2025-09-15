import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePatientDrafts } from '@/hooks/usePatientDrafts';
import { DraftManagement } from './DraftManagement';
import { FileText, AlertCircle } from 'lucide-react';

interface DraftNotificationCardProps {
  onPatientRegistered: () => void;
}

export function DraftNotificationCard({ onPatientRegistered }: DraftNotificationCardProps) {
  const { drafts } = usePatientDrafts();
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);

  if (drafts.length === 0) return null;

  return (
    <>
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-5 w-5 text-amber-600" />
                <div>
                  <h3 className="font-semibold text-amber-800 dark:text-amber-200">
                    Pending Drafts
                  </h3>
                  <p className="text-sm text-amber-700 dark:text-amber-300">
                    You have {drafts.length} incomplete patient registration{drafts.length > 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <Badge variant="secondary" className="bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200">
                {drafts.length}
              </Badge>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDraftModalOpen(true)}
              className="border-amber-300 hover:bg-amber-100 dark:border-amber-700 dark:hover:bg-amber-900/50"
            >
              <FileText className="h-4 w-4 mr-2" />
              View Drafts
            </Button>
          </div>
        </CardContent>
      </Card>

      <DraftManagement
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        onPatientRegistered={onPatientRegistered}
      />
    </>
  );
}