import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { usePriceTiers } from './usePriceTiers';

export interface Service {
  id: string;
  name: string;
  category: string;
  description?: string;
  duration_minutes?: number;
  price: number;
  requires_equipment?: boolean;
  preparation_notes?: string;
  created_at: string;
  updated_at: string;
}

export interface ServiceWithPricing extends Service {
  pricing: { [tierId: string]: number };
}

export function useServices() {
  const [services, setServices] = useState<ServiceWithPricing[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const { priceTiers } = usePriceTiers();

  const fetchServices = async () => {
    try {
      setLoading(true);
      const { data: servicesData, error } = await supabase
        .from('medical_services')
        .select(`
          *,
          service_pricing(
            tier_id,
            price
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const servicesWithPricing = servicesData?.map(service => {
        const pricing: { [tierId: string]: number } = {};
        service.service_pricing?.forEach((sp: any) => {
          pricing[sp.tier_id] = sp.price;
        });
        
        return {
          ...service,
          pricing
        };
      }) || [];

      setServices(servicesWithPricing);
    } catch (error) {
      console.error('Error fetching services:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch services"
      });
    } finally {
      setLoading(false);
    }
  };

  const createService = async (serviceData: {
    name: string;
    category: string;
    description?: string;
    duration_minutes?: number;
    requires_equipment?: boolean;
    preparation_notes?: string;
    pricing: { [tierId: string]: number };
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

      // Create the service first
      const { data: service, error: serviceError } = await supabase
        .from('medical_services')
        .insert([{
          name: serviceData.name,
          category: serviceData.category,
          description: serviceData.description,
          duration_minutes: serviceData.duration_minutes,
          price: Object.values(serviceData.pricing)[0] || 0, // Keep the main price field for backwards compatibility
          requires_equipment: serviceData.requires_equipment,
          preparation_notes: serviceData.preparation_notes
        }])
        .select()
        .single();

      if (serviceError) throw serviceError;

      // Create pricing entries
      const pricingEntries = Object.entries(serviceData.pricing).map(([tierId, price]) => ({
        service_id: service.id,
        tier_id: tierId,
        price: price
      }));

      const { error: pricingError } = await supabase
        .from('service_pricing')
        .insert(pricingEntries);

      if (pricingError) throw pricingError;

      await fetchServices();
      toast({
        title: "Success",
        description: "Service created successfully"
      });
      return true;
    } catch (error) {
      console.error('Error creating service:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create service"
      });
      return false;
    }
  };

  const updateService = async (id: string, serviceData: {
    name?: string;
    category?: string;
    description?: string;
    duration_minutes?: number;
    requires_equipment?: boolean;
    preparation_notes?: string;
    pricing?: { [tierId: string]: number };
  }) => {
    try {
      // Update the service
      const { error: serviceError } = await supabase
        .from('medical_services')
        .update({
          name: serviceData.name,
          category: serviceData.category,
          description: serviceData.description,
          duration_minutes: serviceData.duration_minutes,
          price: serviceData.pricing ? Object.values(serviceData.pricing)[0] || 0 : undefined,
          requires_equipment: serviceData.requires_equipment,
          preparation_notes: serviceData.preparation_notes
        })
        .eq('id', id);

      if (serviceError) throw serviceError;

      // Update pricing if provided
      if (serviceData.pricing) {
        // Delete existing pricing
        await supabase
          .from('service_pricing')
          .delete()
          .eq('service_id', id);

        // Insert new pricing
        const pricingEntries = Object.entries(serviceData.pricing).map(([tierId, price]) => ({
          service_id: id,
          tier_id: tierId,
          price: price
        }));

        const { error: pricingError } = await supabase
          .from('service_pricing')
          .insert(pricingEntries);

        if (pricingError) throw pricingError;
      }

      await fetchServices();
      toast({
        title: "Success",
        description: "Service updated successfully"
      });
      return true;
    } catch (error) {
      console.error('Error updating service:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update service"
      });
      return false;
    }
  };

  const deleteService = async (id: string) => {
    try {
      const { error } = await supabase
        .from('medical_services')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setServices(prev => prev.filter(service => service.id !== id));
      toast({
        title: "Success",
        description: "Service deleted successfully"
      });
      return true;
    } catch (error) {
      console.error('Error deleting service:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete service"
      });
      return false;
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  return {
    services,
    loading,
    createService,
    updateService,
    deleteService,
    refetch: fetchServices
  };
}