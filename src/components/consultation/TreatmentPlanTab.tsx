import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useConsultation, TreatmentItem, Medication, MedicalService } from '@/hooks/useConsultation';
import { Pill, Stethoscope, Plus, Trash2, Calculator, Package } from 'lucide-react';

interface TreatmentPlanTabProps {
  sessionId: string;
  treatmentItems?: TreatmentItem[];
  onUpdate?: () => void;
}

export function TreatmentPlanTab({ sessionId, treatmentItems, onUpdate }: TreatmentPlanTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'medications' | 'services'>('medications');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [selectedService, setSelectedService] = useState<MedicalService | null>(null);
  const { 
    medications, 
    services, 
    addTreatmentItem, 
    fetchMedications, 
    fetchServices, 
    calculateTotalCost 
  } = useConsultation();

  const [treatmentForm, setTreatmentForm] = useState({
    quantity: 1,
    rate: 0,
    dosage_instructions: '',
    frequency: '',
    duration_days: 7,
    notes: ''
  });

  useEffect(() => {
    if (searchTerm) {
      fetchMedications(searchTerm);
      fetchServices(searchTerm);
    }
  }, [searchTerm, fetchMedications, fetchServices]);

  const resetForm = () => {
    setTreatmentForm({
      quantity: 1,
      rate: 0,
      dosage_instructions: '',
      frequency: '',
      duration_days: 7,
      notes: ''
    });
    setSelectedMedication(null);
    setSelectedService(null);
    setSearchTerm('');
  };

  const handleAddMedication = async () => {
    if (!selectedMedication) return;

    try {
      await addTreatmentItem(sessionId, {
        item_type: 'medication',
        medication_id: selectedMedication.id,
        quantity: treatmentForm.quantity,
        rate: treatmentForm.rate || selectedMedication.price_per_unit || 0,
        dosage_instructions: treatmentForm.dosage_instructions,
        frequency: treatmentForm.frequency,
        duration_days: treatmentForm.duration_days,
        notes: treatmentForm.notes
      });
      
      resetForm();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding medication:', error);
    }
  };

  const handleAddService = async () => {
    if (!selectedService) return;

    try {
      await addTreatmentItem(sessionId, {
        item_type: 'service',
        service_id: selectedService.id,
        quantity: treatmentForm.quantity,
        rate: treatmentForm.rate || selectedService.price,
        notes: treatmentForm.notes
      });
      
      resetForm();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const calculateItemTotal = () => {
    const rate = treatmentForm.rate || 
      (selectedMedication?.price_per_unit) || 
      (selectedService?.price) || 0;
    return rate * treatmentForm.quantity;
  };

  const calculateDosage = (patientWeight?: number) => {
    if (!selectedMedication || !patientWeight) return '';
    
    // Simple dosage calculation example
    const baseRate = 10; // mg per kg
    const calculatedDose = patientWeight * baseRate;
    return `${calculatedDose}mg based on weight`;
  };

  const filteredMedications = medications.filter(med =>
    med.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (med.generic_name && med.generic_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const filteredServices = services.filter(service =>
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    service.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Total Cost Display */}
      <Card className="bg-gradient-to-r from-primary/5 to-primary/10 border-primary/20">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Calculator className="h-6 w-6 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Total Treatment Cost</h3>
                <p className="text-sm text-muted-foreground">Real-time calculation</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                ${calculateTotalCost().toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                {treatmentItems?.length || 0} items
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Add Items Section */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" />
                Add Treatment Items
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Search Bar */}
              <div>
                <Label htmlFor="search">Search Medications & Services</Label>
                <Input
                  id="search"
                  placeholder="Type to search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Tab Selection */}
              <div className="flex space-x-1 border-b">
                <Button
                  variant={activeTab === 'medications' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('medications')}
                  className="flex items-center gap-2"
                >
                  <Pill className="h-4 w-4" />
                  Medications
                </Button>
                <Button
                  variant={activeTab === 'services' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setActiveTab('services')}
                  className="flex items-center gap-2"
                >
                  <Stethoscope className="h-4 w-4" />
                  Services
                </Button>
              </div>

              {/* Medications Tab */}
              {activeTab === 'medications' && (
                <div className="space-y-4">
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredMedications.map((medication) => (
                      <div
                        key={medication.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedMedication?.id === medication.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setSelectedMedication(medication);
                          setTreatmentForm(prev => ({
                            ...prev,
                            rate: medication.price_per_unit || 0
                          }));
                        }}
                      >
                        <div className="font-medium">{medication.name}</div>
                        {medication.generic_name && (
                          <div className="text-sm text-muted-foreground">
                            Generic: {medication.generic_name}
                          </div>
                        )}
                        {medication.category && (
                          <Badge variant="outline" className="text-xs">
                            {medication.category}
                          </Badge>
                        )}
                        {medication.price_per_unit && (
                          <div className="text-sm font-medium text-primary">
                            ${medication.price_per_unit.toFixed(2)} per unit
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {selectedMedication && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="quantity">Quantity</Label>
                          <Input
                            id="quantity"
                            type="number"
                            min="1"
                            value={treatmentForm.quantity}
                            onChange={(e) =>
                              setTreatmentForm(prev => ({
                                ...prev,
                                quantity: parseInt(e.target.value) || 1
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="rate">Rate per Unit ($)</Label>
                          <Input
                            id="rate"
                            type="number"
                            step="0.01"
                            value={treatmentForm.rate}
                            onChange={(e) =>
                              setTreatmentForm(prev => ({
                                ...prev,
                                rate: parseFloat(e.target.value) || 0
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="dosage">Dosage Instructions</Label>
                        <Textarea
                          id="dosage"
                          placeholder="e.g., Take 1 tablet twice daily with food"
                          value={treatmentForm.dosage_instructions}
                          onChange={(e) =>
                            setTreatmentForm(prev => ({
                              ...prev,
                              dosage_instructions: e.target.value
                            }))
                          }
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="frequency">Frequency</Label>
                          <Select
                            value={treatmentForm.frequency}
                            onValueChange={(value) =>
                              setTreatmentForm(prev => ({
                                ...prev,
                                frequency: value
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select frequency" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="once-daily">Once Daily</SelectItem>
                              <SelectItem value="twice-daily">Twice Daily</SelectItem>
                              <SelectItem value="three-times-daily">Three Times Daily</SelectItem>
                              <SelectItem value="four-times-daily">Four Times Daily</SelectItem>
                              <SelectItem value="as-needed">As Needed</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor="duration">Duration (days)</Label>
                          <Input
                            id="duration"
                            type="number"
                            min="1"
                            value={treatmentForm.duration_days}
                            onChange={(e) =>
                              setTreatmentForm(prev => ({
                                ...prev,
                                duration_days: parseInt(e.target.value) || 7
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="font-medium">
                          Total: ${calculateItemTotal().toFixed(2)}
                        </div>
                        <Button onClick={handleAddMedication}>
                          Add Medication
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div className="space-y-4">
                  <div className="max-h-48 overflow-y-auto space-y-2">
                    {filteredServices.map((service) => (
                      <div
                        key={service.id}
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          selectedService?.id === service.id
                            ? 'border-primary bg-primary/5'
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          setSelectedService(service);
                          setTreatmentForm(prev => ({
                            ...prev,
                            rate: service.price
                          }));
                        }}
                      >
                        <div className="font-medium">{service.name}</div>
                        <Badge variant="outline" className="text-xs">
                          {service.category}
                        </Badge>
                        {service.description && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {service.description}
                          </div>
                        )}
                        <div className="text-sm font-medium text-primary">
                          ${service.price.toFixed(2)}
                          {service.duration_minutes && ` (${service.duration_minutes} min)`}
                        </div>
                      </div>
                    ))}
                  </div>

                  {selectedService && (
                    <div className="border-t pt-4 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="service-quantity">Quantity</Label>
                          <Input
                            id="service-quantity"
                            type="number"
                            min="1"
                            value={treatmentForm.quantity}
                            onChange={(e) =>
                              setTreatmentForm(prev => ({
                                ...prev,
                                quantity: parseInt(e.target.value) || 1
                              }))
                            }
                          />
                        </div>
                        <div>
                          <Label htmlFor="service-rate">Rate ($)</Label>
                          <Input
                            id="service-rate"
                            type="number"
                            step="0.01"
                            value={treatmentForm.rate}
                            onChange={(e) =>
                              setTreatmentForm(prev => ({
                                ...prev,
                                rate: parseFloat(e.target.value) || 0
                              }))
                            }
                          />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="service-notes">Notes</Label>
                        <Textarea
                          id="service-notes"
                          placeholder="Additional notes for this service..."
                          value={treatmentForm.notes}
                          onChange={(e) =>
                            setTreatmentForm(prev => ({
                              ...prev,
                              notes: e.target.value
                            }))
                          }
                        />
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t">
                        <div className="font-medium">
                          Total: ${calculateItemTotal().toFixed(2)}
                        </div>
                        <Button onClick={handleAddService}>
                          Add Service
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Current Treatment Items */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Current Treatment Plan
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!treatmentItems || treatmentItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No items added yet</p>
                  <p className="text-sm">Start by adding medications or services</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {treatmentItems.map((item) => (
                    <div key={item.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {item.item_type === 'medication' ? (
                              <Pill className="h-4 w-4 text-primary" />
                            ) : (
                              <Stethoscope className="h-4 w-4 text-info" />
                            )}
                            <span className="font-medium">
                              {item.medication?.name || item.service?.name}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {item.item_type}
                            </Badge>
                          </div>

                          {item.dosage_instructions && (
                            <div className="text-sm text-muted-foreground mb-1">
                              <strong>Dosage:</strong> {item.dosage_instructions}
                            </div>
                          )}

                          {item.frequency && (
                            <div className="text-sm text-muted-foreground mb-1">
                              <strong>Frequency:</strong> {item.frequency}
                            </div>
                          )}

                          {item.duration_days && (
                            <div className="text-sm text-muted-foreground mb-1">
                              <strong>Duration:</strong> {item.duration_days} days
                            </div>
                          )}

                          <div className="flex items-center gap-4 text-sm">
                            <span>Qty: {item.quantity}</span>
                            <span>Rate: ${item.rate.toFixed(2)}</span>
                            <span className="font-medium text-primary">
                              Total: ${item.total_amount.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  <Separator />
                  
                  <div className="flex justify-between items-center font-medium text-lg">
                    <span>Grand Total:</span>
                    <span className="text-primary">${calculateTotalCost().toFixed(2)}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}