import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handlePaidReferral } from '@/lib/referral';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
  apiVersion: '2025-02-24.acacia',
});

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (error: any) {
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  const supabase = await createClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    // Assume we pass the user's supabase ID in the client_reference_id
    const userId = session.client_reference_id;
    const stripeCustomerId = session.customer as string;

    if (userId) {
      // 1. Mark user as paid
      await supabase
        .from('users')
        .update({
          stripe_id: stripeCustomerId,
          pro_days_left: 30 // Example setting for a monthly sub
        })
        .eq('id', userId);

      // 2. Trigger Phase 2 referral checks (if they were referred)
      await handlePaidReferral(userId);
    }
  }

  return NextResponse.json({ received: true });
}
