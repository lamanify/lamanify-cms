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
import { useTierPricing } from '@/hooks/useTierPricing';
import { TierPricingHeader } from './TierPricingHeader';
import { TreatmentItemsTable } from './TreatmentItemsTable';
import { Pill, Stethoscope, Plus, Trash2, Calculator, Package, AlertTriangle } from 'lucide-react';

interface TreatmentPlanTabProps {
  sessionId: string;
  treatmentItems?: TreatmentItem[];
  onUpdate?: () => void;
  patientId?: string;
}

export function TreatmentPlanTab({ sessionId, treatmentItems, onUpdate, patientId }: TreatmentPlanTabProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'medications' | 'services'>('medications');
  const [selectedMedication, setSelectedMedication] = useState<Medication | null>(null);
  const [selectedService, setSelectedService] = useState<MedicalService | null>(null);
  const [patientTier, setPatientTier] = useState<any>(null);
  const [tierLoading, setTierLoading] = useState(false);
  
  const { 
    medications, 
    services, 
    addTreatmentItem, 
    fetchMedications, 
    fetchServices, 
    calculateTotalCost 
  } = useConsultation();
  
  const {
    getPatientTier,
    getServiceWithTierPricing,
    getMedicationWithTierPricing,
    formatPriceWithTier
  } = useTierPricing();

  const [treatmentForm, setTreatmentForm] = useState({
    quantity: 1,
    rate: 0,
    dosage_instructions: '',
    frequency: '',
    duration_days: 7,
    notes: '',
    tierPrice: 0,
    hasTierPrice: false
  });

  useEffect(() => {
    if (searchTerm) {
      fetchMedications(searchTerm);
      fetchServices(searchTerm);
    }
  }, [searchTerm, fetchMedications, fetchServices]);

  // Fetch patient tier on component mount
  useEffect(() => {
    if (patientId) {
      loadPatientTier();
    }
  }, [patientId]);

  const loadPatientTier = async () => {
    if (!patientId) return;
    setTierLoading(true);
    try {
      const patient = await getPatientTier(patientId);
      setPatientTier(patient);
    } catch (error) {
      console.error('Error loading patient tier:', error);
    } finally {
      setTierLoading(false);
    }
  };

  const resetForm = () => {
    setTreatmentForm({
      quantity: 1,
      rate: 0,
      dosage_instructions: '',
      frequency: '',
      duration_days: 7,
      notes: '',
      tierPrice: 0,
      hasTierPrice: false
    });
    setSelectedMedication(null);
    setSelectedService(null);
    setSearchTerm('');
  };

  const handleAddMedication = async () => {
    if (!selectedMedication || !patientTier?.tier) return;

    try {
      const finalRate = treatmentForm.hasTierPrice ? treatmentForm.tierPrice : treatmentForm.rate;
      
      await addTreatmentItem(sessionId, {
        item_type: 'medication',
        medication_id: selectedMedication.id,
        quantity: treatmentForm.quantity,
        rate: finalRate,
        dosage_instructions: treatmentForm.dosage_instructions,
        frequency: treatmentForm.frequency,
        duration_days: treatmentForm.duration_days,
        notes: treatmentForm.notes,
        tier_id_used: patientTier.tier.id,
        tier_price_applied: finalRate,
        original_price: selectedMedication.price_per_unit || 0
      });
      
      resetForm();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding medication:', error);
    }
  };

  const handleAddService = async () => {
    if (!selectedService || !patientTier?.tier) return;

    try {
      const finalRate = treatmentForm.hasTierPrice ? treatmentForm.tierPrice : treatmentForm.rate;
      
      await addTreatmentItem(sessionId, {
        item_type: 'service',
        service_id: selectedService.id,
        quantity: treatmentForm.quantity,
        rate: finalRate,
        notes: treatmentForm.notes,
        tier_id_used: patientTier.tier.id,
        tier_price_applied: finalRate,
        original_price: selectedService.price
      });
      
      resetForm();
      onUpdate?.();
    } catch (error) {
      console.error('Error adding service:', error);
    }
  };

  const calculateItemTotal = () => {
    const rate = treatmentForm.hasTierPrice ? 
      treatmentForm.tierPrice :
      treatmentForm.rate || 
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

  const handleMedicationSelect = async (medication: Medication) => {
    setSelectedMedication(medication);
    
    if (patientTier?.tier) {
      try {
        const medicationWithTierPricing = await getMedicationWithTierPricing(
          medication.id, 
          patientTier.tier.id
        );
        
        if (medicationWithTierPricing?.hasTierPrice) {
          setTreatmentForm(prev => ({
            ...prev,
            rate: medicationWithTierPricing.tierPrice || 0,
            tierPrice: medicationWithTierPricing.tierPrice || 0,
            hasTierPrice: true
          }));
        } else {
          setTreatmentForm(prev => ({
            ...prev,
            rate: medication.price_per_unit || 0,
            tierPrice: 0,
            hasTierPrice: false
          }));
        }
      } catch (error) {
        console.error('Error fetching tier pricing:', error);
        setTreatmentForm(prev => ({
          ...prev,
          rate: medication.price_per_unit || 0,
          tierPrice: 0,
          hasTierPrice: false
        }));
      }
    } else {
      setTreatmentForm(prev => ({
        ...prev,
        rate: medication.price_per_unit || 0,
        tierPrice: 0,
        hasTierPrice: false
      }));
    }
  };

  const handleServiceSelect = async (service: MedicalService) => {
    setSelectedService(service);
    
    if (patientTier?.tier) {
      try {
        const serviceWithTierPricing = await getServiceWithTierPricing(
          service.id, 
          patientTier.tier.id
        );
        
        if (serviceWithTierPricing?.hasTierPrice) {
          setTreatmentForm(prev => ({
            ...prev,
            rate: serviceWithTierPricing.tierPrice || 0,
            tierPrice: serviceWithTierPricing.tierPrice || 0,
            hasTierPrice: true
          }));
        } else {
          setTreatmentForm(prev => ({
            ...prev,
            rate: service.price,
            tierPrice: 0,
            hasTierPrice: false
          }));
        }
      } catch (error) {
        console.error('Error fetching tier pricing:', error);
        setTreatmentForm(prev => ({
          ...prev,
          rate: service.price,
          tierPrice: 0,
          hasTierPrice: false
        }));
      }
    } else {
      setTreatmentForm(prev => ({
        ...prev,
        rate: service.price,
        tierPrice: 0,
        hasTierPrice: false
      }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Tier Pricing Header */}
      <TierPricingHeader
        patientTier={patientTier?.tier}
        patientName={patientTier ? `${patientTier.first_name} ${patientTier.last_name}` : 'Patient'}
        totalAmount={calculateTotalCost()}
        itemCount={treatmentItems?.length || 0}
      />

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
                        onClick={() => handleMedicationSelect(medication)}
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
                        {medication.price_per_unit && patientTier?.tier && (
                          <div className="text-sm">
                            <div className="font-medium text-primary">
                              Base: RM {medication.price_per_unit.toFixed(2)}
                            </div>
                            {selectedMedication?.id === medication.id && treatmentForm.hasTierPrice && (
                              <div className="font-medium text-green-600">
                                {patientTier.tier.tier_name}: RM {treatmentForm.tierPrice.toFixed(2)}
                              </div>
                            )}
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
                          <Label htmlFor="rate">
                            Rate per Unit (RM)
                            {patientTier?.tier && (
                              <span className="text-sm text-muted-foreground ml-2">
                                - {patientTier.tier.tier_name} Tier
                              </span>
                            )}
                          </Label>
                          <Input
                            id="rate"
                            type="number"
                            step="0.01"
                            value={treatmentForm.rate}
                            onChange={(e) =>
                              setTreatmentForm(prev => ({
                                ...prev,
                                rate: parseFloat(e.target.value) || 0,
                                hasTierPrice: false // Manual override
                              }))
                            }
                            className={treatmentForm.hasTierPrice ? 'border-green-300 bg-green-50' : ''}
                          />
                          {!treatmentForm.hasTierPrice && patientTier?.tier && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              No tier-specific price found. Using manual rate.
                            </p>
                          )}
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
                          Total: RM {calculateItemTotal().toFixed(2)}
                          {patientTier?.tier && (
                            <div className="text-xs text-muted-foreground">
                              {patientTier.tier.tier_name} Rate
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={handleAddMedication}
                          disabled={!patientTier?.tier}
                        >
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
                        onClick={() => handleServiceSelect(service)}
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
                        <div className="text-sm">
                          <div className="font-medium text-primary">
                            Base: RM {service.price.toFixed(2)}
                            {service.duration_minutes && ` (${service.duration_minutes} min)`}
                          </div>
                          {selectedService?.id === service.id && treatmentForm.hasTierPrice && patientTier?.tier && (
                            <div className="font-medium text-green-600">
                              {patientTier.tier.tier_name}: RM {treatmentForm.tierPrice.toFixed(2)}
                            </div>
                          )}
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
                          <Label htmlFor="service-rate">
                            Rate (RM)
                            {patientTier?.tier && (
                              <span className="text-sm text-muted-foreground ml-2">
                                - {patientTier.tier.tier_name} Tier
                              </span>
                            )}
                          </Label>
                          <Input
                            id="service-rate"
                            type="number"
                            step="0.01"
                            value={treatmentForm.rate}
                            onChange={(e) =>
                              setTreatmentForm(prev => ({
                                ...prev,
                                rate: parseFloat(e.target.value) || 0,
                                hasTierPrice: false // Manual override
                              }))
                            }
                            className={treatmentForm.hasTierPrice ? 'border-green-300 bg-green-50' : ''}
                          />
                          {!treatmentForm.hasTierPrice && patientTier?.tier && (
                            <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              No tier-specific price found. Using manual rate.
                            </p>
                          )}
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
                          Total: RM {calculateItemTotal().toFixed(2)}
                          {patientTier?.tier && (
                            <div className="text-xs text-muted-foreground">
                              {patientTier.tier.tier_name} Rate
                            </div>
                          )}
                        </div>
                        <Button 
                          onClick={handleAddService}
                          disabled={!patientTier?.tier}
                        >
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