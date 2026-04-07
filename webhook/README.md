# Discord Webhook - Vercel Deployment

## Quick Deploy Steps

### 1. Go to Webhook Folder
```bash
cd webhook
```

### 2. Install Vercel CLI
```bash
npm i -g vercel
```

### 3. Login to Vercel
```bash
vercel login
```

### 4. Deploy
```bash
vercel
```

### 5. Add Environment Variable
```bash
vercel env add DISCORD_PUBLIC_KEY
# Paste your Discord Public Key when prompted
```

### 6. Deploy to Production
```bash
vercel --prod
```

## Discord Bot URL Configuration

After deployment, update your Discord Developer Portal:

**Interactions Endpoint URL:**
```
https://your-webhook-name.vercel.app/api/webhook
```

Replace `your-webhook-name` with your actual Vercel project name.

## Environment Variables
- `DISCORD_PUBLIC_KEY`: Your Discord application's public key

## Test Your Webhook
```bash
curl -X POST https://your-webhook-name.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": 1}'
```

## Files in This Folder
- `index.js` - Main webhook handler
- `package.json` - Dependencies
- `vercel.json` - Vercel configuration
