# Discord Public Key Setup

## 1. Go to Vercel Dashboard
- Visit: https://vercel.com/sameers-projects-b555ccfa/communityguard-webhook/settings/environment-variables

## 2. Add Environment Variable
- Variable Name: `DISCORD_PUBLIC_KEY`
- Value: `ab7bb98cf73a632bceb12d0314e70270db6c5b6a91f9a8e1b944291823ec5d89`
- Environments: Production, Preview, Development
- Target: All

## 3. Redeploy After Adding
```bash
cd a:\igone\communityguard\worker
vercel --prod
```

## 4. Test Webhook
```bash
curl -X POST https://communityguard-webhook.vercel.app/api/webhook \
  -H "Content-Type: application/json" \
  -d '{"type": 1}'
```

## 5. Discord Developer Portal Update
- Go to Discord Developer Portal
- Select your application
- Set Interactions Endpoint URL: `https://communityguard-webhook.vercel.app/api/webhook`

## Current Status
- Webhook deployed: https://communityguard-webhook.vercel.app
- Endpoint: /api/webhook
- Missing: DISCORD_PUBLIC_KEY environment variable
