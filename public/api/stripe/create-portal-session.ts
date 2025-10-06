import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { tenantId } = await req.json();

    if (!tenantId) {
      return new Response(
        JSON.stringify({ error: 'Tenant ID is required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Get tenant Stripe customer ID
    const { data: tenant, error } = await supabase
      .from('tenants')
      .select('stripe_customer_id, subscription_status, is_comped')
      .eq('id', tenantId)
      .single();

    if (error) {
      console.error('Error fetching tenant:', error);
      return new Response(
        JSON.stringify({ error: 'Tenant not found' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!tenant?.stripe_customer_id) {
      return new Response(
        JSON.stringify({ error: 'No Stripe customer found for this tenant' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create Customer Portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: tenant.stripe_customer_id,
      return_url: `${process.env.APP_URL}/billing`,
      // Configure what customers can do in the portal
      configuration: {
        business_profile: {
          headline: 'LamaniHub - Healthcare Management System',
        },
        features: {
          payment_method_update: {
            enabled: true
          },
          invoice_history: {
            enabled: true
          },
          subscription_cancel: {
            enabled: !tenant.is_comped, // Don't allow comp'd users to cancel
            mode: 'at_period_end'
          },
          subscription_pause: {
            enabled: false // We don't support pausing
          },
          subscription_update: {
            enabled: false, // We only have one plan
            default_allowed_updates: []
          }
        }
      }
    });

    return new Response(
      JSON.stringify({ url: session.url }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Portal session error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create portal session' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}