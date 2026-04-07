import { NextResponse } from 'next/server';
import { createEdgeClient, createServiceClient } from '@/lib/supabase/edge';

export const runtime = 'edge';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://communityguard.pages.dev';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');
  const guildId = searchParams.get('guild_id');
  const state = searchParams.get('state');

  console.log('Discord callback received:', { code: code ? 'present' : 'missing', guildId, state: state ? 'present' : 'missing' });

  if (!code || !guildId) {
    console.error('Missing params:', { code, guildId });
    return NextResponse.redirect(`${SITE_URL}/dashboard?error=missing_params`);
  }

  // Use service client to bypass RLS
  let supabase;
  try {
    supabase = createServiceClient();
    console.log('Using service role client');
  } catch (e) {
    console.error('Service client failed, falling back to edge client:', e);
    supabase = createEdgeClient();
  }
  
  // Extract user_id from state parameter (primary method)
  let userId = '';
  if (state) {
    try {
      const stateData = JSON.parse(Buffer.from(state, 'base64').toString());
      userId = stateData.userId;
      console.log('User ID extracted from state:', userId);
    } catch (e) {
      console.error('Failed to parse state:', e);
    }
  }
  
  // Fallback: Get user from cookies if state didn't work
  if (!userId) {
    const cookieHeader = req.headers.get('cookie');
    console.log('Fallback: Cookie header present:', !!cookieHeader);
    
    if (cookieHeader) {
      const patterns = [
        /sb-access-token=([^;]+)/,
        /sb-[^-]+-auth-token=([^;]+)/,
        /supabase-auth-token=([^;]+)/
      ];
      
      for (const pattern of patterns) {
        const match = cookieHeader.match(pattern);
        if (match) {
          try {
            const token = match[1];
            const userRes = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/user`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
              }
            });
            
            if (userRes.ok) {
              const userData = await userRes.json();
              userId = userData.id;
              console.log('User ID from cookie:', userId);
              break;
            }
          } catch (e) {
            console.error('Cookie auth failed:', e);
          }
        }
      }
    }
  }

  if (!userId) {
    console.error('Could not get user ID from state or cookies');
    return NextResponse.redirect(`${SITE_URL}/dashboard?error=auth_required`);
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
    } else {
        console.log('Guild fetch failed, using default name');
    }
  } catch (e) {
    console.error("Failed to fetch guild name", e);
  }

  console.log('Attempting to save community:', { userId, guildId, serverName });

  const { data, error } = await supabase
    .from('communities')
    .upsert({
      user_id: userId,
      guild_id: guildId,
      guild_name: serverName,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'guild_id' })
    .select();

  if (error) {
    console.error("Error saving community:", error);
    console.error("Error details:", JSON.stringify(error));
    return NextResponse.redirect(`${SITE_URL}/dashboard?error=db_save_failed&message=${encodeURIComponent(error.message)}`);
  }

  console.log('Community saved successfully:', data);
  return NextResponse.redirect(`${SITE_URL}/dashboard?success=server_connected`);
}
