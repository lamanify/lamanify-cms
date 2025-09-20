import { PatientManagementTabs } from '@/components/patients/PatientManagementTabs';

export interface Patient {
  id: string;
  patient_id?: string;
  first_name: string;
  last_name: string;
  preferred_name?: string;
  date_of_birth: string;
  gender: string;
  phone?: string;
  secondary_phone?: string;
  email?: string;
  address?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  medical_history?: string;
  allergies?: string;
  referral_source?: string;
  visit_reason?: string;
  additional_notes?: string;
  assigned_tier_id?: string;
  created_at: string;
}

export default function Patients() {
  return <PatientManagementTabs />;
}