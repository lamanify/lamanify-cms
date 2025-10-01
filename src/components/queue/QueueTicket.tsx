import { useHeaderSettings } from '@/hooks/useHeaderSettings';

interface QueueTicketProps {
  queueNumber: string;
  patientName: string;
  timestamp: Date;
  estimatedWait?: number;
}

export function QueueTicket({ queueNumber, patientName, timestamp, estimatedWait }: QueueTicketProps) {
  const { headerSettings } = useHeaderSettings();

  return (
    <div className="ticket-container">
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .ticket-container, .ticket-container * {
            visibility: visible;
          }
          .ticket-container {
            position: absolute;
            left: 0;
            top: 0;
            width: 58mm;
            margin: 0;
            padding: 5mm;
          }
          @page {
            size: 58mm auto;
            margin: 0;
          }
        }
        
        .ticket-container {
          width: 58mm;
          font-family: 'Courier New', monospace;
          padding: 5mm;
          background: white;
        }
        
        .ticket-header {
          text-align: center;
          border-bottom: 2px dashed #000;
          padding-bottom: 8px;
          margin-bottom: 12px;
        }
        
        .clinic-name {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 4px;
        }
        
        .clinic-info {
          font-size: 10px;
          line-height: 1.4;
          margin: 2px 0;
        }
        
        .queue-section {
          text-align: center;
          margin: 16px 0;
        }
        
        .queue-label {
          font-size: 14px;
          font-weight: bold;
          margin-bottom: 8px;
        }
        
        .queue-number {
          font-size: 48px;
          font-weight: bold;
          letter-spacing: 4px;
          border: 3px solid #000;
          padding: 12px;
          margin: 8px 0;
        }
        
        .patient-info {
          margin: 12px 0;
          font-size: 12px;
        }
        
        .info-row {
          display: flex;
          justify-content: space-between;
          margin: 4px 0;
        }
        
        .info-label {
          font-weight: bold;
        }
        
        .wait-info {
          text-align: center;
          font-size: 11px;
          margin: 12px 0;
          padding: 8px;
          background: #f5f5f5;
          border-radius: 4px;
        }
        
        .ticket-footer {
          text-align: center;
          border-top: 2px dashed #000;
          padding-top: 8px;
          margin-top: 12px;
          font-size: 10px;
        }
        
        .thank-you {
          font-weight: bold;
          margin-bottom: 4px;
        }
      `}</style>
      
      <div className="ticket-header">
        <div className="clinic-name">
          {headerSettings?.clinic_name || 'Clinic'}
        </div>
        {headerSettings?.address && (
          <div className="clinic-info">{headerSettings.address}</div>
        )}
        {headerSettings?.phone && (
          <div className="clinic-info">Tel: {headerSettings.phone}</div>
        )}
      </div>

      <div className="queue-section">
        <div className="queue-label">QUEUE NUMBER</div>
        <div className="queue-number">{queueNumber}</div>
      </div>

      <div className="patient-info">
        <div className="info-row">
          <span className="info-label">Patient:</span>
          <span>{patientName}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Date:</span>
          <span>{timestamp.toLocaleDateString()}</span>
        </div>
        <div className="info-row">
          <span className="info-label">Time:</span>
          <span>{timestamp.toLocaleTimeString()}</span>
        </div>
      </div>

      {estimatedWait && estimatedWait > 0 && (
        <div className="wait-info">
          Estimated Wait: {estimatedWait} minutes
        </div>
      )}

      <div className="ticket-footer">
        <div className="thank-you">PLEASE WAIT TO BE CALLED</div>
        <div>Thank you for your patience</div>
      </div>
    </div>
  );
}
