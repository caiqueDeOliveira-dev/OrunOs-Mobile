// Supabase Edge Function (Deno runtime).
// Deploy: supabase functions deploy create-checkout-session
// Requer STRIPE_SECRET_KEY como secret. Autenticação via JWT do usuário
// (por padrão as Edge Functions do Supabase já exigem Authorization: Bearer).
// Sem STRIPE_SECRET_KEY configurada, retorna 503 (degradação graciosa —
// o checkout fica indisponível até as chaves Stripe serem configuradas).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@16?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripeKey = () => {
  const key = Deno.env.get('STRIPE_SECRET_KEY');
  if (!key) return null;
  return new Stripe(key, { apiVersion: '2024-06-20' });
};

serve(async (req) => {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return new Response('Missing auth', { status: 401 });

  const stripe = stripeKey();
  if (!stripe) {
    return new Response(JSON.stringify({ error: 'stripe_not_configured', message: 'Billing ainda não configurado.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError || !userData.user) return new Response('Unauthorized', { status: 401 });

  const { tenantId, priceId, successUrl, cancelUrl } = await req.json();

  // Confirma que o usuário autenticado realmente pertence ao tenant que está
  // tentando assinar — nunca confiar em tenantId vindo do client sem checar.
  const { data: membership, error: membershipError } = await supabase
    .from('memberships')
    .select('role')
    .eq('user_id', userData.user.id)
    .eq('tenant_id', tenantId)
    .maybeSingle();

  if (membershipError || !membership || !['owner', 'admin'].includes(membership.role)) {
    return new Response('Forbidden', { status: 403 });
  }

  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: tenantId,
    subscription_data: {
      metadata: { tenant_id: tenantId },
    },
  });

  return new Response(JSON.stringify({ url: session.url }), {
    headers: { 'Content-Type': 'application/json' },
  });
});
