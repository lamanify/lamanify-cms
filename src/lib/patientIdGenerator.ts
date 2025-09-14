import { supabase } from '@/integrations/supabase/client';

/**
 * Generates a unique numeric patient ID following HubSpot pattern
 * Format: 10-13 digits using timestamp + random number
 * Example: "1672531200123"
 */
export async function generatePatientId(): Promise<string> {
  const maxRetries = 5;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    // Generate ID using timestamp + random number approach
    const timestamp = Math.floor(Date.now() / 1000); // Unix timestamp (10 digits)
    const randomSuffix = Math.floor(Math.random() * 1000); // 3 digits (000-999)
    const patientId = `${timestamp}${randomSuffix.toString().padStart(3, '0')}`;
    
    // Check if ID already exists in database
    const isUnique = await checkPatientIdUnique(patientId);
    
    if (isUnique) {
      return patientId;
    }
    
    // If collision detected, wait a short time before retry
    if (attempt < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 100 * attempt));
    }
  }
  
  throw new Error('Failed to generate unique patient ID after maximum retries');
}

/**
 * Checks if a patient ID is unique in the database
 */
export async function checkPatientIdUnique(patientId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('patient_id')
      .eq('patient_id', patientId)
      .maybeSingle();
    
    if (error) {
      console.error('Error checking patient ID uniqueness:', error);
      throw new Error('Database error while checking patient ID uniqueness');
    }
    
    // ID is unique if no record found
    return data === null;
  } catch (error) {
    console.error('Error in checkPatientIdUnique:', error);
    throw error;
  }
}

/**
 * Validates patient ID format (10-13 digits)
 */
export function validatePatientIdFormat(patientId: string): boolean {
  const pattern = /^\d{10,13}$/;
  return pattern.test(patientId);
}

/**
 * Finds a patient by their numeric patient ID
 */
export async function findPatientByPatientId(patientId: string) {
  try {
    const { data, error } = await supabase
      .from('patients')
      .select('*')
      .eq('patient_id', patientId)
      .maybeSingle();
    
    if (error) {
      console.error('Error finding patient by ID:', error);
      throw new Error('Database error while finding patient');
    }
    
    return data;
  } catch (error) {
    console.error('Error in findPatientByPatientId:', error);
    throw error;
  }
}