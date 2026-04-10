export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get all subscription analytics
    const { data: analytics, error } = await supabase
      .from('subscriptions')
      .select(`
        user_id,
        plan_id,
        plan_name,
        status,
        billing_cycle,
        price_inr,
        price_usd,
        created_at,
        ends_at
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Get analytics error:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
    }

    // Calculate summary statistics
    const totalSubscriptions = analytics?.length || 0;
    const activeSubscriptions = analytics?.filter(s => s.status === 'active').length || 0;
    const totalRevenueINR = analytics?.reduce((sum, s) => sum + (s.price_inr || 0), 0) || 0;
    const totalRevenueUSD = analytics?.reduce((sum, s) => sum + (s.price_usd || 0), 0) || 0;

    // Group by plan type
    const planStats = analytics?.reduce((acc, s) => {
      const plan = s.plan_id || 'unknown';
      acc[plan] = (acc[plan] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    // Group by billing cycle
    const billingStats = analytics?.reduce((acc, s) => {
      const cycle = s.billing_cycle || 'unknown';
      acc[cycle] = (acc[cycle] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      success: true,
      summary: {
        totalSubscriptions,
        activeSubscriptions,
        totalRevenueINR,
        totalRevenueUSD,
        planStats,
        billingStats
      },
      subscriptions: analytics || []
    });
  } catch (error) {
    console.error('Admin subscriptions GET error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
