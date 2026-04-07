const express = require('express');
const crypto = require('crypto');

const app = express();
app.use(express.json());

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

// Verify Discord signature using Ed25519
function verifyDiscordSignature(publicKey, signature, timestamp, body) {
  try {
    const message = timestamp + body;
    const publicKeyBuffer = Buffer.from(publicKey, 'hex');
    const signatureBuffer = Buffer.from(signature, 'hex');
    const messageBuffer = Buffer.from(message);

    return crypto.verify(
      'sha256',
      messageBuffer,
      {
        key: publicKeyBuffer,
        format: 'der',
        type: 'spki'
      },
      signatureBuffer
    );
  } catch (error) {
    console.error('Signature verification failed:', error);
    return false;
  }
}

// Main webhook endpoint - simplified for testing
app.post('/api/webhook', (req, res) => {
  try {
    const interaction = req.body;
    console.log('Interaction received:', interaction);

    switch (interaction.type) {
      case InteractionType.PING:
        console.log('PING received, sending PONG');
        return res.json({ type: InteractionResponseType.PONG });

      case InteractionType.APPLICATION_COMMAND:
        console.log('Application command received');
        return res.json({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: {
            content: 'CommunityGuard Discord Webhook is working! Use the main app for full features.',
            flags: 64 // Ephemeral message
          }
        });

      default:
        console.log('Unknown interaction type:', interaction.type);
        return res.status(400).json({ error: 'Unknown interaction type' });
    }
  } catch (error) {
    console.error('Discord webhook error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.send('Discord Webhook is running! POST to /api/webhook');
});

app.get('/api/webhook', (req, res) => {
  res.send('Discord Webhook endpoint is ready! POST to this endpoint.');
});

// Discord verification endpoint
app.get('/api/webhook/verify', (req, res) => {
  res.json({
    status: 'ok',
    endpoint: '/api/webhook',
    method: 'POST',
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Discord webhook running on port ${PORT}`);
});
