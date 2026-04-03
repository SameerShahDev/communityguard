import { verifyKey } from 'discord-interactions';
import { createClient } from '@supabase/supabase-js';

export default {
  async fetch(request: Request, env: any) {
    const PUBLIC_KEY = 'ab7bb98cf73a632bceb12d0314e70270db6c5b6a91f9a8e1b944291823ec5d89';
    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.text();

    const isValidRequest = verifyKey(body, signature!, timestamp!, PUBLIC_KEY);

    if (!isValidRequest) {
      return new Response('Bad request signature', { status: 401 });
    }

    const interaction = JSON.parse(body);

    // Initial Interaction check (Required by Discord)
    if (interaction.type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Handle Events (Simulated for Interactions if using Discord HTTP webhooks)
    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // Note: raw events like GUILD_CREATE/MESSAGE_CREATE are typically Gateway, 
    // but here we handle them via incoming webhooks or interaction hooks.
    if (interaction.type === 4 || interaction.event_type) {
      const event = interaction.event_type || interaction.data?.name;

      if (event === 'GUILD_CREATE') {
        const guild = interaction.data;
        await supabase.from('communities').upsert({
          guild_id: guild.id,
          guild_name: guild.name,
          is_active: true
        });
      }

      if (event === 'MESSAGE_CREATE') {
        const msg = interaction.data;
        await supabase.from('member_activity').upsert({
          guild_id: msg.guild_id,
          discord_id: msg.author.id,
          username: msg.author.username,
          last_message_at: new Date().toISOString()
        }, { onConflict: 'guild_id,discord_id' });
      }
    }

    return new Response(JSON.stringify({ type: 1 }), {
      headers: { 'Content-Type': 'application/json' },
    });
  },
};
