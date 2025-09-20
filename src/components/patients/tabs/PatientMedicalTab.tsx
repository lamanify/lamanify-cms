import { Patient } from '@/pages/Patients';

interface PatientMedicalTabProps {
  patient?: Patient | null;
  onSave: () => void;
}

export function PatientMedicalTab({ patient, onSave }: PatientMedicalTabProps) {
  return (
    <div className="p-6">
      <p>Medical tab content - implementation in progress</p>
    </div>
  );
}