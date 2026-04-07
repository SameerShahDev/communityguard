import { NextRequest, NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/edge';

export const runtime = 'edge';

// Discord Interaction Types
const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2,
  MESSAGE_COMPONENT: 3,
  APPLICATION_COMMAND_AUTOCOMPLETE: 4,
  MODAL_SUBMIT: 5
};

// Discord Interaction Response Types
const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4,
  DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE: 5,
  DEFERRED_UPDATE_MESSAGE: 6,
  UPDATE_MESSAGE: 7,
  APPLICATION_COMMAND_AUTOCOMPLETE_RESULT: 8,
  MODAL: 9
};

// Convert hex string to Uint8Array
function hexToUint8Array(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Convert Uint8Array to ArrayBuffer
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

// Verify Discord signature using Ed25519
async function verifyDiscordSignature(
  publicKey: string,
  signature: string,
  timestamp: string,
  body: string
): Promise<boolean> {
  try {
    const publicKeyBytes = hexToUint8Array(publicKey);
    const signatureBytes = hexToUint8Array(signature);
    const messageBytes = new TextEncoder().encode(timestamp + body);

    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(publicKeyBytes),
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    return await crypto.subtle.verify('Ed25519', cryptoKey, toArrayBuffer(signatureBytes), messageBytes);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Handle member join
async function handleMemberJoin(guildId: string, member: any, supabase: any) {
  console.log(`Member joined: ${member.user?.username} in guild ${guildId}`);
  
  const { error } = await supabase
    .from('member_activity')
    .upsert({
      guild_id: guildId,
      discord_id: member.user?.id,
      username: member.user?.username,
      joined_at: member.joined_at || new Date().toISOString(),
      last_message_at: new Date().toISOString()
    }, { onConflict: 'guild_id,discord_id' });

  if (error) {
    console.error('Error saving member join:', error);
    return { success: false, error };
  }

  // Update community member count
  await updateCommunityStats(guildId, supabase);
  
  return { success: true };
}

// Handle member leave
async function handleMemberLeave(guildId: string, user: any, supabase: any) {
  console.log(`Member left: ${user.username} from guild ${guildId}`);
  
  const { error } = await supabase
    .from('member_activity')
    .delete()
    .eq('guild_id', guildId)
    .eq('discord_id', user.id);

  if (error) {
    console.error('Error removing member:', error);
    return { success: false, error };
  }

  // Update community stats
  await updateCommunityStats(guildId, supabase);
  
  return { success: true };
}

// Handle message create (activity tracking)
async function handleMessageCreate(guildId: string, message: any, supabase: any) {
  // Skip bot messages
  if (message.author?.bot) return { success: true, skipped: true };

  const { error } = await supabase
    .from('member_activity')
    .upsert({
      guild_id: guildId,
      discord_id: message.author?.id,
      username: message.author?.username,
      last_message_at: new Date().toISOString()
    }, { onConflict: 'guild_id,discord_id' });

  if (error) {
    console.error('Error updating activity:', error);
    return { success: false, error };
  }

  return { success: true };
}

// Handle guild create (bot added to server)
async function handleGuildCreate(guild: any, supabase: any) {
  console.log(`Bot added to guild: ${guild.name} (${guild.id})`);
  
  const { error } = await supabase
    .from('communities')
    .upsert({
      guild_id: guild.id,
      guild_name: guild.name,
      member_count: guild.member_count || 0,
      is_active: true,
      updated_at: new Date().toISOString()
    }, { onConflict: 'guild_id' });

  if (error) {
    console.error('Error saving guild:', error);
    return { success: false, error };
  }

  return { success: true };
}

// Handle guild delete (bot removed)
async function handleGuildDelete(guildId: string, supabase: any) {
  console.log(`Bot removed from guild: ${guildId}`);
  
  const { error } = await supabase
    .from('communities')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('guild_id', guildId);

  if (error) {
    console.error('Error deactivating guild:', error);
    return { success: false, error };
  }

  return { success: true };
}

// Handle guild member update (roles, nickname changes)
async function handleMemberUpdate(guildId: string, member: any, supabase: any) {
  const { error } = await supabase
    .from('member_activity')
    .upsert({
      guild_id: guildId,
      discord_id: member.user?.id,
      username: member.nick || member.user?.username,
      roles: member.roles,
      updated_at: new Date().toISOString()
    }, { onConflict: 'guild_id,discord_id' });

  if (error) {
    console.error('Error updating member:', error);
    return { success: false, error };
  }

  return { success: true };
}

// Update community stats (member count, etc.)
async function updateCommunityStats(guildId: string, supabase: any) {
  try {
    const { count } = await supabase
      .from('member_activity')
      .select('*', { count: 'exact', head: true })
      .eq('guild_id', guildId);

    await supabase
      .from('communities')
      .update({ 
        member_count: count || 0,
        updated_at: new Date().toISOString()
      })
      .eq('guild_id', guildId);
  } catch (e) {
    console.error('Error updating community stats:', e);
  }
}

// Calculate churn risk score
async function calculateChurnScore(guildId: string, discordId: string, supabase: any) {
  try {
    const { data: member } = await supabase
      .from('member_activity')
      .select('*')
      .eq('guild_id', guildId)
      .eq('discord_id', discordId)
      .single();

    if (!member) return;

    const lastMessage = new Date(member.last_message_at);
    const now = new Date();
    const daysSinceMessage = Math.floor((now.getTime() - lastMessage.getTime()) / (1000 * 60 * 60 * 24));

    let riskLevel = 'ACTIVE';
    let score = 0;

    if (daysSinceMessage > 30) {
      riskLevel = 'HIGH_RISK';
      score = 80 + Math.min(daysSinceMessage - 30, 20);
    } else if (daysSinceMessage > 14) {
      riskLevel = 'SILENT';
      score = 40 + Math.min(daysSinceMessage - 14, 40);
    } else if (daysSinceMessage > 7) {
      score = 20 + Math.min(daysSinceMessage - 7, 20);
    } else {
      score = Math.max(0, daysSinceMessage * 3);
    }

    // Update churn_scores table
    await supabase
      .from('churn_scores')
      .upsert({
        member_id: member.id,
        score: score,
        risk_level: riskLevel,
        updated_at: new Date().toISOString()
      }, { onConflict: 'member_id' });

  } catch (e) {
    console.error('Error calculating churn score:', e);
  }
}

// POST handler for Discord webhooks
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');

  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
  }

  // Verify signature
  const publicKey = process.env.DISCORD_PUBLIC_KEY!;
  const isValid = await verifyDiscordSignature(publicKey, signature, timestamp, body);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const data = JSON.parse(body);
  console.log('Discord webhook received:', { type: data.t, event: data.op });

  // Handle Discord Ping (URL verification)
  if (data.type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG });
  }

  const supabase = createServiceClient();
  let result = { success: true };

  // Handle different event types
  try {
    switch (data.t) {
      case 'GUILD_CREATE':
        result = await handleGuildCreate(data.d, supabase);
        break;
      
      case 'GUILD_DELETE':
        result = await handleGuildDelete(data.d?.id, supabase);
        break;
      
      case 'GUILD_MEMBER_ADD':
        result = await handleMemberJoin(data.d?.guild_id, data.d, supabase);
        break;
      
      case 'GUILD_MEMBER_REMOVE':
        result = await handleMemberLeave(data.d?.guild_id, data.d?.user, supabase);
        break;
      
      case 'GUILD_MEMBER_UPDATE':
        result = await handleMemberUpdate(data.d?.guild_id, data.d, supabase);
        break;
      
      case 'MESSAGE_CREATE':
        // Only track messages in guilds (not DMs)
        if (data.d?.guild_id) {
          result = await handleMessageCreate(data.d.guild_id, data.d, supabase);
          // Update churn score for active members
          if (result.success) {
            await calculateChurnScore(data.d.guild_id, data.d.author?.id, supabase);
          }
        }
        break;
      
      case 'MESSAGE_UPDATE':
        // Track message updates as activity
        if (data.d?.guild_id) {
          result = await handleMessageCreate(data.d.guild_id, data.d, supabase);
        }
        break;
      
      case 'INTERACTION_CREATE':
        // Handle slash commands and interactions
        return handleInteraction(data.d);
      
      default:
        console.log(`Unhandled event type: ${data.t}`);
    }
  } catch (error) {
    console.error('Error handling webhook:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }

  return NextResponse.json({ 
    status: 'ok',
    event: data.t,
    processed: result.success
  });
}

// Handle Discord Interactions (slash commands)
function handleInteraction(interaction: any) {
  const { type, data: interactionData } = interaction;

  // Handle ping
  if (type === InteractionType.PING) {
    return NextResponse.json({ type: InteractionResponseType.PONG });
  }

  // Handle slash commands
  if (type === InteractionType.APPLICATION_COMMAND) {
    const commandName = interactionData?.name;
    
    switch (commandName) {
      case 'health':
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '🛡️ CommunityGuard is active and monitoring this server!',
            embeds: [{
              title: 'Server Health Status',
              description: 'Bot is tracking member activity and churn risk.',
              color: 0x5865F2,
              fields: [
                { name: 'Status', value: '🟢 Active', inline: true },
                { name: 'Monitoring', value: '✅ Enabled', inline: true }
              ]
            }]
          }
        });
      
      case 'stats':
        return NextResponse.json({
          type: InteractionResponseType.DEFERRED_CHANNEL_MESSAGE_WITH_SOURCE
        });
      
      default:
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: 'Unknown command' }
        });
    }
  }

  return NextResponse.json({ type: InteractionResponseType.PONG });
}

// GET handler for webhook verification
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Discord URL verification challenge
  const challenge = searchParams.get('challenge');
  if (challenge) {
    return NextResponse.json({ challenge });
  }

  // Health check endpoint
  return NextResponse.json({ 
    status: 'webhook ready',
    timestamp: new Date().toISOString(),
    features: [
      'GUILD_CREATE - Bot added to server',
      'GUILD_DELETE - Bot removed from server',
      'GUILD_MEMBER_ADD - Member joined',
      'GUILD_MEMBER_REMOVE - Member left',
      'GUILD_MEMBER_UPDATE - Member updated',
      'MESSAGE_CREATE - Message sent',
      'MESSAGE_UPDATE - Message edited',
      'INTERACTION_CREATE - Slash commands'
    ]
  });
}
