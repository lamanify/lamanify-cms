import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePriceTiers, PriceTier } from './usePriceTiers';

export interface TierPricing {
  serviceId?: string;
  medicationId?: string;
  tierId: string;
  price: number;
  tierName: string;
}

export interface PatientWithTier {
  id: string;
  first_name: string;
  last_name: string;
  assigned_tier_id?: string;
  tier?: PriceTier;
}

export function useTierPricing() {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { priceTiers } = usePriceTiers();

  const getPatientTier = async (patientId: string): Promise<PatientWithTier | null> => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select(`
          *,
          tier:assigned_tier_id(*)
        `)
        .eq('id', patientId)
        .single();

      if (error) throw error;
      return data as PatientWithTier;
    } catch (error) {
      console.error('Error fetching patient tier:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch patient pricing tier"
      });
      return null;
    }
  };

  const getServicePriceForTier = async (serviceId: string, tierId: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from('service_pricing')
        .select('price')
        .eq('service_id', serviceId)
        .eq('tier_id', tierId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No price found for this tier
          return null;
        }
        throw error;
      }

      return data.price;
    } catch (error) {
      console.error('Error fetching service price:', error);
      return null;
    }
  };

  const getMedicationPriceForTier = async (medicationId: string, tierId: string): Promise<number | null> => {
    try {
      const { data, error } = await supabase
        .from('medication_pricing')
        .select('price')
        .eq('medication_id', medicationId)
        .eq('tier_id', tierId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No price found for this tier
          return null;
        }
        throw error;
      }

      return data.price;
    } catch (error) {
      console.error('Error fetching medication price:', error);
      return null;
    }
  };

  const getServiceWithTierPricing = async (serviceId: string, tierId: string) => {
    try {
      const [serviceResult, priceResult] = await Promise.all([
        supabase.from('medical_services').select('*').eq('id', serviceId).single(),
        getServicePriceForTier(serviceId, tierId)
      ]);

      if (serviceResult.error) throw serviceResult.error;

      const tier = priceTiers.find(t => t.id === tierId);
      
      return {
        ...serviceResult.data,
        tierPrice: priceResult,
        tierName: tier?.tier_name || 'Unknown Tier',
        hasTierPrice: priceResult !== null
      };
    } catch (error) {
      console.error('Error fetching service with tier pricing:', error);
      return null;
    }
  };

  const getMedicationWithTierPricing = async (medicationId: string, tierId: string) => {
    try {
      const [medicationResult, priceResult] = await Promise.all([
        supabase.from('medications').select('*').eq('id', medicationId).single(),
        getMedicationPriceForTier(medicationId, tierId)
      ]);

      if (medicationResult.error) throw medicationResult.error;

      const tier = priceTiers.find(t => t.id === tierId);
      
      return {
        ...medicationResult.data,
        tierPrice: priceResult,
        tierName: tier?.tier_name || 'Unknown Tier',
        hasTierPrice: priceResult !== null
      };
    } catch (error) {
      console.error('Error fetching medication with tier pricing:', error);
      return null;
    }
  };

  const assignPatientTier = async (patientId: string, tierId: string) => {
    try {
      const { data: user } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('patients')
        .update({
          assigned_tier_id: tierId,
          tier_assigned_at: new Date().toISOString(),
          tier_assigned_by: user.user?.id
        })
        .eq('id', patientId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Patient pricing tier assigned successfully"
      });
      return true;
    } catch (error) {
      console.error('Error assigning patient tier:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to assign pricing tier"
      });
      return false;
    }
  };

  const formatPriceWithTier = (price: number, tierName: string) => {
    return `RM ${price.toFixed(2)} (${tierName} Rate)`;
  };

  return {
    loading,
    getPatientTier,
    getServicePriceForTier,
    getMedicationPriceForTier,
    getServiceWithTierPricing,
    getMedicationWithTierPricing,
    assignPatientTier,
    formatPriceWithTier
  };
}