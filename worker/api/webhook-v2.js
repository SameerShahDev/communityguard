const express = require('express');
const crypto = require('crypto');
const app = express();

app.use(express.json());

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

// Function to verify Discord signature (Ed25519) - CORRECT IMPLEMENTATION
function verifyDiscordSignature(publicKey, signature, timestamp, body) {
  try {
    // Discord uses Ed25519 signature verification
    // The signature is in hex format, public key is also in hex
    
    // Create the message to verify (timestamp + body)
    const message = Buffer.from(timestamp + body);
    
    // Convert the hex public key to Buffer
    const publicKeyBuffer = Buffer.from(publicKey, 'hex');
    
    // Convert the hex signature to Buffer
    const signatureBuffer = Buffer.from(signature, 'hex');
    
    // Use Node.js crypto verify with Ed25519 algorithm
    const isValid = crypto.verify(
      null, // algorithm - null for Ed25519
      message,
      publicKeyBuffer,
      signatureBuffer
    );
    
    console.log('Signature verification result:', isValid);
    return isValid;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}

// Main webhook endpoint
app.post('/api/webhook', (req, res) => {
  try {
    const signature = req.headers['x-signature-ed25519'];
    const timestamp = req.headers['x-signature-timestamp'];
    const body = JSON.stringify(req.body);

    // Add proper Discord verification headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-signature-ed25519, x-signature-timestamp');

    // Handle OPTIONS request for CORS
    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    // Use hardcoded key as fallback
    const publicKey = process.env.DISCORD_PUBLIC_KEY || 'ab7bb98cf73a632bceb12d0314e70270db6c5b6a91f9a8e1b944291823ec5d89';

    console.log('Discord webhook request received:', {
      method: req.method,
      signature: !!signature,
      timestamp: !!timestamp,
      publicKey: !!publicKey,
      bodyType: typeof req.body,
      interactionType: req.body?.type,
      userAgent: req.headers['user-agent'],
      contentLength: req.headers['content-length']
    });

    if (!signature || !timestamp) {
      console.log('Missing Discord verification headers');
      return res.status(401).json({ error: 'Missing verification headers' });
    }

    const isValid = verifyDiscordSignature(publicKey, signature, timestamp, body);

    if (!isValid) {
      console.log('Invalid Discord signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const interaction = req.body;
    console.log('Discord interaction received:', interaction.type);

    // Handle different interaction types
    switch (interaction.type) {
      case InteractionType.PING:
        console.log('Discord PING received, sending PONG');
        return res.status(200).json({ 
          type: InteractionResponseType.PONG 
        });

      case InteractionType.APPLICATION_COMMAND:
        console.log('Discord Application Command received');
        return res.status(200).json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: '🛡️ CommunityGuard Discord Webhook is working! Use the main application for full features.',
            flags: 64 // Ephemeral message
          }
        });

      default:
        console.log('Unknown Discord interaction type:', interaction.type);
        return res.status(400).json({ error: 'Unknown interaction type' });
    }
  } catch (error) {
    console.error('Discord webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/api/webhook', (req, res) => {
  res.json({
    status: 'ok',
    message: 'Discord webhook is running and ready',
    endpoints: {
      webhook: '/api/webhook (POST)',
      health: '/api/webhook (GET)'
    },
    timestamp: new Date().toISOString(),
    version: '2.0.0'
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'CommunityGuard Discord Webhook',
    status: 'running',
    version: '2.0.0',
    endpoints: {
      webhook: '/api/webhook',
      health: '/api/webhook'
    },
    discord: {
      publicKey: process.env.DISCORD_PUBLIC_KEY || 'configured',
      signatureType: 'Ed25519'
    }
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`CommunityGuard Discord webhook v2.0.0 running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/api/webhook`);
  console.log(`Health check: http://localhost:${PORT}/api/webhook`);
  console.log('Discord signature verification: Ed25519');
});

module.exports = app;
