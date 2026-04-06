import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { handlePaidReferral } from '@/lib/referral';
import { createEdgeClient } from '@/lib/supabase/edge';

export const runtime = 'edge';

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
    console.error('Webhook signature verification failed:', error.message);
    return NextResponse.json({ error: `Webhook Error: ${error.message}` }, { status: 400 });
  }

  const supabase = createEdgeClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    
    // Get user ID from metadata or client_reference_id
    const userId = session.metadata?.user_id || session.client_reference_id;
    const stripeCustomerId = session.customer as string;
    const customerEmail = session.customer_email || session.customer_details?.email;
    const days = parseInt(session.metadata?.days || '30');

    if (userId) {
      // 1. Mark user as paid and add pro days
      const { data: userData } = await supabase
        .from('users')
        .select('pro_days_left')
        .eq('id', userId)
        .single();

      const currentDays = userData?.pro_days_left || 0;
      const newDays = currentDays + days;

      await supabase
        .from('users')
        .update({
          stripe_id: stripeCustomerId,
          pro_days_left: newDays,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      console.log(`✅ User ${userId} upgraded to Pro: ${newDays} days`);

      // 2. Send Pro welcome email
      await sendProWelcomeEmail(customerEmail, newDays);

      // 3. Trigger Phase 2 referral checks (if they were referred)
      await handlePaidReferral(userId);
    }
  }

  return NextResponse.json({ received: true });
}

async function sendProWelcomeEmail(email: string | null | undefined, days: number) {
  if (!email) {
    console.log('No email provided for welcome email');
    return;
  }
  
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      console.error('Resend API key not configured');
      return;
    }

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'CommunityGuard <noreply@communityguard.ai>',
        to: email,
        subject: '🎉 Welcome to Pro! Churn reduction unlocked',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <div style="background: linear-gradient(135deg, #5865F2, #4752c4); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0;">🎉 Welcome to Pro!</h1>
            </div>
            
            <div style="padding: 30px; background: #f9f9f9;">
              <p style="font-size: 16px; line-height: 1.6;">Your account has been upgraded successfully to <strong>CommunityGuard Pro</strong>.</p>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0; border-left: 4px solid #5865F2;">
                <h3 style="color: #5865F2; margin-top: 0;">Your Pro Benefits:</h3>
                <ul style="line-height: 2;">
                  <li>✅ <strong>${days} days</strong> of Pro access</li>
                  <li>✅ Send recovery emails to at-risk members</li>
                  <li>✅ Advanced churn analytics</li>
                  <li>✅ Unlimited Discord servers</li>
                  <li>✅ Priority email support</li>
                </ul>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6;">Reduce your community churn by up to <strong style="color: #5865F2;">47%</strong> with our AI-powered recovery email system.</p>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://communityguard.pages.dev/dashboard" 
                   style="background: #5865F2; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold; font-size: 16px;">
                  Go to Dashboard →
                </a>
              </div>
              
              <p style="margin-top: 30px; font-size: 14px; color: #666; text-align: center;">
                Need help? Reply to this email or contact support.
              </p>
            </div>
          </div>
        `,
      }),
    });

    if (response.ok) {
      console.log('✅ Pro welcome email sent to:', email);
    } else {
      const errorData = await response.text();
      console.error('Failed to send welcome email:', errorData);
    }
  } catch (error) {
    console.error('Failed to send welcome email:', error);
  }
}
