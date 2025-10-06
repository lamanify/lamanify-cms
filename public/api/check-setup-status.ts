import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { session_id } = await req.json();

    if (!session_id) {
      return new Response(
        JSON.stringify({ error: 'Session ID required' }),
        { status: 400 }
      );
    }

    // Get the Stripe session
    const session = await stripe.checkout.sessions.retrieve(session_id);
    
    if (!session.customer_email) {
      return new Response(
        JSON.stringify({ error: 'Invalid session' }),
        { status: 400 }
      );
    }

    // Check if user exists and has active tenant
    const { data: profile } = await supabase
      .from('profiles')
      .select(`
        id,
        user_id,
        tenant_id,
        tenants (
          id,
          subscription_status,
          stripe_customer_id,
          stripe_subscription_id
        )
      `)
      .eq('email', session.customer_email)
      .single();

    if (profile?.tenants?.subscription_status === 'active') {
      return new Response(
        JSON.stringify({ 
          ready: true, 
          user_id: profile.user_id,
          tenant_id: profile.tenant_id
        }),
        { status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ ready: false }),
      { status: 200 }
    );
  } catch (error) {
    console.error('Setup status check error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check setup status' }),
      { status: 500 }
    );
  }
}