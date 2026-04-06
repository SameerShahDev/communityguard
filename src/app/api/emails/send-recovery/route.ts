import { NextResponse } from 'next/server';
import { createEdgeClient } from '@/lib/supabase/edge';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const supabase = createEdgeClient();
    
    // Get current user
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // Get high-risk members from database
    const { data: atRiskMembers, error: membersError } = await supabase
      .from('churn_scores')
      .select(`
        member_id,
        risk_level,
        score,
        member_email,
        member_name,
        updated_at
      `)
      .in('risk_level', ['HIGH_RISK', 'SILENT'])
      .order('score', { ascending: false })
      .limit(100);

    if (membersError) {
      console.error('Failed to fetch at-risk members:', membersError);
      return NextResponse.json({ error: 'Failed to fetch members' }, { status: 500 });
    }

    if (!atRiskMembers || atRiskMembers.length === 0) {
      return NextResponse.json({ 
        sent: 0, 
        recovered: 0,
        message: 'No at-risk members found' 
      });
    }

    // Send recovery emails
    const resendApiKey = process.env.RESEND_API_KEY;
    if (!resendApiKey) {
      return NextResponse.json({ error: 'Email service not configured' }, { status: 500 });
    }

    let sentCount = 0;
    let failedCount = 0;

    for (const member of atRiskMembers) {
      if (!member.member_email) {
        failedCount++;
        continue;
      }

      try {
        await sendRecoveryEmail({
          to: member.member_email,
          memberName: member.member_name || 'Member',
          riskLevel: member.risk_level,
          score: member.score,
        }, resendApiKey);
        
        sentCount++;
        
        // Log email sent
        await supabase.from('email_logs').insert({
          member_id: member.member_id,
          email: member.member_email,
          type: 'recovery',
          sent_at: new Date().toISOString(),
        });
      } catch (emailError) {
        console.error(`Failed to send email to ${member.member_email}:`, emailError);
        failedCount++;
      }
    }

    // Estimate recovered members (industry avg: ~35% open rate, ~15% click-through)
    const estimatedRecovered = Math.round(sentCount * 0.15);

    return NextResponse.json({
      sent: sentCount,
      failed: failedCount,
      recovered: estimatedRecovered,
      message: `Sent ${sentCount} recovery emails. Estimated ${estimatedRecovered} members will return.`
    });

  } catch (error) {
    console.error('Send recovery emails error:', error);
    return NextResponse.json(
      { error: 'Failed to send recovery emails' },
      { status: 500 }
    );
  }
}

interface RecoveryEmailParams {
  to: string;
  memberName: string;
  riskLevel: string;
  score: number;
}

async function sendRecoveryEmail(params: RecoveryEmailParams, apiKey: string) {
  const { to, memberName, riskLevel } = params;
  
  const subject = riskLevel === 'HIGH_RISK' 
    ? "We miss you! Come back to your community 🎮"
    : "New discussions waiting for you 💬";

  const urgencyText = riskLevel === 'HIGH_RISK'
    ? "It's been a while since your last visit. Your community is asking about you!"
    : "Catch up on what you missed while you were away.";

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'CommunityGuard <noreply@communityguard.ai>',
      to,
      subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>We Miss You!</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5;">
            <tr>
              <td align="center" style="padding: 40px 20px;">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                  
                  <!-- Header -->
                  <tr>
                    <td style="background: linear-gradient(135deg, #5865F2, #4752c4); padding: 40px 30px; text-align: center;">
                      <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: bold;">Hey ${memberName}! 👋</h1>
                      <p style="color: #e0e0ff; margin: 10px 0 0 0; font-size: 16px;">Your community misses you</p>
                    </td>
                  </tr>
                  
                  <!-- Content -->
                  <tr>
                    <td style="padding: 40px 30px;">
                      <p style="font-size: 16px; line-height: 1.6; color: #333333; margin-bottom: 20px;">
                        ${urgencyText}
                      </p>
                      
                      <div style="background-color: #f8f9fa; border-left: 4px solid #5865F2; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                        <h3 style="color: #5865F2; margin-top: 0; font-size: 18px;">🔥 While you were away:</h3>
                        <ul style="color: #555555; line-height: 1.8; padding-left: 20px;">
                          <li>23 new discussions started</li>
                          <li>5 members mentioned you</li>
                          <li>3 exclusive events happened</li>
                          <li>New leaderboard rankings!</li>
                        </ul>
                      </div>
                      
                      <div style="text-align: center; margin: 35px 0;">
                        <a href="https://discord.com/channels/@me" 
                           style="background: linear-gradient(135deg, #5865F2, #4752c4); 
                                  color: #ffffff; 
                                  padding: 16px 40px; 
                                  text-decoration: none; 
                                  border-radius: 8px; 
                                  display: inline-block; 
                                  font-weight: bold; 
                                  font-size: 16px;
                                  box-shadow: 0 4px 15px rgba(88,101,242,0.4);">
                          🔥 Jump Back In
                        </a>
                      </div>
                      
                      <p style="font-size: 14px; color: #666666; text-align: center; margin-top: 30px;">
                        Or copy this link: <code style="background: #f0f0f0; padding: 4px 8px; border-radius: 4px;">discord.gg/your-server</code>
                      </p>
                    </td>
                  </tr>
                  
                  <!-- Footer -->
                  <tr>
                    <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e0e0e0;">
                      <p style="font-size: 12px; color: #888888; margin: 0;">
                        This email was sent by CommunityGuard to help reduce community churn.<br>
                        <a href="#" style="color: #5865F2;">Unsubscribe</a> • 
                        <a href="#" style="color: #5865F2;">Update preferences</a>
                      </p>
                    </td>
                  </tr>
                  
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    }),
  });

  if (!response.ok) {
    const errorData = await response.text();
    throw new Error(`Resend API error: ${errorData}`);
  }
}
