import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Bot webhook endpoint - for your custom Discord bot
// This receives member activity from your bot

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { 
      event_type,     // 'message', 'member_join', 'member_leave', 'member_inactive'
      guild_id,       // Discord server ID
      guild_name,     // Server name
      discord_id,     // Member Discord ID
      username,       // Member username
      message_count,  // Optional: message count
      last_message_at // Optional: ISO timestamp
    } = body;

    // Validate required fields
    if (!event_type || !guild_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Handle different event types
    switch (event_type) {
      case 'message':
        // Update member activity
        const { error: msgError } = await supabase
          .rpc('handle_discord_webhook', {
            p_guild_id: guild_id,
            p_event_type: 'message_sent',
            p_discord_id: discord_id,
            p_username: username
          });

        if (msgError) {
          console.error('Error handling message webhook:', msgError);
          // Fallback: direct insert
          await supabase
            .from('member_activity')
            .upsert({
              guild_id: guild_id,
              discord_id: discord_id,
              username: username,
              last_message_at: last_message_at || new Date().toISOString()
            }, { onConflict: 'guild_id,discord_id' });
        }
        break;

      case 'member_join':
        // Add new member
        await supabase
          .from('member_activity')
          .upsert({
            guild_id: guild_id,
            discord_id: discord_id,
            username: username,
            last_message_at: new Date().toISOString()
          }, { onConflict: 'guild_id,discord_id' });

        // Update community member count
        await supabase.rpc('increment_member_count', { p_guild_id: guild_id });
        break;

      case 'member_leave':
        // Remove member or mark as left
        await supabase
          .from('member_activity')
          .delete()
          .eq('guild_id', guild_id)
          .eq('discord_id', discord_id);

        // Update community member count
        await supabase.rpc('decrement_member_count', { p_guild_id: guild_id });
        break;

      case 'bulk_sync':
        // Bulk sync all members from server
        const { members } = body; // Array of { discord_id, username, last_message_at }
        
        if (Array.isArray(members) && members.length > 0) {
          const { error: bulkError } = await supabase
            .from('member_activity')
            .upsert(
              members.map(m => ({
                guild_id: guild_id,
                discord_id: m.discord_id,
                username: m.username,
                last_message_at: m.last_message_at || new Date().toISOString()
              })),
              { onConflict: 'guild_id,discord_id' }
            );

          if (bulkError) {
            console.error('Bulk sync error:', bulkError);
          }

          // Update total member count in community
          await supabase
            .from('communities')
            .update({ member_count: members.length })
            .eq('guild_id', guild_id);
        }
        break;

      default:
        return NextResponse.json({ error: 'Unknown event type' }, { status: 400 });
    }

    return NextResponse.json({ 
      success: true, 
      event: event_type,
      guild_id: guild_id
    });

  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// GET endpoint for testing
export async function GET(req: NextRequest) {
  return NextResponse.json({ 
    status: 'Bot webhook endpoint ready',
    endpoints: {
      POST: '/api/bot/webhook',
      events: ['message', 'member_join', 'member_leave', 'bulk_sync']
    }
  });
}
