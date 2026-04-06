import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const runtime = 'edge';

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

// Verify Discord webhook signature using Web Crypto API
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

    // Import the public key
    const cryptoKey = await crypto.subtle.importKey(
      'raw',
      toArrayBuffer(publicKeyBytes),
      { name: 'Ed25519' },
      false,
      ['verify']
    );

    // Verify the signature
    return await crypto.subtle.verify('Ed25519', cryptoKey, toArrayBuffer(signatureBytes), messageBytes);
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

export const POST = async (req: NextRequest) => {
  const body = await req.text();
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');

  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
  }

  // Verify Discord webhook signature
  const publicKey = process.env.DISCORD_PUBLIC_KEY!;
  const isValid = await verifyDiscordSignature(publicKey, signature, timestamp, body);

  if (!isValid) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  const data = JSON.parse(body);

  // Handle guild add event (when bot is added to server)
  if (data.t === 'GUILD_CREATE' || data.t === 'GUILD_MEMBER_ADD') {
    const guild = data.d;
    
    const supabase = await createClient();
    
    // Find the user who authorized this bot installation
    // This would typically come from the OAuth flow
    const { error } = await supabase
      .from('communities')
      .upsert({
        user_id: guild.owner_id || 'temp_user_id', // This would come from OAuth state
        guild_id: guild.id,
        guild_name: guild.name,
        is_active: true
      }, { onConflict: 'guild_id' });

    if (error) {
      console.error('Error saving community:', error);
    }
  }

  return NextResponse.json({ status: 'ok' });
};

export const GET = async (req: NextRequest) => {
  // Discord webhook verification
  const { searchParams } = new URL(req.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ status: 'webhook ready' });
};
