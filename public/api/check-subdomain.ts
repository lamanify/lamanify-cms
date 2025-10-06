import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export default async function handler(req: Request) {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }

  try {
    const { subdomain } = await req.json();

    if (!subdomain) {
      return new Response(
        JSON.stringify({ error: 'Subdomain required' }),
        { status: 400 }
      );
    }

    // Validate subdomain format
    const subdomainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;
    if (!subdomainRegex.test(subdomain)) {
      return new Response(
        JSON.stringify({ 
          available: false, 
          error: 'Invalid subdomain format' 
        }),
        { status: 200 }
      );
    }

    // Check if subdomain is reserved
    const reservedSubdomains = [
      'www', 'api', 'admin', 'app', 'mail', 'ftp', 'blog',
      'support', 'help', 'docs', 'status', 'dev', 'staging',
      'test', 'demo', 'beta', 'alpha', 'portal', 'dashboard'
    ];

    if (reservedSubdomains.includes(subdomain.toLowerCase())) {
      return new Response(
        JSON.stringify({ 
          available: false, 
          error: 'This subdomain is reserved' 
        }),
        { status: 200 }
      );
    }

    // Check if subdomain exists in database
    const { data: existing } = await supabase
      .from('tenants')
      .select('id')
      .eq('subdomain', subdomain)
      .single();

    const available = !existing;

    return new Response(
      JSON.stringify({ available }),
      { 
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (error) {
    console.error('Subdomain check error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to check subdomain' }),
      { status: 500 }
    );
  }
}