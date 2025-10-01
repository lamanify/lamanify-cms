import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2, Pill } from 'lucide-react';
import { useMedications, MedicationWithPricing } from '@/hooks/useMedications';
import { usePriceTiers } from '@/hooks/usePriceTiers';
import { useForm } from 'react-hook-form';

interface MedicationFormData {
  name: string;
  generic_name: string;
  brand_name: string;
  category: string;
  strength_options: string[];
  dosage_forms: string[];
  side_effects: string[];
  contraindications: string[];
  interactions: string[];
  pricing: { [tierId: string]: number };
  reorder_level?: number;
}

export function MedicationManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationWithPricing | null>(null);
  const { medications, loading, createMedication, updateMedication, deleteMedication } = useMedications();
  const { priceTiers } = usePriceTiers();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MedicationFormData>({
    defaultValues: {
      name: '',
      generic_name: '',
      brand_name: '',
      category: '',
      strength_options: [],
      dosage_forms: [],
      side_effects: [],
      contraindications: [],
      interactions: [],
      pricing: {},
      reorder_level: undefined
    }
  });

  const watchPricing = watch('pricing');
  const watchReorderLevel = watch('reorder_level');

  const openCreateDialog = () => {
    setEditingMedication(null);
    reset({
      name: '',
      generic_name: '',
      brand_name: '',
      category: '',
      strength_options: [],
      dosage_forms: [],
      side_effects: [],
      contraindications: [],
      interactions: [],
      pricing: {},
      reorder_level: undefined
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (medication: MedicationWithPricing) => {
    setEditingMedication(medication);
    reset({
      name: medication.name,
      generic_name: medication.generic_name || '',
      brand_name: medication.brand_name || '',
      category: medication.category || '',
      strength_options: medication.strength_options || [],
      dosage_forms: medication.dosage_forms || [],
      side_effects: medication.side_effects || [],
      contraindications: medication.contraindications || [],
      interactions: medication.interactions || [],
      pricing: medication.pricing,
      reorder_level: (medication as any).reorder_level
    });
    setIsDialogOpen(true);
  };

  const onSubmit = async (data: MedicationFormData) => {
    const success = editingMedication 
      ? await updateMedication(editingMedication.id, data)
      : await createMedication(data);
    
    if (success) {
      setIsDialogOpen(false);
      reset();
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this medication?')) {
      await deleteMedication(id);
    }
  };

  if (priceTiers.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Medication Management</h2>
            <p className="text-muted-foreground">Manage medications with multi-tier pricing</p>
          </div>
        </div>

        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Pill className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">Create Price Tiers First</h3>
            <p className="text-muted-foreground text-center mb-4">
              You need to create price tiers before you can manage medications with pricing.
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
          <h2 className="text-2xl font-bold text-foreground">Medication Management</h2>
          <p className="text-muted-foreground">Manage medications with multi-tier pricing</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Medication
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMedication ? 'Edit Medication' : 'Add New Medication'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Medication Name *</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Medication name is required' })}
                    placeholder="e.g., Paracetamol"
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="generic_name">Generic Name</Label>
                  <Input
                    id="generic_name"
                    {...register('generic_name')}
                    placeholder="e.g., Paracetamol"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="brand_name">Brand Name</Label>
                  <Input
                    id="brand_name"
                    {...register('brand_name')}
                    placeholder="e.g., Panadol"
                  />
                </div>
                <div>
                  <Label htmlFor="category">Category</Label>
                  <Select onValueChange={(value) => setValue('category', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="analgesic">Analgesic</SelectItem>
                      <SelectItem value="antibiotic">Antibiotic</SelectItem>
                      <SelectItem value="antihypertensive">Antihypertensive</SelectItem>
                      <SelectItem value="antidiabetic">Antidiabetic</SelectItem>
                      <SelectItem value="antipyretic">Antipyretic</SelectItem>
                      <SelectItem value="vitamin">Vitamin</SelectItem>
                      <SelectItem value="supplement">Supplement</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Reorder Level */}
              <div>
                <Label htmlFor="reorder_level">Reorder Level (Optional)</Label>
                <Input
                  id="reorder_level"
                  type="number"
                  min="0"
                  {...register('reorder_level', { valueAsNumber: true })}
                  placeholder="Leave empty to use clinic default"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Stock level at which reorder alerts are triggered. Leave empty to use clinic default threshold.
                </p>
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
                  {editingMedication ? 'Update Medication' : 'Create Medication'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medications ({medications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading medications...</div>
          ) : medications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No medications created yet.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medication Name</TableHead>
                    <TableHead>Generic/Brand</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Pricing</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {medications.map((medication) => (
                    <TableRow key={medication.id}>
                      <TableCell>
                        <div className="font-medium">{medication.name}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {medication.generic_name && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Generic:</span>
                              <span className="ml-1">{medication.generic_name}</span>
                            </div>
                          )}
                          {medication.brand_name && (
                            <div className="text-sm">
                              <span className="text-muted-foreground">Brand:</span>
                              <span className="ml-1">{medication.brand_name}</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {medication.category && (
                          <Badge variant="outline">{medication.category}</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                         <div className="space-y-1">
                           {priceTiers.map((tier) => (
                             <div key={tier.id} className="text-sm">
                               <span className="text-muted-foreground">{tier.tier_name}:</span>
                               <span className="ml-2 font-medium">
                                 RM {medication.pricing[tier.id]?.toFixed(2) || '0.00'}
                               </span>
                             </div>
                           ))}
                           {medication.average_cost && medication.average_cost > 0 && (
                             <div className="text-xs text-blue-600 font-medium border-t pt-1">
                               Avg Cost: RM {medication.average_cost.toFixed(4)}
                             </div>
                           )}
                         </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(medication)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(medication.id)}
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