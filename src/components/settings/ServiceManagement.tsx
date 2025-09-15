import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Package } from 'lucide-react';
import { useServices, ServiceWithPricing } from '@/hooks/useServices';
import { usePriceTiers } from '@/hooks/usePriceTiers';
import { useForm } from 'react-hook-form';

interface ServiceFormData {
  name: string;
  category: string;
  description: string;
  duration_minutes: number;
  requires_equipment: boolean;
  preparation_notes: string;
  pricing: { [tierId: string]: number };
}

export function ServiceManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ServiceWithPricing | null>(null);
  const { services, loading, createService, updateService, deleteService } = useServices();
  const { priceTiers } = usePriceTiers();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<ServiceFormData>({
    defaultValues: {
      name: '',
      category: '',
      description: '',
      duration_minutes: 30,
      requires_equipment: false,
      preparation_notes: '',
      pricing: {}
    }
  });

  const watchPricing = watch('pricing');

  const openCreateDialog = () => {
    setEditingService(null);
    reset({
      name: '',
      category: '',
      description: '',
      duration_minutes: 30,
      requires_equipment: false,
      preparation_notes: '',
      pricing: {}
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (service: ServiceWithPricing) => {
    setEditingService(service);
    reset({
      name: service.name,
      category: service.category,
      description: service.description || '',
      duration_minutes: service.duration_minutes || 30,
      requires_equipment: service.requires_equipment || false,
      preparation_notes: service.preparation_notes || '',
      pricing: service.pricing
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: ServiceFormData) => {
    const success = editingService 
      ? await updateService(editingService.id, data)
      : await createService(data);
    
    if (success) {
      setIsDialogOpen(false);
      reset();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this service?')) {
      await deleteService(id);
    }
  };

  if (priceTiers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Service Management</h2>
            <p className="text-muted-foreground">Manage medical services with multi-tier pricing</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Create Price Tiers First</h3>
            <p className="text-muted-foreground text-center mb-4">
              You need to create price tiers before you can manage services with pricing.
            </p>
            <p className="text-sm text-muted-foreground text-center">
              Go to Settings → Price Tier Management to create your first price tier.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Service Management</h2>
          <p className="text-muted-foreground">Manage medical services with multi-tier pricing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Service
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingService ? 'Edit Service' : 'Add New Service'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Service Name *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Service name is required' })}
                    placeholder="e.g., General Consultation"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select onValueChange={(value) => setValue('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="consultation">Consultation</SelectItem>
                      <SelectItem value="procedure">Procedure</SelectItem>
                      <SelectItem value="diagnostic">Diagnostic</SelectItem>
                      <SelectItem value="therapy">Therapy</SelectItem>
                      <SelectItem value="laboratory">Laboratory</SelectItem>
                      <SelectItem value="imaging">Imaging</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.category && (
                    <p className="text-sm text-destructive mt-1">{errors.category.message}</p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  {...register('description')}
                  placeholder="Brief description of the service"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="duration_minutes">Duration (minutes)</Label>
                  <Input
                    id="duration_minutes"
                    type="number"
                    {...register('duration_minutes', { valueAsNumber: true })}
                    placeholder="30"
                  />
                </div>
                <div className="flex items-center space-x-2 pt-8">
                  <Switch
                    id="requires_equipment"
                    {...register('requires_equipment')}
                  />
                  <Label htmlFor="requires_equipment">Requires Equipment</Label>
                </div>
              </div>

              <div>
                <Label htmlFor="preparation_notes">Preparation Notes</Label>
                <Textarea
                  id="preparation_notes"
                  {...register('preparation_notes')}
                  placeholder="Any special preparation instructions for patients"
                  rows={2}
                />
              </div>

              {/* Pricing by Tier Section */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium">Pricing by Tier</h4>
                  <p className="text-sm text-muted-foreground">Set prices for each tier</p>
                </div>
                <div className="grid gap-4">
                  {priceTiers.map((tier) => (
                    <div key={tier.id} className="flex items-center gap-4">
                      <Label className="w-32 text-sm font-medium">
                        {tier.tier_name} Price:
                      </Label>
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-sm">RM</span>
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={watchPricing[tier.id] || ''}
                          onChange={(e) => {
                            const value = parseFloat(e.target.value) || 0;
                            setValue(`pricing.${tier.id}`, value);
                          }}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">
                  {editingService ? 'Update Service' : 'Create Service'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Services ({services.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading services...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No services created yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Service Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {services.map((service) => (
                    <TableRow key={service.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{service.name}</div>
                          {service.description && (
                            <div className="text-sm text-muted-foreground">
                              {service.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{service.category}</Badge>
                      </TableCell>
                      <TableCell>
                        {service.duration_minutes ? `${service.duration_minutes} min` : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {priceTiers.map((tier) => (
                            <div key={tier.id} className="text-sm">
                              <span className="text-muted-foreground">{tier.tier_name}:</span>
                              <span className="ml-2 font-medium">
                                RM {service.pricing[tier.id]?.toFixed(2) || '0.00'}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(service)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(service.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}