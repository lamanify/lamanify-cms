import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AppointmentReminder {
  appointment_id: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  doctor_name: string;
  appointment_date: string;
  appointment_time: string;
  clinic_name: string;
}

interface ReminderRequest {
  type: 'schedule' | 'send_now';
  appointment_id?: string;
  reminder_type?: 'sms' | 'email' | 'whatsapp';
  hours_before?: number;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { type, appointment_id, reminder_type, hours_before }: ReminderRequest = await req.json();

    if (type === 'schedule') {
      // Schedule reminders for upcoming appointments
      const result = await scheduleUpcomingReminders(supabase);
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    } else if (type === 'send_now' && appointment_id) {
      // Send immediate reminder for specific appointment
      const result = await sendImmediateReminder(supabase, appointment_id, reminder_type || 'email');
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid request type' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error: any) {
    console.error('Error in appointment-reminders function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      }
    );
  }
});

async function scheduleUpcomingReminders(supabase: any) {
  console.log('Scheduling reminders for upcoming appointments...');
  
  // Get appointments in the next 48 hours that need reminders
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date();
  dayAfter.setDate(dayAfter.getDate() + 2);
  
  const { data: appointments, error } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      duration_minutes,
      reason,
      patients (
        first_name,
        last_name,
        phone,
        email
      ),
      profiles (
        first_name,
        last_name
      )
    `)
    .eq('status', 'scheduled')
    .gte('appointment_date', tomorrow.toISOString().split('T')[0])
    .lte('appointment_date', dayAfter.toISOString().split('T')[0]);

  if (error) {
    console.error('Error fetching appointments:', error);
    throw error;
  }

  console.log(`Found ${appointments?.length || 0} appointments to process`);

  const reminderResults = [];
  
  for (const appointment of appointments || []) {
    try {
      // Check if reminder already sent
      const { data: existingReminder } = await supabase
        .from('patient_activities')
        .select('id')
        .eq('patient_id', appointment.patients.id)
        .eq('activity_type', 'reminder_sent')
        .eq('related_record_id', appointment.id)
        .eq('activity_date', new Date().toISOString().split('T')[0]);

      if (existingReminder && existingReminder.length > 0) {
        console.log(`Reminder already sent for appointment ${appointment.id}`);
        continue;
      }

      // Send reminder
      const reminderData: AppointmentReminder = {
        appointment_id: appointment.id,
        patient_name: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
        patient_phone: appointment.patients.phone,
        patient_email: appointment.patients.email,
        doctor_name: `Dr. ${appointment.profiles.first_name} ${appointment.profiles.last_name}`,
        appointment_date: appointment.appointment_date,
        appointment_time: appointment.appointment_time,
        clinic_name: 'Your Clinic' // TODO: Get from clinic settings
      };

      // Try email first, then SMS if no email
      let reminderSent = false;
      let reminderMethod = '';

      if (appointment.patients.email) {
        const emailResult = await sendEmailReminder(reminderData);
        if (emailResult.success) {
          reminderSent = true;
          reminderMethod = 'email';
        }
      }

      if (!reminderSent && appointment.patients.phone) {
        // SMS reminder logic would go here
        // For now, we'll log that SMS would be sent
        console.log(`Would send SMS reminder to ${appointment.patients.phone}`);
        reminderSent = true;
        reminderMethod = 'sms';
      }

      if (reminderSent) {
        // Log the reminder in patient activities
        await supabase
          .from('patient_activities')
          .insert({
            patient_id: appointment.patients.id,
            activity_type: 'reminder_sent',
            title: 'Appointment Reminder Sent',
            content: `Reminder sent via ${reminderMethod} for appointment on ${appointment.appointment_date} at ${appointment.appointment_time}`,
            related_record_id: appointment.id,
            metadata: {
              reminder_method: reminderMethod,
              appointment_date: appointment.appointment_date,
              appointment_time: appointment.appointment_time,
              doctor_name: reminderData.doctor_name
            }
          });

        reminderResults.push({
          appointment_id: appointment.id,
          patient_name: reminderData.patient_name,
          method: reminderMethod,
          status: 'sent'
        });
      }

    } catch (error) {
      console.error(`Error processing reminder for appointment ${appointment.id}:`, error);
      reminderResults.push({
        appointment_id: appointment.id,
        status: 'failed',
        error: error.message
      });
    }
  }

  return {
    message: 'Reminder scheduling completed',
    processed: appointments?.length || 0,
    sent: reminderResults.filter(r => r.status === 'sent').length,
    failed: reminderResults.filter(r => r.status === 'failed').length,
    results: reminderResults
  };
}

async function sendImmediateReminder(supabase: any, appointmentId: string, reminderType: string) {
  console.log(`Sending immediate ${reminderType} reminder for appointment ${appointmentId}`);
  
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(`
      id,
      appointment_date,
      appointment_time,
      patients (
        id,
        first_name,
        last_name,
        phone,
        email
      ),
      profiles (
        first_name,
        last_name
      )
    `)
    .eq('id', appointmentId)
    .single();

  if (error || !appointment) {
    throw new Error('Appointment not found');
  }

  const reminderData: AppointmentReminder = {
    appointment_id: appointment.id,
    patient_name: `${appointment.patients.first_name} ${appointment.patients.last_name}`,
    patient_phone: appointment.patients.phone,
    patient_email: appointment.patients.email,
    doctor_name: `Dr. ${appointment.profiles.first_name} ${appointment.profiles.last_name}`,
    appointment_date: appointment.appointment_date,
    appointment_time: appointment.appointment_time,
    clinic_name: 'Your Clinic'
  };

  let result = { success: false, message: '' };

  if (reminderType === 'email' && appointment.patients.email) {
    result = await sendEmailReminder(reminderData);
  } else if (reminderType === 'sms' && appointment.patients.phone) {
    // SMS logic would go here
    result = { success: true, message: 'SMS reminder sent' };
    console.log(`Would send SMS to ${appointment.patients.phone}`);
  }

  if (result.success) {
    // Log the reminder
    await supabase
      .from('patient_activities')
      .insert({
        patient_id: appointment.patients.id,
        activity_type: 'reminder_sent',
        title: 'Manual Reminder Sent',
        content: `Manual reminder sent via ${reminderType}`,
        related_record_id: appointment.id,
        metadata: {
          reminder_method: reminderType,
          manual_send: true
        }
      });
  }

  return result;
}

async function sendEmailReminder(reminderData: AppointmentReminder) {
  // Simple email reminder - in production, use a proper email service
  console.log('Sending email reminder:', {
    to: reminderData.patient_email,
    patient: reminderData.patient_name,
    appointment: `${reminderData.appointment_date} at ${reminderData.appointment_time}`,
    doctor: reminderData.doctor_name
  });

  // TODO: Integrate with actual email service (Resend, SendGrid, etc.)
  // For now, simulate successful email send
  return {
    success: true,
    message: 'Email reminder sent successfully'
  };
}