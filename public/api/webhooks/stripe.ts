import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  const body = await req.text();
  const sig = req.headers.get('stripe-signature')!;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    return new Response('Webhook signature verification failed', { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription);
        break;
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
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
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response('Webhook processed successfully', { status: 200 });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return new Response('Webhook processing failed', { status: 500 });
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log('Processing checkout completed:', session.id);
  
  const { clinic_name, subdomain, source } = session.metadata || {};
  const customerEmail = session.customer_email!;
  
  try {
    // Get the subscription
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    
    // Create user account if doesn't exist
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: customerEmail,
      password: Math.random().toString(36).slice(-12), // Random temp password
      email_confirm: true,
      user_metadata: {
        clinic_name,
        subdomain,
        source: 'stripe_checkout'
      }
    });

    if (authError && !authError.message.includes('already registered')) {
      throw authError;
    }

    const userId = authUser?.user?.id || (await getUserByEmail(customerEmail));
    
    if (!userId) {
      throw new Error('Failed to create or find user');
    }

    // Create tenant
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        subdomain,
        clinic_name,
        subscription_status: 'active',
        stripe_customer_id: session.customer as string,
        stripe_subscription_id: subscription.id,
        plan_type: 'professional',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single();

    if (tenantError) {
      throw tenantError;
    }

    // Create or update user profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: userId,
        user_id: userId,
        tenant_id: tenant.id,
        email: customerEmail,
        first_name: clinic_name.split(' ')[0] || 'Doctor',
        last_name: clinic_name.split(' ').slice(1).join(' ') || 'Admin',
        role: 'admin',
        status: 'active',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });

    if (profileError) {
      throw profileError;
    }

    // Send welcome email
    await sendWelcomeEmail(customerEmail, clinic_name, subdomain, userId);
    
    console.log(`Successfully created tenant ${tenant.id} for user ${userId}`);
  } catch (error) {
    console.error('Error in handleCheckoutCompleted:', error);
    throw error;
  }
}

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  console.log('Processing subscription created:', subscription.id);
  
  const { error } = await supabase
    .from('tenants')
    .update({
      subscription_status: 'active',
      stripe_subscription_id: subscription.id,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_customer_id', subscription.customer as string);

  if (error) {
    console.error('Error updating subscription status:', error);
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  console.log('Processing subscription updated:', subscription.id);
  
  const status = subscription.status === 'active' ? 'active' : 
                subscription.status === 'canceled' ? 'canceled' : 
                subscription.status === 'past_due' ? 'past_due' : 'inactive';

  const { error } = await supabase
    .from('tenants')
    .update({
      subscription_status: status,
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription:', error);
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log('Processing subscription deleted:', subscription.id);
  
  const { error } = await supabase
    .from('tenants')
    .update({
      subscription_status: 'canceled',
      updated_at: new Date().toISOString()
    })
    .eq('stripe_subscription_id', subscription.id);

  if (error) {
    console.error('Error updating subscription to canceled:', error);
  }
}

async function handlePaymentSucceeded(invoice: Stripe.Invoice) {
  console.log('Processing payment succeeded:', invoice.id);
  
  if (invoice.subscription) {
    const { error } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'active',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription as string);

    if (error) {
      console.error('Error updating payment status:', error);
    }
  }
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  console.log('Processing payment failed:', invoice.id);
  
  if (invoice.subscription) {
    const { error } = await supabase
      .from('tenants')
      .update({
        subscription_status: 'past_due',
        updated_at: new Date().toISOString()
      })
      .eq('stripe_subscription_id', invoice.subscription as string);

    if (error) {
      console.error('Error updating payment failure:', error);
    }
  }
}

async function getUserByEmail(email: string): Promise<string | null> {
  const { data } = await supabase.auth.admin.listUsers();
  const user = data.users.find(u => u.email === email);
  return user?.id || null;
}

async function sendWelcomeEmail(email: string, clinicName: string, subdomain: string, userId: string) {
  // Generate a magic link for first login
  const { data, error } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: email,
    options: {
      redirectTo: `${process.env.APP_URL}/dashboard`
    }
  });

  if (error) {
    console.error('Error generating magic link:', error);
    return;
  }

  // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
  console.log(`Welcome email should be sent to ${email}:`);
  console.log(`Clinic: ${clinicName}`);
  console.log(`Subdomain: ${subdomain}`);
  console.log(`Login link: ${data.properties?.action_link}`);
  
  // TODO: Implement actual email sending
  // await sendEmail({
  //   to: email,
  //   subject: `Welcome to LamaniHub - ${clinicName}`,
  //   template: 'welcome',
  //   data: {
  //     clinicName,
  //     subdomain,
  //     loginLink: data.properties?.action_link,
  //     dashboardUrl: `https://${subdomain}.lamanihub.com`
  //   }
  // });
}