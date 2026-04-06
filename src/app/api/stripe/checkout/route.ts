import Stripe from 'stripe';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-12-18.acacia',
});

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get user email from Supabase
    const { data: userData } = await supabase
      .from('users')
      .select('email')
      .eq('id', user.id)
      .single();

    const customerEmail = userData?.email || user.email;

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      customer_email: customerEmail,
      line_items: [
        {
          price_data: {
            currency: 'inr',
            product_data: {
              name: 'CommunityGuard Pro',
              description: '30 days Pro access - Reduce churn by 47%',
              images: ['https://communityguard.pages.dev/logo.png'],
            },
            unit_amount: 350000, // ₹3500 in paise
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=cancelled`,
      metadata: {
        user_id: user.id,
        plan: 'pro',
        days: '30',
      },
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
