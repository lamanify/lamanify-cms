import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { File, Plus, Copy, Calendar, Building2, Eye } from 'lucide-react';
import { useWorkflowManagement, type POTemplate } from '@/hooks/useWorkflowManagement';
import { usePurchaseOrders } from '@/hooks/usePurchaseOrders';

export const POTemplateManager = () => {
  const { poTemplates, createPOTemplate, usePOTemplate, loading } = useWorkflowManagement();
  const { suppliers } = usePurchaseOrders();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [viewTemplateDialog, setViewTemplateDialog] = useState<POTemplate | null>(null);
  const [formData, setFormData] = useState({
    template_name: '',
    description: '',
    supplier_id: '',
    department: '',
    template_data: {
      payment_terms: '',
      delivery_terms: '',
      notes: '',
      items: []
    },
    auto_generate_frequency: '',
    auto_generate_day: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const template: Omit<POTemplate, 'id' | 'created_at' | 'updated_at' | 'usage_count' | 'last_used_at'> = {
      template_name: formData.template_name,
      description: formData.description || null,
      supplier_id: formData.supplier_id,
      department: formData.department || null,
      template_data: formData.template_data,
      auto_generate_frequency: formData.auto_generate_frequency || null,
      auto_generate_day: formData.auto_generate_day ? parseInt(formData.auto_generate_day) : null,
      next_generation_date: null,
      is_active: true,
      created_by: null
    };

    const success = await createPOTemplate(template);
    if (success) {
      setIsDialogOpen(false);
      setFormData({
        template_name: '',
        description: '',
        supplier_id: '',
        department: '',
        template_data: {
          payment_terms: '',
          delivery_terms: '',
          notes: '',
          items: []
        },
        auto_generate_frequency: '',
        auto_generate_day: ''
      });
    }
  };

  const handleUseTemplate = async (templateId: string) => {
    await usePOTemplate(templateId);
    // In a real implementation, this would navigate to the PO creation form with pre-filled data
  };

  const frequencyOptions = [
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' }
  ];

  const getFrequencyColor = (frequency: string | null) => {
    switch (frequency) {
      case 'weekly': return 'bg-blue-100 text-blue-800';
      case 'monthly': return 'bg-green-100 text-green-800';
      case 'quarterly': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Purchase Order Templates</h2>
          <p className="text-muted-foreground">Create and manage reusable PO templates for recurring orders</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create PO Template</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="template_name">Template Name</Label>
                  <Input
                    id="template_name"
                    value={formData.template_name}
                    onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                    placeholder="e.g., Monthly Medication Order"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supplier_id">Supplier</Label>
                  <Select
                    value={formData.supplier_id}
                    onValueChange={(value) => setFormData({ ...formData, supplier_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select supplier" />
                    </SelectTrigger>
                    <SelectContent>
                      {suppliers.map((supplier) => (
                        <SelectItem key={supplier.id} value={supplier.id}>
                          {supplier.supplier_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this template is used for..."
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="department">Department (Optional)</Label>
                  <Input
                    id="department"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    placeholder="e.g., Pharmacy"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="auto_generate_frequency">Auto Generation (Optional)</Label>
                  <Select
                    value={formData.auto_generate_frequency}
                    onValueChange={(value) => setFormData({ ...formData, auto_generate_frequency: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Manual only" />
                    </SelectTrigger>
                    <SelectContent>
                      {frequencyOptions.map((freq) => (
                        <SelectItem key={freq.value} value={freq.value}>
                          {freq.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.auto_generate_frequency && (
                <div className="space-y-2">
                  <Label htmlFor="auto_generate_day">
                    {formData.auto_generate_frequency === 'weekly' ? 'Day of Week (1-7)' : 'Day of Month (1-31)'}
                  </Label>
                  <Input
                    id="auto_generate_day"
                    type="number"
                    min="1"
                    max={formData.auto_generate_frequency === 'weekly' ? '7' : '31'}
                    value={formData.auto_generate_day}
                    onChange={(e) => setFormData({ ...formData, auto_generate_day: e.target.value })}
                    placeholder={formData.auto_generate_frequency === 'weekly' ? 'e.g., 1 for Monday' : 'e.g., 15 for 15th'}
                  />
                </div>
              )}

              <Separator />

              <div className="space-y-4">
                <Label className="text-base font-medium">Template Details</Label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="payment_terms">Payment Terms</Label>
                    <Input
                      id="payment_terms"
                      value={formData.template_data.payment_terms}
                      onChange={(e) => setFormData({
                        ...formData,
                        template_data: { ...formData.template_data, payment_terms: e.target.value }
                      })}
                      placeholder="e.g., Net 30"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="delivery_terms">Delivery Terms</Label>
                    <Input
                      id="delivery_terms"
                      value={formData.template_data.delivery_terms}
                      onChange={(e) => setFormData({
                        ...formData,
                        template_data: { ...formData.template_data, delivery_terms: e.target.value }
                      })}
                      placeholder="e.g., 7-10 business days"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="notes">Standard Notes</Label>
                  <Textarea
                    id="notes"
                    value={formData.template_data.notes}
                    onChange={(e) => setFormData({
                      ...formData,
                      template_data: { ...formData.template_data, notes: e.target.value }
                    })}
                    placeholder="Standard notes for this type of order..."
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  Create Template
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {poTemplates.map((template) => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <File className="h-5 w-5 text-primary" />
                  <div>
                    <CardTitle className="text-base">{template.template_name}</CardTitle>
                    <CardDescription className="text-sm">
                      {template.supplier_name}
                    </CardDescription>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewTemplateDialog(template)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {template.description && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {template.description}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                {template.department && (
                  <Badge variant="outline" className="gap-1">
                    <Building2 className="h-3 w-3" />
                    {template.department}
                  </Badge>
                )}
                {template.auto_generate_frequency && (
                  <Badge className={getFrequencyColor(template.auto_generate_frequency)}>
                    <Calendar className="h-3 w-3 mr-1" />
                    {template.auto_generate_frequency}
                  </Badge>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">USED</Label>
                  <p className="font-semibold">{template.usage_count} times</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">LAST USED</Label>
                  <p className="font-semibold">
                    {template.last_used_at 
                      ? new Date(template.last_used_at).toLocaleDateString()
                      : 'Never'
                    }
                  </p>
                </div>
              </div>

              <Button 
                className="w-full gap-2" 
                onClick={() => handleUseTemplate(template.id)}
              >
                <Copy className="h-4 w-4" />
                Use Template
              </Button>
            </CardContent>
          </Card>
        ))}

        {poTemplates.length === 0 && (
          <div className="col-span-full">
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <File className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No PO Templates</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create reusable templates to streamline your recurring purchase orders.
                </p>
                <Button onClick={() => setIsDialogOpen(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Template
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>

      {/* Template View Dialog */}
      {viewTemplateDialog && (
        <Dialog open={true} onOpenChange={() => setViewTemplateDialog(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Template Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">TEMPLATE NAME</Label>
                  <p className="font-semibold">{viewTemplateDialog.template_name}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">SUPPLIER</Label>
                  <p className="font-semibold">{viewTemplateDialog.supplier_name}</p>
                </div>
              </div>

              {viewTemplateDialog.description && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">DESCRIPTION</Label>
                  <p className="mt-1">{viewTemplateDialog.description}</p>
                </div>
              )}

              <Separator />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">PAYMENT TERMS</Label>
                  <p>{viewTemplateDialog.template_data?.payment_terms || 'Not specified'}</p>
                </div>
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">DELIVERY TERMS</Label>
                  <p>{viewTemplateDialog.template_data?.delivery_terms || 'Not specified'}</p>
                </div>
              </div>

              {viewTemplateDialog.template_data?.notes && (
                <div>
                  <Label className="text-xs font-medium text-muted-foreground">NOTES</Label>
                  <p className="mt-1">{viewTemplateDialog.template_data.notes}</p>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setViewTemplateDialog(null)}>
                  Close
                </Button>
                <Button onClick={() => handleUseTemplate(viewTemplateDialog.id)} className="gap-2">
                  <Copy className="h-4 w-4" />
                  Use Template
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};