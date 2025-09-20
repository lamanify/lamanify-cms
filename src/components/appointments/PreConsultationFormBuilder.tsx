import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, FileText, GripVertical, X } from 'lucide-react';
import { usePreConsultationForms, type PreConsultationForm, type FormField } from '@/hooks/usePreConsultationForms';

interface FormFieldEditor {
  field: FormField;
  onUpdate: (field: FormField) => void;
  onDelete: () => void;
}

const FormFieldEditor: React.FC<FormFieldEditor> = ({ field, onUpdate, onDelete }) => {
  return (
    <div className="border rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
          <Badge variant="outline">{field.type}</Badge>
        </div>
        <Button variant="ghost" size="sm" onClick={onDelete}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`label-${field.id}`}>Label</Label>
          <Input
            id={`label-${field.id}`}
            value={field.label}
            onChange={(e) => onUpdate({ ...field, label: e.target.value })}
            placeholder="Field label"
          />
        </div>
        <div>
          <Label htmlFor={`type-${field.id}`}>Type</Label>
          <Select value={field.type} onValueChange={(value: any) => onUpdate({ ...field, type: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="textarea">Text Area</SelectItem>
              <SelectItem value="select">Select</SelectItem>
              <SelectItem value="checkbox">Checkbox</SelectItem>
              <SelectItem value="radio">Radio</SelectItem>
              <SelectItem value="file">File Upload</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor={`placeholder-${field.id}`}>Placeholder</Label>
          <Input
            id={`placeholder-${field.id}`}
            value={field.placeholder || ''}
            onChange={(e) => onUpdate({ ...field, placeholder: e.target.value })}
            placeholder="Placeholder text"
          />
        </div>
        <div className="flex items-center space-x-2 pt-8">
          <Switch
            id={`required-${field.id}`}
            checked={field.required}
            onCheckedChange={(checked) => onUpdate({ ...field, required: checked })}
          />
          <Label htmlFor={`required-${field.id}`}>Required</Label>
        </div>
      </div>
      
      {(field.type === 'select' || field.type === 'radio') && (
        <div>
          <Label htmlFor={`options-${field.id}`}>Options (one per line)</Label>
          <Textarea
            id={`options-${field.id}`}
            value={field.options?.join('\n') || ''}
            onChange={(e) => onUpdate({ ...field, options: e.target.value.split('\n').filter(o => o.trim()) })}
            placeholder="Option 1&#10;Option 2&#10;Option 3"
            rows={3}
          />
        </div>
      )}
    </div>
  );
};

interface FormModalProps {
  form?: PreConsultationForm;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (form: Omit<PreConsultationForm, 'id' | 'created_at' | 'updated_at'>) => void;
}

const FormModal: React.FC<FormModalProps> = ({ form, open, onOpenChange, onSave }) => {
  const [formData, setFormData] = useState({
    form_name: form?.form_name || '',
    form_description: form?.form_description || '',
    form_fields: form?.form_fields || [] as FormField[],
    appointment_types: form?.appointment_types || [],
    is_required: form?.is_required ?? false,
    is_active: form?.is_active ?? true,
  });

  const addField = () => {
    const newField: FormField = {
      id: Date.now().toString(),
      type: 'text',
      label: 'New Field',
      required: false,
    };
    setFormData(prev => ({
      ...prev,
      form_fields: [...prev.form_fields, newField]
    }));
  };

  const updateField = (index: number, field: FormField) => {
    setFormData(prev => ({
      ...prev,
      form_fields: prev.form_fields.map((f, i) => i === index ? field : f)
    }));
  };

  const deleteField = (index: number) => {
    setFormData(prev => ({
      ...prev,
      form_fields: prev.form_fields.filter((_, i) => i !== index)
    }));
  };

  const handleSave = () => {
    onSave(formData);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{form ? 'Edit' : 'Create'} Pre-Consultation Form</DialogTitle>
          <DialogDescription>
            Design forms for patients to complete before their appointments
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="form_name">Form Name</Label>
              <Input
                id="form_name"
                value={formData.form_name}
                onChange={(e) => setFormData(prev => ({ ...prev, form_name: e.target.value }))}
                placeholder="e.g., Pre-Consultation Health Check"
              />
            </div>
            <div className="flex items-center space-x-4 pt-8">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_required"
                  checked={formData.is_required}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_required: checked }))}
                />
                <Label htmlFor="is_required">Required</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_active"
                  checked={formData.is_active}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
                />
                <Label htmlFor="is_active">Active</Label>
              </div>
            </div>
          </div>
          
          <div className="grid gap-2">
            <Label htmlFor="form_description">Description</Label>
            <Textarea
              id="form_description"
              value={formData.form_description}
              onChange={(e) => setFormData(prev => ({ ...prev, form_description: e.target.value }))}
              placeholder="Brief description of this form's purpose"
              rows={2}
            />
          </div>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Form Fields</Label>
              <Button type="button" variant="outline" size="sm" onClick={addField}>
                <Plus className="h-4 w-4 mr-2" />
                Add Field
              </Button>
            </div>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {formData.form_fields.map((field, index) => (
                <FormFieldEditor
                  key={field.id}
                  field={field}
                  onUpdate={(updatedField) => updateField(index, updatedField)}
                  onDelete={() => deleteField(index)}
                />
              ))}
              
              {formData.form_fields.length === 0 && (
                <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                  <FileText className="h-8 w-8 mx-auto mb-2" />
                  <p>No fields added yet</p>
                  <p className="text-sm">Click "Add Field" to get started</p>
                </div>
              )}
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!formData.form_name || formData.form_fields.length === 0}>
            {form ? 'Update' : 'Create'} Form
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const PreConsultationFormBuilder: React.FC = () => {
  const { forms, loading, createForm, updateForm, deleteForm, getFormSubmissions } = usePreConsultationForms();
  const [selectedForm, setSelectedForm] = useState<PreConsultationForm | undefined>();
  const [showModal, setShowModal] = useState(false);

  const handleCreateForm = async (formData: Omit<PreConsultationForm, 'id' | 'created_at' | 'updated_at'>) => {
    await createForm(formData);
  };

  const handleUpdateForm = async (formData: Omit<PreConsultationForm, 'id' | 'created_at' | 'updated_at'>) => {
    if (selectedForm) {
      await updateForm(selectedForm.id, formData);
    }
  };

  const handleEdit = (form: PreConsultationForm) => {
    setSelectedForm(form);
    setShowModal(true);
  };

  const handleCreate = () => {
    setSelectedForm(undefined);
    setShowModal(true);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">Loading pre-consultation forms...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Pre-Consultation Forms</h2>
          <p className="text-muted-foreground">Create forms for patients to complete before their appointments</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Form
        </Button>
      </div>
      
      <div className="grid gap-4">
        {forms.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Forms Created</h3>
              <p className="text-muted-foreground mb-4">
                Create pre-consultation forms to collect patient information before appointments
              </p>
              <Button onClick={handleCreate}>
                <Plus className="h-4 w-4 mr-2" />
                Create First Form
              </Button>
            </CardContent>
          </Card>
        ) : (
          forms.map(form => (
            <Card key={form.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      {form.form_name}
                      <Badge variant={form.is_active ? 'default' : 'secondary'}>
                        {form.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {form.is_required && (
                        <Badge variant="outline">Required</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>
                      {form.form_description || 'No description provided'}
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(form)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => deleteForm(form.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-2">Fields ({form.form_fields.length})</p>
                    <div className="flex flex-wrap gap-2">
                      {form.form_fields.slice(0, 5).map(field => (
                        <Badge key={field.id} variant="outline" className="text-xs">
                          {field.label} ({field.type})
                        </Badge>
                      ))}
                      {form.form_fields.length > 5 && (
                        <Badge variant="outline" className="text-xs">
                          +{form.form_fields.length - 5} more
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
      
      <FormModal
        form={selectedForm}
        open={showModal}
        onOpenChange={setShowModal}
        onSave={selectedForm ? handleUpdateForm : handleCreateForm}
      />
    </div>
  );
};