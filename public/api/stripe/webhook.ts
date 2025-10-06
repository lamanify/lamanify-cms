import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const signature = req.headers.get('stripe-signature');
  if (!signature) {
    return new Response('No signature', { status: 400 });
  }

  let event: Stripe.Event;

  try {
    const body = await req.text();
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  console.log('Webhook event:', event.type, event.id);

  try {
    // Check if event already processed (idempotency)
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('id', event.id)
      .single();

    if (existingEvent) {
      console.log('Event already processed:', event.id);
      return new Response(JSON.stringify({ received: true }), { status: 200 });
    }

    // Process the event
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await handleSubscriptionChange(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;
      default:
        console.log(`Unhandled event: ${event.type}`);
    }

    // Record event as processed
    await supabase
      .from('webhook_events')
      .insert({
        id: event.id,
        type: event.type,
        processed_at: new Date().toISOString()
      });

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response('Webhook handler failed', { status: 500 });
  }
}

// === HANDLER: CHECKOUT COMPLETED ===
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const { customer, subscription, metadata } = session;
  
  if (!metadata?.clinic_name || !metadata?.subdomain) {
    throw new Error('Missing metadata in checkout session');
  }

  console.log('Processing checkout completed:', session.id);

  // Check if comp'd (100% off coupon applied)
  const sub = await stripe.subscriptions.retrieve(subscription as string);
  const isComped = sub.discount?.coupon?.percent_off === 100;

  // Create or update tenant
  const { data: tenant, error: tenantError } = await supabase
    .from('tenants')
    .upsert({
      subdomain: metadata.subdomain,
      clinic_name: metadata.clinic_name,
      plan_code: 'crm_basic',
      subscription_status: isComped ? 'comped' : 'active',
      stripe_customer_id: customer as string,
      stripe_subscription_id: subscription as string,
      is_comped: isComped,
      comp_reason: isComped ? metadata.comp_reason || 'coupon_applied' : null,
      current_period_start: new Date(sub.current_period_start * 1000).toISOString(),
      current_period_end: new Date(sub.current_period_end * 1000).toISOString(),
      updated_at: new Date().toISOString()
    }, {
      onConflict: 'subdomain'
    })
    .select()
    .single();

  if (tenantError) throw tenantError;

  // Create user account if customer email provided
  if (session.customer_details?.email) {
    const customerEmail = session.customer_details.email;
    
    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      password: Math.random().toString(36).slice(-12),
      email_confirm: true,
      user_metadata: {
        clinic_name: metadata.clinic_name,
        subdomain: metadata.subdomain,
        source: 'stripe_checkout'
      }
    });

    if (authError && !authError.message.includes('already registered')) {
      console.error('Auth user creation error:', authError);
    }

    const userId = authUser?.user?.id || (await getUserByEmail(customerEmail));
    
    if (userId) {
      // Create or update profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          user_id: userId,
          tenant_id: tenant.id,
          email: customerEmail,
          first_name: metadata.clinic_name.split(' ')[0] || 'Doctor',
          last_name: metadata.clinic_name.split(' ').slice(1).join(' ') || 'Admin',
          role: 'admin',
          status: 'active',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.error('Profile creation error:', profileError);
      }
    }
  }

  console.log('Tenant created/updated:', tenant.id);
}

// === HANDLER: SUBSCRIPTION CHANGE ===
async function handleSubscriptionChange(subscription: Stripe.Subscription) {
  const { customer, status, current_period_start, current_period_end } = subscription;
  
  console.log('Processing subscription change:', subscription.id, status);
  
  const isComped = subscription.discount?.coupon?.percent_off === 100;

  // Map Stripe status to our status
  let subscriptionStatus: string;
  switch (status) {
    case 'active':
    case 'trialing':
      subscriptionStatus = isComped ? 'comped' : 'active';
      break;
    case 'past_due':
      subscriptionStatus = 'past_due';
      break;
    case 'canceled':
    case 'unpaid':
      subscriptionStatus = 'canceled';
      break;
    default:
      subscriptionStatus = 'inactive';
  }

  // Find tenant by stripe_customer_id
  const { error } = await supabase
    .from('tenants')
    .update({
      subscription_status: subscriptionStatus,
      stripe_subscription_id: subscription.id,
      is_comped: isComped,
      current_period_start: new Date(current_period_start * 1000).toISOString(),
      current_period_end: new Date(current_period_end * 1000).toISOString(),
      grace_period_ends_at: subscriptionStatus === 'past_due' 
        ? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days grace
        : null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customer as string);

  if (error) throw error;

  console.log('Subscription updated:', subscription.id, subscriptionStatus);
}

// === HANDLER: SUBSCRIPTION DELETED ===
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const { customer } = subscription;
  
  console.log('Processing subscription deleted:', subscription.id);

  const { error } = await supabase
    .from('tenants')
    .update({
      subscription_status: 'canceled',
      grace_period_ends_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customer as string);

  if (error) throw error;

  console.log('Subscription canceled:', subscription.id);
}

// === HANDLER: PAYMENT SUCCEEDED ===
async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  const { customer } = invoice;
  
  console.log('Processing payment succeeded for customer:', customer);

  // Clear grace period, set active
  const { error } = await supabase
    .from('tenants')
    .update({
      subscription_status: 'active',
      grace_period_ends_at: null,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customer as string);

  if (error) throw error;

  console.log('Payment succeeded for customer:', customer);
}

// === HANDLER: PAYMENT FAILED ===
async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const { customer } = invoice;
  
  console.log('Processing payment failed for customer:', customer);

  // Set to past_due, start grace period
  const { error } = await supabase
    .from('tenants')
    .update({
      subscription_status: 'past_due',
      grace_period_ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', customer as string);

  if (error) throw error;

  console.log('Payment failed for customer:', customer);
}

// === UTILITY FUNCTIONS ===
async function getUserByEmail(email: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.listUsers();
  const user = data.users.find(u => u.email === email);
  return user?.id || null;
}