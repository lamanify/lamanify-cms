import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  ArrowLeft, 
  Save, 
  Eye,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Undo,
  Redo
} from 'lucide-react';
import { useDocumentTemplates, DocumentTemplate } from '@/hooks/useDocumentTemplates';
import { useHeaderSettings } from '@/hooks/useHeaderSettings';

interface TemplateEditorProps {
  template?: DocumentTemplate | null;
  onClose: () => void;
}

const templateTypes = [
  'Medical certificate',
  'Medical document',
  'Prescription letter',
  'Medical records',
  'Billings'
];

const smartFields = [
  { key: 'patient_name', label: 'Patient name' },
  { key: 'doctor_name', label: 'Doctor name' },
  { key: 'visit_date', label: 'Visit date' },
  { key: 'identification', label: 'Identification (IC/Passport)' },
  { key: 'age', label: 'Age' },
  { key: 'time_in', label: 'Time in' },
  { key: 'diagnosis', label: 'Diagnosis' },
  { key: 'gender', label: 'Gender' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'visit_time', label: 'Visit time' },
  { key: 'mc_number', label: 'MC Number' },
  { key: 'mc_days', label: 'MC Days' }
];

export function TemplateEditor({ template, onClose }: TemplateEditorProps) {
  const { createTemplate, updateTemplate } = useDocumentTemplates();
  const { headerSettings } = useHeaderSettings();
  const [formData, setFormData] = useState({
    template_name: '',
    template_type: 'Medical certificate',
    description: '',
    content: '',
    price_from: 0,
    price_to: 0,
    status: 'active'
  });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (template) {
      setFormData({
        template_name: template.template_name,
        template_type: template.template_type,
        description: template.description || '',
        content: template.content,
        price_from: template.price_from || 0,
        price_to: template.price_to || 0,
        status: template.status
      });
    }
  }, [template]);

  const handleSave = async () => {
    if (!formData.template_name.trim() || !formData.content.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    const success = template 
      ? await updateTemplate(template.id, formData)
      : await createTemplate(formData);

    if (success) {
      onClose();
    }
  };

  const insertSmartField = (field: string) => {
    const textArea = document.getElementById('content-editor') as HTMLTextAreaElement;
    if (textArea) {
      const start = textArea.selectionStart;
      const end = textArea.selectionEnd;
      const text = textArea.value;
      const before = text.substring(0, start);
      const after = text.substring(end, text.length);
      const newText = before + `{{${field}}}` + after;
      
      setFormData(prev => ({ ...prev, content: newText }));
      
      // Reset cursor position
      setTimeout(() => {
        textArea.focus();
        textArea.setSelectionRange(start + field.length + 4, start + field.length + 4);
      }, 0);
    }
  };

  const renderPreview = () => {
    let previewContent = formData.content;
    
    // Replace smart fields with sample data
    const sampleData: Record<string, string> = {
      patient_name: 'John Doe',
      doctor_name: 'Dr. Smith',
      visit_date: new Date().toLocaleDateString(),
      identification: 'A123456789',
      age: '35',
      time_in: '09:30 AM',
      diagnosis: 'Upper respiratory tract infection',
      gender: 'Male',
      phone: '+60 12-345 6789',
      address: '123 Main Street, Kuala Lumpur',
      visit_time: '09:30 AM',
      mc_number: 'MC001',
      mc_days: '3'
    };

    Object.entries(sampleData).forEach(([key, value]) => {
      previewContent = previewContent.replace(new RegExp(`{{${key}}}`, 'g'), value);
    });

    // Add header information
    const headerHtml = `
      <div style="text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px;">
        <h2 style="margin: 0; color: #333;">${headerSettings?.clinic_name || 'Your Clinic Name'}</h2>
        <p style="margin: 5px 0; color: #666;">${headerSettings?.address || 'Your Clinic Address'}</p>
        <p style="margin: 5px 0; color: #666;">Tel: ${headerSettings?.phone || '+60 12-345 6789'} | Email: ${headerSettings?.email || 'info@yourclinic.com'}</p>
      </div>
    `;

    return headerHtml + previewContent;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={onClose}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Templates
          </Button>
          <h1 className="text-2xl font-bold">
            {template ? 'Edit Template' : 'Add New Template'}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye className="h-4 w-4 mr-2" />
            {showPreview ? 'Hide Preview' : 'Show Preview'}
          </Button>
          <Button onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Save Template
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Section */}
        <div className="space-y-6">
          {/* Template Details */}
          <Card>
            <CardHeader>
              <CardTitle>Template Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="template_name">Template Name *</Label>
                <Input
                  id="template_name"
                  value={formData.template_name}
                  onChange={(e) => setFormData(prev => ({ ...prev, template_name: e.target.value }))}
                  placeholder="Enter template name"
                />
              </div>

              <div>
                <Label htmlFor="template_type">Template Type *</Label>
                <Select
                  value={formData.template_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, template_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select template type" />
                  </SelectTrigger>
                  <SelectContent>
                    {templateTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter template description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="price_from">Price From (RM)</Label>
                  <Input
                    id="price_from"
                    type="number"
                    step="0.01"
                    value={formData.price_from}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_from: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="price_to">Price To (RM)</Label>
                  <Input
                    id="price_to"
                    type="number"
                    step="0.01"
                    value={formData.price_to}
                    onChange={(e) => setFormData(prev => ({ ...prev, price_to: parseFloat(e.target.value) || 0 }))}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="status"
                  checked={formData.status === 'active'}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, status: checked ? 'active' : 'inactive' }))}
                />
                <Label htmlFor="status">Active</Label>
              </div>
            </CardContent>
          </Card>

          {/* Content Editor */}
          <Card>
            <CardHeader>
              <CardTitle>Compose Content</CardTitle>
              <div className="flex items-center gap-1 border-b pb-2">
                <Button variant="ghost" size="sm">
                  <Bold className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Italic className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Underline className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <Button variant="ghost" size="sm">
                  <AlignLeft className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <AlignCenter className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <AlignRight className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <Button variant="ghost" size="sm">
                  <List className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <ListOrdered className="h-4 w-4" />
                </Button>
                <div className="w-px h-6 bg-border mx-2" />
                <Button variant="ghost" size="sm">
                  <Undo className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Redo className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Textarea
                id="content-editor"
                value={formData.content}
                onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Enter template content..."
                className="min-h-[300px] font-mono"
              />
            </CardContent>
          </Card>

          {/* Smart Fields */}
          <Card>
            <CardHeader>
              <CardTitle>Insert Smart Fields</CardTitle>
              <p className="text-sm text-muted-foreground">
                These fields allow system to automatically insert existing data. No manual editing needed.
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-2">
                {smartFields.map((field) => (
                  <Button
                    key={field.key}
                    variant="outline"
                    size="sm"
                    onClick={() => insertSmartField(field.key)}
                    className="justify-start"
                  >
                    {field.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview Section */}
        {showPreview && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Template Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <div 
                  className="prose prose-sm max-w-none p-6 border rounded-lg bg-white min-h-[600px]"
                  dangerouslySetInnerHTML={{ __html: renderPreview() }}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}