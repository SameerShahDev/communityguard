// IGone Worker - TypeScript enabled
import { createClient } from '@supabase/supabase-js';

interface Env {
  SUPABASE_URL: string;
  SUPABASE_SERVICE_ROLE_KEY: string;
}

interface ScheduledEvent {
  type: 'scheduled';
  cron: string;
  scheduledTime: number;
}

interface ExecutionContext {
  waitUntil(promise: Promise<any>): void;
  passThroughOnException(): void;
}

export default {
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch all member activity with IDs for FK relationship
    const { data: activities, error: fetchError } = await supabase
      .from('member_activity')
      .select('id, guild_id, discord_id, last_message_at, username');

    if (fetchError || !activities) {
      console.error('Error fetching activity:', fetchError);
      return;
    }

    const now = new Date();
    const scoresToUpsert = activities.map(activity => {
      const lastSeen = new Date(activity.last_message_at);
      const diffInMs = now.getTime() - lastSeen.getTime();
      const daysSilent = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      // Formula: daysSilent * 3 + 50 (capped at 100)
      let score = (daysSilent * 3) + 50;
      if (score > 100) score = 100;

      // Risk Levels based on new enum: ACTIVE, SILENT, HIGH_RISK
      let riskLevel: 'ACTIVE' | 'SILENT' | 'HIGH_RISK' = 'ACTIVE';
      if (score > 80) riskLevel = 'HIGH_RISK';
      else if (score >= 65) riskLevel = 'SILENT';

      return {
        member_id: activity.id, // FK to member_activity.id
        score: score,
        risk_level: riskLevel,
        member_name: activity.username,
        updated_at: now.toISOString()
      };
    });

    // 2. Batch upsert into churn_scores
    if (scoresToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('churn_scores')
        .upsert(scoresToUpsert, { onConflict: 'member_id' });

      if (upsertError) {
        console.error('Error upserting scores:', upsertError);
      } else {
        console.log(`Successfully updated ${scoresToUpsert.length} churn scores.`);
      }
    }
  },

  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    if (request.method === 'POST') {
      const mockEvent: ScheduledEvent = {
        type: 'scheduled',
        cron: 'manual',
        scheduledTime: Date.now()
      };
      await this.scheduled(mockEvent, env, ctx);
      return new Response('Churn calculation triggered manually.', { status: 200 });
    }
    return new Response('IGone Churn Worker - Active', { status: 200 });
  }
};

/*
WRANGLER CONFIG (wrangler.toml):
name = "igone-churn-worker"
main = "index.ts"
compatibility_date = "2024-01-01"

[triggers]
crons = [ "30 18 * * *" ] # 12 AM IST is 6:30 PM UTC

[vars]
SUPABASE_URL = "your-project-url"
# SUPABASE_SERVICE_ROLE_KEY should be added via 'wrangler secret put'
*/
