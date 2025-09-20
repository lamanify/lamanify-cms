import { Patient } from '@/pages/Patients';

interface PatientHistoryTabProps {
  patient: Patient;
  onRefresh: () => void;
}

export function PatientHistoryTab({ patient, onRefresh }: PatientHistoryTabProps) {
  return (
    <div className="p-6">
      <p>History tab content - implementation in progress</p>
    </div>
  );
}