const express = require('express');
const nacl = require('tweetnacl');
const app = express();

// Store raw body for signature verification
app.use(express.json({ 
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));

// Discord Interaction Types
const InteractionType = {
  PING: 1,
  APPLICATION_COMMAND: 2
};

// Discord Interaction Response Types
const InteractionResponseType = {
  PONG: 1,
  CHANNEL_MESSAGE_WITH_SOURCE: 4
};

// EXACT Discord Public Key from Developer Portal
const DISCORD_PUBLIC_KEY = 'ab7bb98cf73a632bceb12d0314e70270db6c5b6a91f9a8e1b944291823ec5d89';

// Function to verify Discord Ed25519 signature using tweetnacl
function verifyDiscordSignature(publicKey, signature, timestamp, rawBody) {
  try {
    console.log('🔐 Verifying Discord signature with tweetnacl...');
    
    // Convert hex strings to Uint8Array
    const publicKeyBuffer = Buffer.from(publicKey, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');
    
    // Message = timestamp + raw body
    const message = Buffer.from(timestamp + rawBody);
    
    console.log('📊 Verification details:');
    console.log('  Public Key length:', publicKeyBuffer.length);
    console.log('  Signature length:', signatureBuffer.length);
    console.log('  Message length:', message.length);
    
    // Use tweetnacl for Ed25519 verification (Discord's exact method)
    const isValid = nacl.sign.detached.verify(
      new Uint8Array(message),
      new Uint8Array(signatureBuffer),
      new Uint8Array(publicKeyBuffer)
    );

    console.log('✅ Signature verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('❌ Signature verification error:', error.message);
    console.error('Error stack:', error.stack);
    return false;
  }
}

// Main webhook endpoint
app.post('/api/webhook', (req, res) => {
  try {
    console.log('\n🚀 === Discord Webhook Request ===');
    console.log('⏰ Timestamp:', new Date().toISOString());
    
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    const rawBody = req.rawBody ? req.rawBody.toString() : JSON.stringify(req.body);

    console.log('📨 Headers received:');
    console.log('  x-signature-ed25519:', signature ? '✅ present' : '❌ missing');
    console.log('  x-signature-timestamp:', timestamp ? '✅ present' : '❌ missing');
    console.log('  content-type:', req.headers['content-type']);
    
    console.log('📦 Body received:', rawBody);

    // Set proper response headers
    res.setHeader('Content-Type', 'application/json');

    // Check for required Discord headers
    if (!signature || !timestamp) {
      console.log('❌ Missing Discord security headers');
      return res.status(401).json({ 
        error: 'Missing Discord security headers'
      });
    }

    // Verify Discord signature using EXACT public key
    const isValid = verifyDiscordSignature(DISCORD_PUBLIC_KEY, signature, timestamp, rawBody);

    if (!isValid) {
      console.log('❌ Invalid Discord signature');
      return res.status(401).json({ 
        error: 'Invalid Discord signature'
      });
    }

    console.log('✅ Signature verified successfully');

    const interaction = req.body;
    console.log('🎯 Interaction type:', interaction.type);

    // Handle different interaction types
    switch (interaction.type) {
      case InteractionType.PING:
        console.log('🏓 Discord PING received, sending PONG');
        // Discord expects EXACTLY this response: {"type": 1}
        return res.status(200).json({ 
          type: InteractionResponseType.PONG 
        });

      case InteractionType.APPLICATION_COMMAND:
        console.log('📝 Discord Application Command received');
        return res.status(200).json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '🛡️ CommunityGuard Discord Webhook is working! Use the main application for full features.',
            flags: 64
          }
        });

      default:
        console.log('❓ Unknown Discord interaction type:', interaction.type);
        return res.status(400).json({ 
          error: 'Unknown interaction type'
        });
    }
  } catch (error) {
    console.error('❌ Discord webhook error:', error.message);
    return res.status(500).json({ 
      error: 'Internal server error'
    });
  }
});

// CORS preflight handler
app.options('/api/webhook', (req, res) => {
  console.log('🔄 OPTIONS request received');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-signature-ed25519, x-signature-timestamp');
  res.status(200).end();
});

// Health check endpoint
app.get('/api/webhook', (req, res) => {
  res.json({
    status: 'ok',
    message: 'CommunityGuard Discord webhook is running (tweetnacl version)',
    publicKey: 'configured',
    version: '4.0.0',
    timestamp: new Date().toISOString()
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'CommunityGuard Discord Webhook',
    status: 'running',
    version: '4.0.0',
    endpoints: {
      webhook: '/api/webhook (POST)',
      health: '/api/webhook (GET)'
    },
    publicKey: 'configured',
    library: 'tweetnacl'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 CommunityGuard Discord Webhook v4.0.0 (tweetnacl)`);
  console.log(`📡 Running on port ${PORT}`);
  console.log(`🔗 Webhook endpoint: http://localhost:${PORT}/api/webhook`);
  console.log(`🏥 Health check: http://localhost:${PORT}/api/webhook`);
  console.log(`🔐 Discord Public Key: ${DISCORD_PUBLIC_KEY.substring(0, 20)}...`);
  console.log(`📚 Using tweetnacl for Ed25519 verification`);
  console.log(`✅ Ready for Discord verification!`);
});

module.exports = app;
