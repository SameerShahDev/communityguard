import { Client, GatewayIntentBits } from 'discord.js';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

// Load environment from Next.js project root
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// Setup Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Setup Discord Client
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

client.once('ready', () => {
  console.log(`🤖 CommunityGuard Discord Bot Online: ${client.user?.tag}`);
});

// Track member activity
client.on('messageCreate', async (message) => {
  if (message.author.bot || !message.guild) return;

  const discordId = message.author.id;
  const guildId = message.guild.id;

  // Track activity silently
  // Check if community exists in DB
  const { data: community } = await supabase
    .from('communities')
    .select('id')
    .eq('discord_server_id', guildId)
    .single();

  if (community) {
    // Upsert the activity
    await supabase.from('member_activity').upsert({
      community_id: community.id,
      discord_id: discordId,
      last_seen: new Date().toISOString()
    }, { onConflict: 'community_id, discord_id' });
  }
});

// Guild Create (When bot is added to a new server)
client.on('guildCreate', async (guild) => {
  console.log(`Joined new guild: ${guild.name}`);
  // Web application will map the Guild ID to the User ID via OAuth or dashboard manual link.
});

client.login(process.env.DISCORD_BOT_TOKEN);
