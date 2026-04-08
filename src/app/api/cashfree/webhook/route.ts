import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { cashfreeConfig } from '@/lib/cashfree';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-webhook-signature');

    // Verify webhook signature (simplified - implement proper verification)
    if (!signature) {
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }

    const { order_id, order_status, customer_details } = body.data || {};

    if (order_status === 'PAID' && customer_details?.customer_id) {
      const supabase = await createClient();
      
      // Update user pro status
      await supabase
        .from('users')
        .update({
          pro_days_left: 30,
          pro_plan: 'monthly',
          updated_at: new Date().toISOString()
        })
        .eq('id', customer_details.customer_id);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cashfree webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
