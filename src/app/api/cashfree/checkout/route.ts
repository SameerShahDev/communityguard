import { NextRequest, NextResponse } from 'next/server';
import { cashfreeConfig } from '@/lib/cashfree';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, planId = 'proMonthly' } = body;

    const plans: Record<string, { name: string; amount: number }> = {
      proMonthly: { name: 'CommunityGuard Pro - Monthly', amount: 2900 },
      proYearly: { name: 'CommunityGuard Pro - Yearly', amount: 27840 },
      starter: { name: 'CommunityGuard Starter', amount: 830 }
    };

    const plan = plans[planId] || plans.proMonthly;
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
          customer_email: 'user@example.com',
          customer_phone: '9999999999'
        },
        order_meta: {
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard?payment=success&order_id={order_id}`
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json({ success: false, error: data.message || 'Failed to create order' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      orderId: data.order_id,
      paymentSessionId: data.payment_session_id,
      orderToken: data.order_token
    });
  } catch (error) {
    console.error('Cashfree checkout error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
