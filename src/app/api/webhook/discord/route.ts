import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import crypto from 'crypto';

export const runtime = 'edge';

export const POST = async (req: NextRequest) => {
  const body = await req.text();
  const signature = req.headers.get('x-signature-ed25519');
  const timestamp = req.headers.get('x-signature-timestamp');

  if (!signature || !timestamp) {
    return NextResponse.json({ error: 'Missing signature headers' }, { status: 401 });
  }

  // Verify Discord webhook signature
  const publicKey = process.env.DISCORD_PUBLIC_KEY!;
  const message = timestamp + body;
  const expectedSignature = crypto.sign(null, Buffer.from(message), publicKey).toString('hex');
  
  if (signature !== expectedSignature) {
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
