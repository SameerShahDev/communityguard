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

    const keyData = await crypto.subtle.importKey(
      'raw',
      publicKeyBytes,
      { name: 'NODE-ED25519', namedCurve: 'NODE-ED25519' },
      false,
      ['verify']
    );

    const isValid = await crypto.subtle.verify(
      'NODE-ED25519',
      keyData,
      signatureBytes,
      messageBytes
    );

    return isValid;
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// Calculate churn score based on member activity
function calculateChurnScore(lastMessageDays: number, totalMessages: number): number {
  const recencyWeight = 0.6;
  const activityWeight = 0.4;
  
  const recencyScore = Math.min(100, (lastMessageDays / 30) * 100);
  const activityScore = Math.max(0, Math.min(100, 100 - (totalMessages / 10) * 100));
  
  return Math.round((recencyScore * recencyWeight) + (activityScore * activityWeight));
}

export async function POST(req: NextRequest) {
  try {
    const signature = req.headers.get('x-signature-ed25519');
    const timestamp = req.headers.get('x-signature-timestamp');
    const body = await req.text();

    const publicKey = process.env.DISCORD_PUBLIC_KEY;

    if (!signature || !timestamp || !publicKey) {
      return NextResponse.json({ error: 'Missing verification headers' }, { status: 401 });
    }

    const isValid = await verifyDiscordSignature(publicKey, signature, timestamp, body);

    if (!isValid) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const interaction = JSON.parse(body);

    switch (interaction.type) {
      case InteractionType.PING:
        return NextResponse.json({ type: InteractionResponseType.PONG });

      case InteractionType.APPLICATION_COMMAND:
        return NextResponse.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'Discord webhook is now hosted separately! Use the main app for full features.',
            flags: 64 // Ephemeral message
          }
        });

      default:
        return NextResponse.json({ error: 'Unknown interaction type' }, { status: 400 });
    }
  } catch (error) {
    console.error('Discord webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
