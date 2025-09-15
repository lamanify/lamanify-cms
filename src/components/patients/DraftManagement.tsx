import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePatientDrafts } from '@/hooks/usePatientDrafts';
import { PatientRegistrationModal } from './PatientRegistrationModal';
import { 
  FileText, 
  Calendar, 
  User, 
  Trash2, 
  Edit, 
  Clock,
  AlertCircle 
} from 'lucide-react';

interface DraftManagementProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientRegistered: () => void;
}

export function DraftManagement({ 
  isOpen, 
  onClose, 
  onPatientRegistered 
}: DraftManagementProps) {
  const { drafts, loading, deleteDraft } = usePatientDrafts();
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [isRegistrationModalOpen, setIsRegistrationModalOpen] = useState(false);

  const handleResumeDraft = (draftId: string) => {
    setSelectedDraftId(draftId);
    setIsRegistrationModalOpen(true);
  };

  const handleRegistrationClose = () => {
    setIsRegistrationModalOpen(false);
    setSelectedDraftId(null);
  };

  const handlePatientRegistered = () => {
    // Delete the draft after successful registration
    if (selectedDraftId) {
      deleteDraft(selectedDraftId);
    }
    onPatientRegistered();
    handleRegistrationClose();
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    return `${diffInDays} days ago`;
  };

  const getPatientDisplayName = (draftData: any) => {
    if (draftData.name && draftData.name.trim()) {
      return draftData.name;
    }
    return 'Unnamed Patient';
  };

  const getDraftProgress = (draftData: any) => {
    const requiredFields = [
      'name', 'nric_passport', 'phone', 'dateOfBirth', 
      'gender', 'addressLine1', 'city', 'state'
    ];
    const filledFields = requiredFields.filter(field => 
      draftData[field] && draftData[field].toString().trim()
    );
    return Math.round((filledFields.length / requiredFields.length) * 100);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Draft Management
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : drafts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-semibold text-muted-foreground">
                    No drafts found
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Your saved patient registration drafts will appear here
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3 max-h-[50vh] overflow-y-auto">
                {drafts.map((draft) => {
                  const progress = getDraftProgress(draft.draft_data);
                  const patientName = getPatientDisplayName(draft.draft_data);
                  
                  return (
                    <Card key={draft.id} className="hover:shadow-md transition-shadow">
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-muted-foreground" />
                              <span className="font-semibold">{patientName}</span>
                              <Badge variant="outline" className="text-xs">
                                {progress}% Complete
                              </Badge>
                            </div>
                            
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Created: {formatTimeAgo(draft.created_at)}
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                Modified: {formatTimeAgo(draft.updated_at)}
                              </div>
                            </div>

                            {draft.draft_data.phone && (
                              <div className="text-sm text-muted-foreground">
                                Phone: {draft.draft_data.countryCode} {draft.draft_data.phone}
                              </div>
                            )}

                            {draft.draft_data.nric_passport && (
                              <div className="text-sm text-muted-foreground">
                                ID: {draft.draft_data.nric_passport}
                              </div>
                            )}
                          </div>

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleResumeDraft(draft.id)}
                              className="bg-[#e9204f] hover:bg-[#d11d45] text-white"
                            >
                              <Edit className="h-4 w-4 mr-1" />
                              Resume
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => deleteDraft(draft.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>

                        {progress < 50 && (
                          <div className="flex items-center gap-2 text-amber-600 text-sm mt-2">
                            <AlertCircle className="h-4 w-4" />
                            <span>Incomplete - missing required fields</span>
                          </div>
                        )}
                      </CardHeader>
                    </Card>
                  );
                })}
              </div>
            )}

            <div className="flex justify-end">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <PatientRegistrationModal
        isOpen={isRegistrationModalOpen}
        onClose={handleRegistrationClose}
        onPatientRegistered={handlePatientRegistered}
        draftId={selectedDraftId}
      />
    </>
  );
}