import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

export async function GET(req: Request) {
  const { searchParams, origin } = new URL(req.url);
  const code = searchParams.get('code');
  const guildId = searchParams.get('guild_id');

  if (!code || !guildId) {
    return NextResponse.redirect(`${origin}/dashboard?error=missing_params`);
  }

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(`${origin}/login?error=unauthorized`);
  }

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

  const { error } = await supabase
    .from('communities')
    .upsert({
      user_id: user.id,
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
