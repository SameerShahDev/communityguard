import { createClient } from '@supabase/supabase-js';

export default {
  async scheduled(event, env, ctx) {
    const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    // 1. Fetch all member activity
    const { data: activities, error: fetchError } = await supabase
      .from('member_activity')
      .select('community_id, discord_id, last_seen');

    if (fetchError) {
      console.error('Error fetching activity:', fetchError);
      return;
    }

    const now = new Date();
    const scoresToUpsert = activities.map(activity => {
      const lastSeen = new Date(activity.last_seen);
      const diffInMs = now.getTime() - lastSeen.getTime();
      const daysSilent = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      
      // Formula: daysSilent * 3 + 50 (capped at 100)
      let score = (daysSilent * 3) + 50;
      if (score > 100) score = 100;

      let riskLevel = 'ACTIVE';
      if (score > 80) riskLevel = 'CRITICAL';
      else if (score >= 42) riskLevel = 'SILENT';

      return {
        member_id: activity.discord_id,
        community_id: activity.community_id,
        score: score,
        risk_level: riskLevel,
        updated_at: now.toISOString()
      };
    });

    // 2. Batch upsert into churn_scores
    if (scoresToUpsert.length > 0) {
      const { error: upsertError } = await supabase
        .from('churn_scores')
        .upsert(scoresToUpsert, { onConflict: 'member_id, community_id' });

      if (upsertError) {
        console.error('Error upserting scores:', upsertError);
      } else {
        console.log(`Successfully updated ${scoresToUpsert.length} churn scores.`);
      }
    }
  },

  // Also allow manual trigger via fetch if needed
  async fetch(request, env, ctx) {
    if (request.method === 'POST') {
      await this.scheduled(null, env, ctx);
      return new Response('Churn calculation triggered manually.', { status: 200 });
    }
    return new Response('CommunityGuard Churn Worker', { status: 200 });
  }
};

/*
WRANGLER CONFIG (wrangler.toml):
name = "communityguard-churn-worker"
main = "index.ts"
compatibility_date = "2024-01-01"

[triggers]
crons = [ "30 18 * * *" ] # 12 AM IST is 6:30 PM UTC

[vars]
SUPABASE_URL = "your-project-url"
# SUPABASE_SERVICE_ROLE_KEY should be added via 'wrangler secret put'
*/
