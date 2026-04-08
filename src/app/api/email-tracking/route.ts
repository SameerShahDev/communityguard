export const runtime = 'edge';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface EmailTrackingRecord {
  id: string;
  user_id: string;
  emails_sent: number;
  recipient_emails: string[];
  campaign_type: string;
  created_at: string;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 });
    }

    // Get email tracking data
    const { data: emailStats, error } = await supabase
      .from('email_tracking')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Email tracking error:', error);
      return NextResponse.json({ error: 'Failed to fetch email stats' }, { status: 500 });
    }

    // Calculate total emails sent
    const totalEmailsSent = emailStats?.reduce((sum: number, stat: EmailTrackingRecord) => sum + stat.emails_sent, 0) || 0;
    
    // Get unique users who received emails
    const uniqueEmails = new Set(emailStats?.map((stat: EmailTrackingRecord) => stat.recipient_emails).flat()).size;

    return NextResponse.json({
      success: true,
      totalEmailsSent,
      uniqueRecipients: uniqueEmails,
      recentActivity: emailStats?.slice(0, 10) || [],
      summary: {
        last7Days: emailStats?.filter((stat: EmailTrackingRecord) => {
          const statDate = new Date(stat.created_at);
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          return statDate > weekAgo;
        }).reduce((sum: number, stat: EmailTrackingRecord) => sum + stat.emails_sent, 0) || 0,
        last30Days: emailStats?.filter((stat: EmailTrackingRecord) => {
          const statDate = new Date(stat.created_at);
          const monthAgo = new Date();
          monthAgo.setDate(monthAgo.getDate() - 30);
          return statDate > monthAgo;
        }).reduce((sum: number, stat: EmailTrackingRecord) => sum + stat.emails_sent, 0) || 0
      }
    });
  } catch (error) {
    console.error('Email tracking API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();
    const { userId, emailsSent, recipientEmails, campaignType } = body;

    if (!userId || !emailsSent || !recipientEmails) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Track email sending
    const { data, error } = await supabase
      .from('email_tracking')
      .insert({
        user_id: userId,
        emails_sent: emailsSent,
        recipient_emails: recipientEmails,
        campaign_type: campaignType || 'recovery',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) {
      console.error('Email tracking insert error:', error);
      return NextResponse.json({ error: 'Failed to track emails' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      tracked: data
    });
  } catch (error) {
    console.error('Email tracking POST error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
