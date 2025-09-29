import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Calculate cutoff date (e.g., sessions older than 30 days)
    const cutoffDays = 30
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - cutoffDays)

    console.log(`Cleaning up sessions older than ${cutoffDate.toISOString()}`)

    // Delete archived sessions older than cutoff date
    const { data: deletedSessions, error: deleteError } = await supabase
      .from('queue_sessions')
      .delete()
      .lt('archived_at', cutoffDate.toISOString())
      .eq('status', 'archived')
      .select('id')

    if (deleteError) {
      throw deleteError
    }

    // Also clean up completed queue entries older than cutoff date that don't have visits
    const { data: orphanedQueues, error: orphanError } = await supabase
      .from('patient_queue')
      .select('id')
      .eq('status', 'completed')
      .lt('queue_date', cutoffDate.toISOString().split('T')[0])
      .not('id', 'in', `(SELECT queue_id FROM patient_visits WHERE queue_id IS NOT NULL)`)

    if (orphanError) {
      console.error('Error finding orphaned queues:', orphanError)
    } else if (orphanedQueues && orphanedQueues.length > 0) {
      // Delete orphaned queue entries
      const { error: queueDeleteError } = await supabase
        .from('patient_queue')
        .delete()
        .in('id', orphanedQueues.map(q => q.id))

      if (queueDeleteError) {
        console.error('Error deleting orphaned queues:', queueDeleteError)
      } else {
        console.log(`Cleaned up ${orphanedQueues.length} orphaned queue entries`)
      }
    }

    const deletedCount = deletedSessions?.length || 0
    
    console.log(`Cleanup completed: ${deletedCount} sessions deleted`)

    return new Response(
      JSON.stringify({
        success: true,
        message: `Cleanup completed: ${deletedCount} sessions deleted`,
        deletedSessions: deletedCount,
        cutoffDate: cutoffDate.toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )
  } catch (error: any) {
    console.error('Error in cleanup-sessions function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})