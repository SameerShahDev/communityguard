import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createSubscription, cancelSubscription, upgradeSubscription } from '@/app/dashboard/actions';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's subscriptions
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get subscriptions error:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    return NextResponse.json({ success: true, subscriptions });
  } catch (error) {
    console.error('Subscriptions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { action, planId, billingCycle, reason } = body;

    switch (action) {
      case 'create':
        const createResult = await createSubscription(user.id, planId, billingCycle, body.paymentDetails);
        return NextResponse.json(createResult);

      case 'cancel':
        const cancelResult = await cancelSubscription(user.id, reason);
        return NextResponse.json(cancelResult);

      case 'upgrade':
        const upgradeResult = await upgradeSubscription(user.id, planId, billingCycle);
        return NextResponse.json(upgradeResult);

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Subscriptions POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
