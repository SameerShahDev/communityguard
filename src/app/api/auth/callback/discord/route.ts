import { NextResponse } from 'next/server';
import { createEdgeClient } from '@/lib/supabase/edge';

export const runtime = 'edge';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://communityguard.pages.dev';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const guildId = searchParams.get('guild_id');

  if (!code || !guildId) {
    return NextResponse.redirect(`${SITE_URL}/dashboard?error=missing_params`);
  }

  const supabase = createEdgeClient();
  
  // Get user from cookies if possible
  let userId = '00000000-0000-0000-0000-000000000000';
  const cookieHeader = req.headers.get('cookie');
  if (cookieHeader) {
    const match = cookieHeader.match(/sb-access-token=([^;]+)/);
    if (match) {
      try {
        const token = match[1];
        // Verify token with Supabase to get user
        const userRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
          }
        });
        if (userRes.ok) {
          const userData = await userRes.json();
          userId = userData.id || userId;
        }
      } catch (e) {
        console.error('Failed to get user from token', e);
      }
    }
  }
  
  // Use the guildId to create a community record for the user
  const discordToken = process.env.DISCORD_BOT_TOKEN;
  
  let serverName = "Connected Server";
  try {
    const guildRes = await fetch(`https://discord.com/api/v10/guilds/${guildId}`, {
        headers: { Authorization: `Bot ${discordToken}` }
    });
    if (guildRes.ok) {
        const guildData = await guildRes.json();
        serverName = guildData.name;
    }
  } catch (e) {
    console.error("Failed to fetch guild name", e);
  }

  const { error } = await supabase
    .from('communities')
    .upsert({
      user_id: userId,
      guild_id: guildId,
      guild_name: serverName,
      is_active: true
    }, { onConflict: 'guild_id' });

  if (error) {
    console.error("Error saving community", error);
    return NextResponse.redirect(`${SITE_URL}/dashboard?error=db_save_failed`);
  }

  return NextResponse.redirect(`${SITE_URL}/dashboard?success=server_connected`);
}
