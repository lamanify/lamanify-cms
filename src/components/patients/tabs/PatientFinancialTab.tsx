import { Patient } from '@/pages/Patients';

interface PatientFinancialTabProps {
  patient: Patient;
  onSave: () => void;
}

export function PatientFinancialTab({ patient, onSave }: PatientFinancialTabProps) {
  return (
    <div className="p-6">
      <p>Financial tab content - implementation in progress</p>
    </div>
  );
}