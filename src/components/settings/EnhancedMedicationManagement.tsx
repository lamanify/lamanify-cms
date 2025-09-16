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
import { Switch } from '@/components/ui/switch';
import { Plus, Pencil, Trash2, Pill, Search, Eye, HelpCircle } from 'lucide-react';
import { useMedications, MedicationWithPricing, DosageTemplate } from '@/hooks/useMedications';
import { usePriceTiers } from '@/hooks/usePriceTiers';
import { useForm } from 'react-hook-form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface MedicationFormData {
  name: string;
  generic_name: string;
  category: string;
  groups: string[];
  cost_price: number;
  stock_level: number;
  remarks: string;
  enable_dosage_settings: boolean;
  unit_of_measure: string;
  pricing: { [tierId: string]: number };
  dosage_template: DosageTemplate;
}

export function EnhancedMedicationManagement() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMedication, setEditingMedication] = useState<MedicationWithPricing | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const { medications, loading, createMedication, updateMedication, deleteMedication } = useMedications();
  const { priceTiers } = usePriceTiers();
  
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<MedicationFormData>({
    defaultValues: {
      name: '',
      generic_name: '',
      category: 'Medication',
      groups: [],
      cost_price: 0,
      stock_level: 0,
      remarks: '',
      enable_dosage_settings: false,
      unit_of_measure: 'Tablet',
      pricing: {},
      dosage_template: {
        dosage_amount: 0,
        dosage_unit: 'ml',
        instruction: 'After meal',
        precaution: 'Keep away from children',
        frequency: 'OD',
        duration_value: 4,
        duration_unit: 'days',
        indication: 'Infection',
        dispense_quantity: 10
      }
    }
  });

  const watchEnableDosage = watch('enable_dosage_settings');
  const watchPricing = watch('pricing');

  // Filter medications based on search term
  const filteredMedications = medications.filter(medication =>
    medication.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medication.generic_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    medication.groups?.some(group => group.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const openCreateDialog = () => {
    setEditingMedication(null);
    reset({
      name: '',
      generic_name: '',
      category: 'Medication',
      groups: [],
      cost_price: 0,
      stock_level: 0,
      remarks: '',
      enable_dosage_settings: false,
      unit_of_measure: 'Tablet',
      pricing: {},
      dosage_template: {
        dosage_amount: 0,
        dosage_unit: 'ml',
        instruction: 'After meal',
        precaution: 'Keep away from children',
        frequency: 'OD',
        duration_value: 4,
        duration_unit: 'days',
        indication: 'Infection',
        dispense_quantity: 10
      }
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (medication: MedicationWithPricing) => {
    setEditingMedication(medication);
    reset({
      name: medication.name,
      generic_name: medication.generic_name || '',
      category: medication.category || 'Medication',
      groups: medication.groups || [],
      cost_price: medication.cost_price || 0,
      stock_level: medication.stock_level || 0,
      remarks: medication.remarks || '',
      enable_dosage_settings: medication.enable_dosage_settings || false,
      unit_of_measure: medication.unit_of_measure || 'Tablet',
      pricing: medication.pricing,
      dosage_template: medication.dosage_template || {
        dosage_amount: 0,
        dosage_unit: 'ml',
        instruction: 'After meal',
        precaution: 'Keep away from children',
        frequency: 'OD',
        duration_value: 4,
        duration_unit: 'days',
        indication: 'Infection',
        dispense_quantity: 10
      }
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

  const getPriceRange = (medication: MedicationWithPricing) => {
    const prices = Object.values(medication.pricing).filter(price => price > 0);
    if (prices.length === 0) return 'RM 0.00';
    if (prices.length === 1) return `RM ${prices[0].toFixed(2)}`;
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return `RM ${min.toFixed(2)} – RM ${max.toFixed(2)}`;
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
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Medication Management</h2>
          <p className="text-muted-foreground">Manage medications with comprehensive pricing and dosage settings</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCreateDialog} className="gap-2 bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4" />
              Add new
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingMedication ? 'Edit Medication' : 'New Medication'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information Section */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Medication details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      {...register('name', { required: 'Medicine name is required' })}
                      placeholder="e.g., Amoxil 125mg/5mL"
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive mt-1">{errors.name.message}</p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="generic_name">Generic name</Label>
                    <Input
                      id="generic_name"
                      {...register('generic_name')}
                      placeholder="e.g., Penicillin"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="category">Category</Label>
                    <Select onValueChange={(value) => setValue('category', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Medication">Medication</SelectItem>
                        <SelectItem value="Supplement">Supplement</SelectItem>
                        <SelectItem value="Vaccine">Vaccine</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <Label htmlFor="groups">Group</Label>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Set the medicine group according to diagnosis for accurate searching during dispensing.</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    <Select onValueChange={(value) => setValue('groups', [value])}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select group" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Antibiotics">Antibiotics</SelectItem>
                        <SelectItem value="Analgesics">Analgesics</SelectItem>
                        <SelectItem value="Antipyretics">Antipyretics</SelectItem>
                        <SelectItem value="Vitamins">Vitamins</SelectItem>
                        <SelectItem value="Probiotics">Probiotics</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="unit_of_measure">Unit of Measure (UOM) *</Label>
                  <Select onValueChange={(value) => setValue('unit_of_measure', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select unit of measure" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Strip">Strip</SelectItem>
                      <SelectItem value="Tablet">Tablet</SelectItem>
                      <SelectItem value="Bottle">Bottle</SelectItem>
                      <SelectItem value="Tube">Tube</SelectItem>
                      <SelectItem value="Sachet">Sachet</SelectItem>
                      <SelectItem value="Vial">Vial</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dosage Settings Toggle */}
              <div className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-medium">Dosage</h3>
                    <p className="text-sm text-muted-foreground">
                      Set default value for dosage and instructions. Providers can modify these when dispensing.
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      They can change it accordingly while dispensing the medication to patients.<br />
                      Disable if your item does not need one.
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="enable_dosage_settings" className="text-sm font-medium">
                      Turn this on if you wish to add dosage settings
                    </Label>
                    <Switch
                      id="enable_dosage_settings"
                      {...register('enable_dosage_settings')}
                    />
                  </div>
                </div>

                {/* Dosage Fields (shown when toggle is ON) */}
                {watchEnableDosage && (
                  <div className="grid grid-cols-2 gap-4 animate-fade-in">
                    <div>
                      <Label htmlFor="dosage_amount">Dosage amount</Label>
                      <Input
                        id="dosage_amount"
                        type="number"
                        step="0.1"
                        {...register('dosage_template.dosage_amount', { valueAsNumber: true })}
                        placeholder="5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dosage_unit">Dosage unit</Label>
                      <Select onValueChange={(value) => setValue('dosage_template.dosage_unit', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ml">ml</SelectItem>
                          <SelectItem value="mg">mg</SelectItem>
                          <SelectItem value="tablets">tablets</SelectItem>
                          <SelectItem value="capsules">capsules</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="instruction">Instruction</Label>
                      <Select onValueChange={(value) => setValue('dosage_template.instruction', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select instruction" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="After Meal">After Meal</SelectItem>
                          <SelectItem value="Before Meal">Before Meal</SelectItem>
                          <SelectItem value="With Meal">With Meal</SelectItem>
                          <SelectItem value="On Empty Stomach">On Empty Stomach</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="precaution">Precaution</Label>
                      <Select onValueChange={(value) => setValue('dosage_template.precaution', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select precaution" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Keep away from children">Keep away from children</SelectItem>
                          <SelectItem value="Store in cool dry place">Store in cool dry place</SelectItem>
                          <SelectItem value="Refrigerate">Refrigerate</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="frequency">Frequency</Label>
                      <Select onValueChange={(value) => setValue('dosage_template.frequency', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="TDS">TDS</SelectItem>
                          <SelectItem value="OD">OD</SelectItem>
                          <SelectItem value="BD">BD</SelectItem>
                          <SelectItem value="QID">QID</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Select onValueChange={(value) => setValue('dosage_template.duration_unit', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4 Days">4 Days</SelectItem>
                          <SelectItem value="7 Days">7 Days</SelectItem>
                          <SelectItem value="14 Days">14 Days</SelectItem>
                          <SelectItem value="30 Days">30 Days</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="indication">Indication</Label>
                      <Select onValueChange={(value) => setValue('dosage_template.indication', value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select indication" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Infection">Infection</SelectItem>
                          <SelectItem value="Fever">Fever</SelectItem>
                          <SelectItem value="Pain Relief">Pain Relief</SelectItem>
                          <SelectItem value="Inflammation">Inflammation</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="dispense_quantity">Dispense quantity</Label>
                      <Input
                        id="dispense_quantity"
                        type="number"
                        {...register('dosage_template.dispense_quantity', { valueAsNumber: true })}
                        placeholder="10"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing Section */}
              <div className="space-y-4">
                <div>
                  <h4 className="text-lg font-medium">Pricing</h4>
                  <p className="text-sm text-muted-foreground">Set cost and patient prices for each tier</p>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cost_price">Cost Price (RM)</Label>
                    <Input
                      id="cost_price"
                      type="number"
                      step="0.01"
                      min="0"
                      {...register('cost_price', { valueAsNumber: true })}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label htmlFor="stock_level">Stock Level</Label>
                    <Input
                      id="stock_level"
                      type="number"
                      min="0"
                      {...register('stock_level', { valueAsNumber: true })}
                      placeholder="0"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      You can enter 0 now and update the stock count later.
                    </p>
                  </div>
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
                          {...register(`pricing.${tier.id}`, { 
                            valueAsNumber: true,
                            setValueAs: (value) => value || 0
                          })}
                          className="flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <Label htmlFor="remarks">Remarks</Label>
                <Textarea
                  id="remarks"
                  {...register('remarks')}
                  placeholder="Any additional notes, expiry information, etc."
                  rows={2}
                />
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
                  {editingMedication ? 'Update' : 'Save'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search medicines by name, generic name, or group..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Medications Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Medications ({filteredMedications.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">Loading medications...</div>
          ) : filteredMedications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {searchTerm ? 'No medications match your search.' : 'No medications created yet.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Medicine Name</TableHead>
                    <TableHead>Group</TableHead>
                    <TableHead>Cost Price (RM)</TableHead>
                    <TableHead className="text-green-600">Price to Patient</TableHead>
                    <TableHead>Stock Level</TableHead>
                    <TableHead>Remarks</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMedications.map((medication) => (
                    <TableRow key={medication.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{medication.name}</div>
                          {medication.generic_name && (
                            <div className="text-sm text-muted-foreground">
                              {medication.generic_name}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {medication.groups?.map((group) => (
                            <Badge key={group} variant="secondary" className="text-xs">
                              {group}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        RM {medication.cost_price?.toFixed(2) || '0.00'}
                      </TableCell>
                      <TableCell className="text-green-600 font-medium">
                        {getPriceRange(medication)}
                      </TableCell>
                      <TableCell>
                        <div>
                          <div>{medication.stock_level || 0}</div>
                          {medication.unit_of_measure && (
                            <div className="text-xs text-muted-foreground">
                              {medication.unit_of_measure}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-muted-foreground max-w-32 truncate">
                          {medication.remarks || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openEditDialog(medication)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
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