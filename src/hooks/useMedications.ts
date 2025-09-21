import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePriceTiers } from './usePriceTiers';

export interface Medication {
  id: string;
  name: string;
  generic_name?: string;
  brand_name?: string;
  category?: string;
  groups?: string[]; // medicine groups/tags
  strength_options?: string[];
  dosage_forms?: string[];
  side_effects?: string[];
  contraindications?: string[];
  interactions?: string[];
  price_per_unit?: number;
  cost_price?: number;
  stock_level?: number;
  remarks?: string;
  enable_dosage_settings?: boolean;
  unit_of_measure?: string;
  created_at: string;
  updated_at: string;
}

export interface DosageTemplate {
  id?: string;
  medication_id: string;
  dosage_amount?: number;
  dosage_unit?: string;
  instruction?: string;
  precaution?: string;
  frequency?: string;
  duration_value?: number;
  duration_unit?: string;
  indication?: string;
  dispense_quantity?: number;
}

export interface MedicationWithPricing extends Medication {
  pricing: { [tierId: string]: number };
  dosage_template?: DosageTemplate;
  average_cost?: number;
}

export function useMedications() {
  const [medications, setMedications] = useState<MedicationWithPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { priceTiers } = usePriceTiers();

  const fetchMedications = async () => {
    try {
      setLoading(true);
      const { data: medicationsData, error } = await supabase
        .from('medications')
        .select(`
          *,
          medication_pricing(
            tier_id,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const medicationsWithPricing = medicationsData?.map(medication => {
        const pricing: { [tierId: string]: number } = {};
        medication.medication_pricing?.forEach((mp: any) => {
          pricing[mp.tier_id] = mp.price;
        });

        // Remove the nested arrays from the medication object
        const { medication_pricing, ...cleanMedication } = medication;
        
        return {
          ...cleanMedication,
          pricing,
          dosage_template: undefined,
          average_cost: cleanMedication.average_cost || 0
        } as MedicationWithPricing;
      }) || [];

      setMedications(medicationsWithPricing);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch medications"
      });
    } finally {
      setLoading(false);
    }
  };

  const createMedication = async (medicationData: {
    name: string;
    generic_name?: string;
    brand_name?: string;
    category?: string;
    groups?: string[];
    strength_options?: string[];
    dosage_forms?: string[];
    side_effects?: string[];
    contraindications?: string[];
    interactions?: string[];
    cost_price?: number;
    stock_level?: number;
    remarks?: string;
    enable_dosage_settings?: boolean;
    unit_of_measure?: string;
    pricing: { [tierId: string]: number };
    dosage_template?: DosageTemplate;
  }) => {
    try {
      if (priceTiers.length === 0) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "Create price tiers first in Settings"
        });
        return false;
      }

      // Create the medication first
      const { data: medication, error: medicationError } = await supabase
        .from('medications')
        .insert([{
          name: medicationData.name,
          generic_name: medicationData.generic_name,
          brand_name: medicationData.brand_name,
          category: medicationData.category,
          groups: medicationData.groups,
          strength_options: medicationData.strength_options,
          dosage_forms: medicationData.dosage_forms,
          side_effects: medicationData.side_effects,
          contraindications: medicationData.contraindications,
          interactions: medicationData.interactions,
          cost_price: medicationData.cost_price,
          stock_level: medicationData.stock_level,
          remarks: medicationData.remarks,
          enable_dosage_settings: medicationData.enable_dosage_settings,
          unit_of_measure: medicationData.unit_of_measure,
          price_per_unit: Object.values(medicationData.pricing)[0] || 0 // Keep for backwards compatibility
        }])
        .select()
        .single();

      if (medicationError) throw medicationError;

      // Create pricing entries
      const pricingEntries = Object.entries(medicationData.pricing).map(([tierId, price]) => ({
        medication_id: medication.id,
        tier_id: tierId,
        price: price
      }));

      const { error: pricingError } = await supabase
        .from('medication_pricing')
        .insert(pricingEntries);

      if (pricingError) throw pricingError;

      // Create dosage template if enabled and provided
      if (medicationData.enable_dosage_settings && medicationData.dosage_template) {
        const { error: dosageError } = await supabase
          .from('medication_dosage_templates')
          .insert([{
            medication_id: medication.id,
            ...medicationData.dosage_template
          }]);

        if (dosageError) throw dosageError;
      }

      await fetchMedications();
      toast({
        title: "Success",
        description: "Medication created successfully"
      });
      return true;
    } catch (error) {
      console.error('Error creating medication:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create medication"
      });
      return false;
    }
  };

  const updateMedication = async (id: string, medicationData: {
    name?: string;
    generic_name?: string;
    brand_name?: string;
    category?: string;
    groups?: string[];
    strength_options?: string[];
    dosage_forms?: string[];
    side_effects?: string[];
    contraindications?: string[];
    interactions?: string[];
    cost_price?: number;
    stock_level?: number;
    remarks?: string;
    enable_dosage_settings?: boolean;
    unit_of_measure?: string;
    pricing?: { [tierId: string]: number };
    dosage_template?: DosageTemplate;
  }) => {
    try {
      // Update the medication
      const { error: medicationError } = await supabase
        .from('medications')
        .update({
          name: medicationData.name,
          generic_name: medicationData.generic_name,
          brand_name: medicationData.brand_name,
          category: medicationData.category,
          groups: medicationData.groups,
          strength_options: medicationData.strength_options,
          dosage_forms: medicationData.dosage_forms,
          side_effects: medicationData.side_effects,
          contraindications: medicationData.contraindications,
          interactions: medicationData.interactions,
          cost_price: medicationData.cost_price,
          stock_level: medicationData.stock_level,
          remarks: medicationData.remarks,
          enable_dosage_settings: medicationData.enable_dosage_settings,
          unit_of_measure: medicationData.unit_of_measure,
          price_per_unit: medicationData.pricing ? Object.values(medicationData.pricing)[0] || 0 : undefined
        })
        .eq('id', id);

      if (medicationError) throw medicationError;

      // Update pricing if provided
      if (medicationData.pricing) {
        // Delete existing pricing
        await supabase
          .from('medication_pricing')
          .delete()
          .eq('medication_id', id);

        // Insert new pricing
        const pricingEntries = Object.entries(medicationData.pricing).map(([tierId, price]) => ({
          medication_id: id,
          tier_id: tierId,
          price: price
        }));

        const { error: pricingError } = await supabase
          .from('medication_pricing')
          .insert(pricingEntries);

        if (pricingError) throw pricingError;
      }

      // Update dosage template if provided
      if (medicationData.enable_dosage_settings !== undefined) {
        // Delete existing dosage template
        await supabase
          .from('medication_dosage_templates')
          .delete()
          .eq('medication_id', id);

        // Create new dosage template if enabled and provided
        if (medicationData.enable_dosage_settings && medicationData.dosage_template) {
          const { error: dosageError } = await supabase
            .from('medication_dosage_templates')
            .insert([{
              medication_id: id,
              ...medicationData.dosage_template
            }]);

          if (dosageError) throw dosageError;
        }
      }

      await fetchMedications();
      toast({
        title: "Success",
        description: "Medication updated successfully"
      });
      return true;
    } catch (error) {
      console.error('Error updating medication:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update medication"
      });
      return false;
    }
  };

  const deleteMedication = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medications')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setMedications(prev => prev.filter(medication => medication.id !== id));
      toast({
        title: "Success",
        description: "Medication deleted successfully"
      });
      return true;
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete medication"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchMedications();
  }, []);

  return {
    medications,
    loading,
    createMedication,
    updateMedication,
    deleteMedication,
    refetch: fetchMedications
  };
}