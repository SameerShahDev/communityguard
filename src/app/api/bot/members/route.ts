import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/edge';

export const runtime = 'edge';

// Discord Bot Token verification
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { event_type, guild_id, member, guild_name } = body;

    // Verify request has valid guild_id
    if (!guild_id) {
      return NextResponse.json({ error: 'Missing guild_id' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Handle different event types
    switch (event_type) {
      case 'GUILD_MEMBER_ADD':
      case 'MEMBER_JOIN': {
        const { error } = await supabase
          .from('member_activity')
          .upsert({
            guild_id: guild_id,
            discord_id: member.id,
            username: member.username || member.user?.username,
            last_message_at: new Date().toISOString()
          }, { onConflict: 'guild_id,discord_id' });

        if (error) {
          console.error('Error adding member:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        // Update community member count
        await updateMemberCount(supabase, guild_id);

        return NextResponse.json({ 
          success: true, 
          message: `Member ${member.username} added to tracking` 
        });
      }

      case 'GUILD_MEMBER_REMOVE':
      case 'MEMBER_LEAVE': {
        // Mark member as inactive or delete
        const { error } = await supabase
          .from('member_activity')
          .delete()
          .eq('guild_id', guild_id)
          .eq('discord_id', member.id);

        if (error) {
          console.error('Error removing member:', error);
        }

        await updateMemberCount(supabase, guild_id);

        return NextResponse.json({ 
          success: true, 
          message: `Member ${member.username} removed from tracking` 
        });
      }

      case 'MESSAGE_CREATE': {
        // Update last message timestamp
        const { error } = await supabase
          .from('member_activity')
          .upsert({
            guild_id: guild_id,
            discord_id: member.id,
            username: member.username || member.user?.username,
            last_message_at: new Date().toISOString()
          }, { onConflict: 'guild_id,discord_id' });

        if (error) {
          console.error('Error updating activity:', error);
        }

        return NextResponse.json({ success: true });
      }

      case 'GUILD_SYNC': {
        // Bulk sync all members from guild
        const { members } = body;
        
        if (!Array.isArray(members)) {
          return NextResponse.json({ error: 'Invalid members array' }, { status: 400 });
        }

        // Insert all members
        const memberRecords = members.map((m: any) => ({
          guild_id: guild_id,
          discord_id: m.id,
          username: m.username || m.user?.username,
          last_message_at: new Date().toISOString()
        }));

        const { error } = await supabase
          .from('member_activity')
          .upsert(memberRecords, { onConflict: 'guild_id,discord_id' });

        if (error) {
          console.error('Error syncing members:', error);
          return NextResponse.json({ error: error.message }, { status: 500 });
        }

        await updateMemberCount(supabase, guild_id);

        return NextResponse.json({ 
          success: true, 
          count: members.length,
          message: `Synced ${members.length} members` 
        });
      }

      default:
        return NextResponse.json({ 
          error: 'Unknown event type',
          supported_types: ['GUILD_MEMBER_ADD', 'GUILD_MEMBER_REMOVE', 'MESSAGE_CREATE', 'GUILD_SYNC']
        }, { status: 400 });
    }
  } catch (error: any) {
    console.error('Discord bot webhook error:', error);
    return NextResponse.json({ 
      error: error.message || 'Internal server error' 
    }, { status: 500 });
  }
}

// Get total members for a guild
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const guild_id = searchParams.get('guild_id');

    if (!guild_id) {
      return NextResponse.json({ error: 'Missing guild_id' }, { status: 400 });
    }

    const supabase = createServiceClient();

    // Get total members
    const { count: totalMembers, error: countError } = await supabase
      .from('member_activity')
      .select('*', { count: 'exact', head: true })
      .eq('guild_id', guild_id);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Get recent joiners (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: newMembers, error: newError } = await supabase
      .from('member_activity')
      .select('*', { count: 'exact', head: true })
      .eq('guild_id', guild_id)
      .gte('last_message_at', sevenDaysAgo.toISOString());

    return NextResponse.json({
      total_members: totalMembers || 0,
      new_members_7d: newMembers || 0,
      guild_id: guild_id
    });
  } catch (error: any) {
    console.error('Get members error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Helper function to update member count in communities table
async function updateMemberCount(supabase: any, guild_id: string) {
  try {
    const { count } = await supabase
      .from('member_activity')
      .select('*', { count: 'exact', head: true })
      .eq('guild_id', guild_id);

    // Update communities table with member count (if you add a member_count column)
    // For now just log it
    console.log(`Updated member count for guild ${guild_id}: ${count}`);
  } catch (e) {
    console.error('Error updating member count:', e);
  }
}
