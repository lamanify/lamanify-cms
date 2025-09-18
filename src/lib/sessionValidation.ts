import { z } from 'zod';

// Validation schema for prescribed items
const PrescribedItemSchema = z.object({
  type: z.enum(['medication', 'service']),
  name: z.string().min(1, 'Item name is required'),
  quantity: z.number().min(1, 'Quantity must be at least 1'),
  dosage: z.string().optional(),
  frequency: z.string().optional(),
  duration: z.string().optional(),
  price: z.number().min(0, 'Price must be non-negative'),
  instructions: z.string().optional(),
  rate: z.number().min(0, 'Rate must be non-negative'),
});

// Validation schema for queue session data
export const QueueSessionDataSchema = z.object({
  consultation_notes: z.string().optional(),
  diagnosis: z.string().optional(),
  prescribed_items: z.array(PrescribedItemSchema).optional().default([]),
  completed_at: z.string().optional(),
  doctor_id: z.string().uuid().optional(),
  last_updated: z.string().optional(),
  queue_number: z.string().optional(),
  assigned_doctor_id: z.string().uuid().optional(),
  registration_timestamp: z.string().optional(),
});

export type ValidatedQueueSessionData = z.infer<typeof QueueSessionDataSchema>;

// Validation function
export function validateSessionData(data: any): { isValid: boolean; errors?: string[]; data?: ValidatedQueueSessionData } {
  try {
    const validatedData = QueueSessionDataSchema.parse(data);
    return { isValid: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { isValid: false, errors };
    }
    return { isValid: false, errors: ['Unknown validation error'] };
  }
}

// Completeness check
export function checkDataCompleteness(data: ValidatedQueueSessionData): { isComplete: boolean; missing: string[] } {
  const missing: string[] = [];
  
  // Check for essential fields based on session state
  if (!data.consultation_notes || data.consultation_notes.trim().length === 0) {
    missing.push('consultation_notes');
  }
  
  if (!data.diagnosis || data.diagnosis.trim().length === 0) {
    missing.push('diagnosis');
  }
  
  if (!data.doctor_id) {
    missing.push('doctor_id');
  }
  
  // If there are prescribed items, validate their completeness
  if (data.prescribed_items && data.prescribed_items.length > 0) {
    data.prescribed_items.forEach((item, index) => {
      if (item.type === 'medication' && (!item.dosage || !item.frequency)) {
        missing.push(`prescribed_items[${index}].dosage_or_frequency`);
      }
    });
  }
  
  return {
    isComplete: missing.length === 0,
    missing
  };
}