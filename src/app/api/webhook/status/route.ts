import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/edge';

export const runtime = 'edge';

// GET webhook status and recent events
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guildId = searchParams.get('guild_id');
    
    const supabase = createServiceClient();
    
    // Get webhook configuration
    const config = {
      endpoint: `${process.env.NEXT_PUBLIC_SITE_URL || 'https://igone.pages.dev'}/api/discord-webhook`,
      public_key: process.env.DISCORD_PUBLIC_KEY ? '✅ Configured' : '❌ Missing',
      bot_token: process.env.DISCORD_BOT_TOKEN ? '✅ Configured' : '❌ Missing',
      supported_events: [
        'GUILD_CREATE',
        'GUILD_DELETE',
        'GUILD_MEMBER_ADD',
        'GUILD_MEMBER_REMOVE',
        'GUILD_MEMBER_UPDATE',
        'MESSAGE_CREATE',
        'MESSAGE_UPDATE',
        'INTERACTION_CREATE'
      ]
    };
    
    // Get stats
    const { count: totalCommunities } = await supabase
      .from('communities')
      .select('*', { count: 'exact', head: true });
    
    const { count: activeCommunities } = await supabase
      .from('communities')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);
    
    const { count: totalMembers } = await supabase
      .from('member_activity')
      .select('*', { count: 'exact', head: true });
    
    // Get recent activity for specific guild if provided
    let recentActivity = null;
    if (guildId) {
      const { data: members } = await supabase
        .from('member_activity')
        .select('*')
        .eq('guild_id', guildId)
        .order('last_message_at', { ascending: false })
        .limit(10);
      
      recentActivity = members;
    }
    
    return NextResponse.json({
      status: 'operational',
      timestamp: new Date().toISOString(),
      config,
      stats: {
        total_communities: totalCommunities || 0,
        active_communities: activeCommunities || 0,
        total_members_tracked: totalMembers || 0
      },
      recent_activity: recentActivity,
      endpoints: {
        webhook: '/api/discord-webhook',
        bot_members: '/api/bot/members',
        health: '/api/webhook/status'
      }
    });
    
  } catch (error: any) {
    console.error('Webhook status error:', error);
    return NextResponse.json({ 
      status: 'error',
      error: error.message 
    }, { status: 500 });
  }
}
