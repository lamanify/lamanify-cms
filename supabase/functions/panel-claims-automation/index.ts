import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AutomationTask {
  type: 'status_progression' | 'scheduled_generation' | 'approval_timeout' | 'notification';
  data: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { task } = await req.json() as { task: AutomationTask };

    console.log('Processing automation task:', task.type);

    switch (task.type) {
      case 'status_progression':
        await processStatusProgression(supabaseClient);
        break;
      case 'scheduled_generation':
        await processScheduledGeneration(supabaseClient);
        break;
      case 'approval_timeout':
        await processApprovalTimeouts(supabaseClient);
        break;
      case 'notification':
        await processNotifications(supabaseClient, task.data);
        break;
      default:
        throw new Error(`Unknown task type: ${task.type}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: any) {
    console.error('Error processing automation task:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function processStatusProgression(supabase: any) {
  console.log('Processing status progression rules...');
  
  // Get active time-based rules
  const { data: rules, error: rulesError } = await supabase
    .from('panel_claims_status_rules')
    .select('*')
    .eq('is_active', true)
    .eq('trigger_type', 'time_based')
    .eq('auto_execute', true);

  if (rulesError) throw rulesError;

  for (const rule of rules || []) {
    // Find claims that match the rule conditions
    const delayHours = rule.delay_hours || 0;
    const targetTime = new Date();
    targetTime.setHours(targetTime.getHours() - delayHours);

    const { data: claims, error: claimsError } = await supabase
      .from('panel_claims')
      .select('*')
      .eq('status', rule.from_status)
      .lt('updated_at', targetTime.toISOString());

    if (claimsError) throw claimsError;

    for (const claim of claims || []) {
      // Update claim status
      const { error: updateError } = await supabase
        .from('panel_claims')
        .update({ 
          status: rule.to_status,
          updated_at: new Date().toISOString(),
          metadata: {
            ...claim.metadata,
            automated_transition: {
              rule_id: rule.id,
              rule_name: rule.rule_name,
              executed_at: new Date().toISOString()
            }
          }
        })
        .eq('id', claim.id);

      if (updateError) {
        console.error('Error updating claim status:', updateError);
        continue;
      }

      // Send notification if enabled
      if (rule.notification_enabled) {
        await createNotification(supabase, {
          claim_id: claim.id,
          notification_type: 'status_change',
          recipient_type: 'staff',
          subject: `Claim ${claim.claim_number} status updated`,
          message: `Claim status automatically changed from ${rule.from_status} to ${rule.to_status} based on rule: ${rule.rule_name}`
        });
      }

      console.log(`Updated claim ${claim.claim_number} from ${rule.from_status} to ${rule.to_status}`);
    }
  }
}

async function processScheduledGeneration(supabase: any) {
  console.log('Processing scheduled claim generation...');
  
  const now = new Date();
  
  // Get schedules due for generation
  const { data: schedules, error: schedulesError } = await supabase
    .from('panel_claims_schedules')
    .select(`
      *,
      panels(*)
    `)
    .eq('is_active', true)
    .lt('next_generation_at', now.toISOString());

  if (schedulesError) throw schedulesError;

  for (const schedule of schedules || []) {
    try {
      // Calculate billing period
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(endDate.getDate() - schedule.billing_period_days);

      // Get billing records for the period
      const { data: billingRecords, error: billingError } = await supabase
        .from('billing')
        .select('*')
        .eq('panel_id', schedule.panel_id)
        .gte('created_at', startDate.toISOString())
        .lte('created_at', endDate.toISOString())
        .eq('claim_status', 'pending');

      if (billingError) throw billingError;

      if (billingRecords && billingRecords.length > 0) {
        // Generate claim number
        const { data: claimNumber } = await supabase.rpc('generate_claim_number');
        
        // Calculate totals
        const totalAmount = billingRecords.reduce((sum: number, record: any) => sum + (record.amount || 0), 0);
        
        // Create claim
        const { data: claim, error: claimError } = await supabase
          .from('panel_claims')
          .insert({
            claim_number: claimNumber,
            panel_id: schedule.panel_id,
            billing_period_start: startDate.toISOString().split('T')[0],
            billing_period_end: endDate.toISOString().split('T')[0],
            total_amount: totalAmount,
            total_items: billingRecords.length,
            status: schedule.auto_submit ? 'submitted' : 'draft',
            submitted_at: schedule.auto_submit ? new Date().toISOString() : null,
            notes: `Automatically generated from schedule: ${schedule.schedule_name}`,
            metadata: {
              generated_from_schedule: {
                schedule_id: schedule.id,
                schedule_name: schedule.schedule_name,
                generated_at: new Date().toISOString()
              }
            }
          })
          .select()
          .single();

        if (claimError) throw claimError;

        // Create claim items
        const claimItems = billingRecords.map((record: any) => ({
          claim_id: claim.id,
          billing_id: record.id,
          item_amount: record.amount,
          claim_amount: record.amount,
          status: 'included'
        }));

        const { error: itemsError } = await supabase
          .from('panel_claim_items')
          .insert(claimItems);

        if (itemsError) throw itemsError;

        console.log(`Generated claim ${claimNumber} for panel ${schedule.panel_id} with ${billingRecords.length} items`);
      }

      // Update next generation time
      const nextGeneration = calculateNextGeneration(schedule);
      const { error: updateError } = await supabase
        .from('panel_claims_schedules')
        .update({
          last_generated_at: new Date().toISOString(),
          next_generation_at: nextGeneration.toISOString()
        })
        .eq('id', schedule.id);

      if (updateError) throw updateError;

    } catch (error) {
      console.error(`Error processing schedule ${schedule.id}:`, error);
      // Continue with other schedules
    }
  }
}

async function processApprovalTimeouts(supabase: any) {
  console.log('Processing approval timeouts...');
  
  const now = new Date();
  
  // Get expired approval requests
  const { data: expiredRequests, error } = await supabase
    .from('panel_claims_approval_requests')
    .select(`
      *,
      panel_claims_approval_workflows(escalation_role)
    `)
    .eq('status', 'pending')
    .lt('expires_at', now.toISOString());

  if (error) throw error;

  for (const request of expiredRequests || []) {
    const workflow = request.panel_claims_approval_workflows;
    
    if (workflow?.escalation_role) {
      // Escalate to higher role
      const { error: escalateError } = await supabase
        .from('panel_claims_approval_requests')
        .update({
          status: 'escalated',
          escalated_at: new Date().toISOString()
        })
        .eq('id', request.id);

      if (escalateError) {
        console.error('Error escalating request:', escalateError);
        continue;
      }

      // Create notification for escalation
      await createNotification(supabase, {
        claim_id: request.claim_id,
        notification_type: 'approval_required',
        recipient_type: 'staff',
        subject: 'Approval Request Escalated',
        message: `Approval request for claim has been escalated due to timeout. Required role: ${workflow.escalation_role}`
      });

    } else {
      // Mark as expired
      const { error: expireError } = await supabase
        .from('panel_claims_approval_requests')
        .update({ status: 'expired' })
        .eq('id', request.id);

      if (expireError) {
        console.error('Error expiring request:', expireError);
      }
    }
  }
}

async function processNotifications(supabase: any, notificationData: any) {
  console.log('Processing notifications...');
  
  // Get pending notifications
  const { data: notifications, error } = await supabase
    .from('panel_claims_notifications')
    .select('*')
    .eq('status', 'pending')
    .lt('created_at', new Date(Date.now() - 5 * 60 * 1000).toISOString()) // Older than 5 minutes
    .order('created_at', { ascending: true })
    .limit(10);

  if (error) throw error;

  for (const notification of notifications || []) {
    try {
      // Here you would integrate with your notification service (email, SMS, etc.)
      // For now, we'll just mark as sent
      console.log(`Sending notification: ${notification.subject}`);
      
      const { error: updateError } = await supabase
        .from('panel_claims_notifications')
        .update({
          status: 'sent',
          sent_at: new Date().toISOString()
        })
        .eq('id', notification.id);

      if (updateError) throw updateError;

    } catch (error: any) {
      console.error('Error processing notification:', error);
      
      // Update retry count
      const { error: retryError } = await supabase
        .from('panel_claims_notifications')
        .update({
          status: 'failed',
          failed_reason: error.message,
          retry_count: (notification.retry_count || 0) + 1
        })
        .eq('id', notification.id);

      if (retryError) {
        console.error('Error updating retry count:', retryError);
      }
    }
  }
}

async function createNotification(supabase: any, notificationData: any) {
  const { error } = await supabase
    .from('panel_claims_notifications')
    .insert(notificationData);

  if (error) {
    console.error('Error creating notification:', error);
  }
}

function calculateNextGeneration(schedule: any): Date {
  const next = new Date();
  
  switch (schedule.frequency) {
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      if (schedule.day_of_period) {
        next.setDate(schedule.day_of_period);
      }
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      if (schedule.day_of_period) {
        next.setDate(schedule.day_of_period);
      }
      break;
  }
  
  return next;
}