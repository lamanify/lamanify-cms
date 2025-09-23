import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { MessageCircle, Send, Eye } from 'lucide-react';
import { useWhatsAppTemplates, type PatientVariables } from '@/hooks/useWhatsAppTemplates';
import type { Patient } from '@/pages/Patients';

interface WhatsAppTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

export function WhatsAppTemplateModal({ isOpen, onClose, patient }: WhatsAppTemplateModalProps) {
  const { templates, loading, processTemplate, generateWhatsAppLink } = useWhatsAppTemplates();
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [editableMessage, setEditableMessage] = useState<string>('');
  const [customVariables, setCustomVariables] = useState<{
    date: string;
    time: string;
    clinic_name: string;
    report_type: string;
    service_name: string;
    custom_message: string;
  }>({
    date: new Date().toLocaleDateString(),
    time: '',
    clinic_name: 'Our Clinic',
    report_type: '',
    service_name: '',
    custom_message: ''
  });

  const selectedTemplate = templates.find(t => t.id === selectedTemplateId);

  // Generate patient variables object
  const patientVariables: PatientVariables = {
    name: `${patient.first_name} ${patient.last_name}`.trim(),
    first_name: patient.first_name,
    phone: patient.phone || '',
    email: patient.email || '',
    ...customVariables
  };

  // Update message when template or variables change
  useEffect(() => {
    if (selectedTemplate) {
      const processedMessage = processTemplate(selectedTemplate, patientVariables);
      setEditableMessage(processedMessage);
    }
  }, [selectedTemplate, patientVariables, processTemplate]);

  const handleSendWhatsApp = () => {
    if (!editableMessage.trim() || !patient.phone) return;

    const whatsappUrl = generateWhatsAppLink(patient.phone, editableMessage);
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
    onClose();
  };

  const handleTemplateChange = (templateId: string) => {
    setSelectedTemplateId(templateId);
  };

  const resetModal = () => {
    setSelectedTemplateId('');
    setEditableMessage('');
    setCustomVariables({
      date: new Date().toLocaleDateString(),
      time: '',
      clinic_name: 'Our Clinic',
      report_type: '',
      service_name: '',
      custom_message: ''
    });
  };

  useEffect(() => {
    if (!isOpen) {
      resetModal();
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            WhatsApp Message to {patient.first_name} {patient.last_name}
          </DialogTitle>
          <DialogDescription>
            Select a template and customize your message before sending via WhatsApp.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-2">
            <Label htmlFor="template">Select Template</Label>
            <Select value={selectedTemplateId} onValueChange={handleTemplateChange} disabled={loading}>
              <SelectTrigger>
                <SelectValue placeholder={loading ? "Loading templates..." : "Choose a template"} />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.template_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dynamic Variables (only show if template has variables) */}
          {selectedTemplate && selectedTemplate.variables && selectedTemplate.variables.length > 0 && (
            <div className="space-y-4">
              <Label className="text-sm font-medium">Customize Template Variables</Label>
              <div className="grid grid-cols-2 gap-4">
                {selectedTemplate.variables.includes('date') && (
                  <div>
                    <Label htmlFor="date" className="text-xs">Date</Label>
                    <Input
                      id="date"
                      type="date"
                      value={customVariables.date}
                      onChange={(e) => setCustomVariables(prev => ({ ...prev, date: e.target.value }))}
                    />
                  </div>
                )}
                {selectedTemplate.variables.includes('time') && (
                  <div>
                    <Label htmlFor="time" className="text-xs">Time</Label>
                    <Input
                      id="time"
                      type="time"
                      value={customVariables.time}
                      onChange={(e) => setCustomVariables(prev => ({ ...prev, time: e.target.value }))}
                    />
                  </div>
                )}
                {selectedTemplate.variables.includes('clinic_name') && (
                  <div>
                    <Label htmlFor="clinic_name" className="text-xs">Clinic Name</Label>
                    <Input
                      id="clinic_name"
                      value={customVariables.clinic_name}
                      onChange={(e) => setCustomVariables(prev => ({ ...prev, clinic_name: e.target.value }))}
                    />
                  </div>
                )}
                {selectedTemplate.variables.includes('report_type') && (
                  <div>
                    <Label htmlFor="report_type" className="text-xs">Report Type</Label>
                    <Input
                      id="report_type"
                      placeholder="e.g., Blood test, X-ray"
                      value={customVariables.report_type}
                      onChange={(e) => setCustomVariables(prev => ({ ...prev, report_type: e.target.value }))}
                    />
                  </div>
                )}
                {selectedTemplate.variables.includes('service_name') && (
                  <div>
                    <Label htmlFor="service_name" className="text-xs">Service Name</Label>
                    <Input
                      id="service_name"
                      placeholder="e.g., Health Checkup, Consultation"
                      value={customVariables.service_name}
                      onChange={(e) => setCustomVariables(prev => ({ ...prev, service_name: e.target.value }))}
                    />
                  </div>
                )}
                {selectedTemplate.variables.includes('custom_message') && (
                  <div className="col-span-2">
                    <Label htmlFor="custom_message" className="text-xs">Custom Message</Label>
                    <Input
                      id="custom_message"
                      placeholder="Enter your custom message"
                      value={customVariables.custom_message}
                      onChange={(e) => setCustomVariables(prev => ({ ...prev, custom_message: e.target.value }))}
                    />
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message Preview & Edit */}
          {selectedTemplate && (
            <div className="space-y-2">
              <Label htmlFor="message" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Message Preview & Edit
              </Label>
              <Textarea
                id="message"
                value={editableMessage}
                onChange={(e) => setEditableMessage(e.target.value)}
                placeholder="Your message will appear here..."
                rows={6}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                You can edit the message above before sending.
              </p>
            </div>
          )}
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