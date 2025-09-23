import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { MessageCircle, Send, Edit } from 'lucide-react';
import { useWhatsAppTemplates } from '@/hooks/useWhatsAppTemplates';
import type { Patient } from '@/pages/Patients';

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

export function WhatsAppTemplateModal({ isOpen, onClose, patient }: WhatsAppTemplateModalProps) {
  const { generateWhatsAppLink } = useWhatsAppTemplates();
  const [editableMessage, setEditableMessage] = useState<string>('');

  const defaultMessage = `Hi ${patient.first_name || patient.last_name || 'there'}! `;

  // Set default message when modal opens
  useEffect(() => {
    if (isOpen) {
      setEditableMessage(defaultMessage);
    }
  }, [isOpen, defaultMessage]);

  const handleSendWhatsApp = () => {
    if (!editableMessage.trim() || !patient.phone) return;

    const whatsappUrl = generateWhatsAppLink(patient.phone, editableMessage);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const resetModal = () => {
    setEditableMessage('');
  };

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp Message to {patient.first_name} {patient.last_name}
          </DialogTitle>
          <DialogDescription>
            Customize your message before sending via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Message Edit */}
          <div className="space-y-2">
            <Label htmlFor="message" className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              Your Message
            </Label>
            <Textarea
              id="message"
              value={editableMessage}
              onChange={(e) => setEditableMessage(e.target.value)}
              placeholder="Type your message here..."
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Customize your message above before sending.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handleSendWhatsApp}
            disabled={!editableMessage.trim() || !patient.phone}
            className="flex items-center gap-2"
          >
            <Send className="h-4 w-4" />
            Send via WhatsApp
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}