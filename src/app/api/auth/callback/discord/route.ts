import { NextResponse } from 'next/server';
import { createEdgeClient } from '@/lib/supabase/edge';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const guildId = searchParams.get('guild_id');

  if (!code || !guildId) {
    return NextResponse.redirect(`${origin}/dashboard?error=missing_params`);
  }

  const supabase = createEdgeClient();
  
  // Use the guildId to create a community record for the user
  // We'll fetch the server name via Discord API if possible, or use a placeholder
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

  // Note: In Edge Runtime, we can't easily get the current user from cookies
  // This would need to be handled via a different auth method (JWT token in query param, etc.)
  // For now, we'll save with a temporary user_id that can be updated later
  const { error } = await supabase
    .from('communities')
    .upsert({
      user_id: '00000000-0000-0000-0000-000000000000', // Placeholder - needs proper auth
      guild_id: guildId,
      guild_name: serverName,
      is_active: true
    }, { onConflict: 'guild_id' });

  if (error) {
    console.error("Error saving community", error);
    return NextResponse.redirect(`${origin}/dashboard?error=db_save_failed`);
  }

  return NextResponse.redirect(`${origin}/dashboard?success=server_connected`);
}
