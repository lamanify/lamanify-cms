import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role for admin access
);

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { email, clinicName, subdomain } = await req.json();

    // Validate inputs
    if (!email || !clinicName || !subdomain) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain)) {
      return new Response(
        JSON.stringify({ error: 'Invalid subdomain format. Use lowercase letters, numbers, and hyphens only.' }),
        { status: 400 }
      );
    }

    // Check if subdomain taken
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .single();

    if (existing) {
      return new Response(
        JSON.stringify({ error: 'Subdomain already taken' }),
        { status: 400 }
      );
    }

    // Create Stripe Checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID_BASIC!,
          quantity: 1
        }
      ],
      customer_email: email,
      allow_promotion_codes: true, // Enable promo codes like LAUNCH10
      subscription_data: {
        metadata: {
          clinic_name: clinicName,
          subdomain: subdomain,
          source: 'self_serve'
        }
      },
      metadata: {
        clinic_name: clinicName,
        subdomain: subdomain,
        source: 'self_serve'
      },
      success_url: `${process.env.APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.APP_URL}/pricing?canceled=true`
    });

    return new Response(
      JSON.stringify({ sessionId: session.id, url: session.url }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Checkout session error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to create checkout session' }),
      { status: 500 }
    );
  }
}