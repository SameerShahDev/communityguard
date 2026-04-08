import { NextRequest, NextResponse } from 'next/server';
import { cashfreeConfig } from '@/lib/cashfree';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planId, billingCycle, successUrl, failureUrl } = body;

    // New pricing plans
    const plans: Record<string, { name: string; amount: number }> = {
      starter_monthly: { name: 'CommunityGuard Starter - Monthly', amount: 29900 },
      starter_yearly: { name: 'CommunityGuard Starter - Yearly', amount: 299000 },
      pro_monthly: { name: 'CommunityGuard Professional - Monthly', amount: 49900 },
      pro_yearly: { name: 'CommunityGuard Professional - Yearly', amount: 499000 },
      enterprise_monthly: { name: 'CommunityGuard Enterprise - Monthly', amount: 99900 },
      enterprise_yearly: { name: 'CommunityGuard Enterprise - Yearly', amount: 999000 }
    };

    const actualPlanId = `${planId}_${billingCycle}`;
    const plan = plans[actualPlanId];
    
    if (!plan) {
      return NextResponse.json({ success: false, error: 'Invalid plan selected' }, { status: 400 });
    }

    const orderId = `order_${userId}_${Date.now()}`;

    const response = await fetch(`${cashfreeConfig.baseUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-client-id': cashfreeConfig.appId,
        'x-client-secret': cashfreeConfig.secretKey,
        'x-api-version': '2023-08-01'
      },
      body: JSON.stringify({
        order_id: orderId,
        order_amount: plan.amount,
        order_currency: 'INR',
        customer_details: {
          customer_id: userId,
          customer_email: 'user@example.com', // This should come from user session
          customer_phone: '9999999999'
        },
        order_meta: {
          return_url: successUrl || `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success&order_id=${orderId}`,
          payment_methods: 'cc,dc,upi'
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data.message || 'Failed to create order' }, { status: 400 });
    }

    // Create payment session URL
    const paymentUrl = `${cashfreeConfig.baseUrl}/orders/${data.order_id}/pay`;

    return NextResponse.json({
      success: true,
      url: paymentUrl,
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderToken: data.order_token
    });
  } catch (error) {
    console.error('Cashfree checkout error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
