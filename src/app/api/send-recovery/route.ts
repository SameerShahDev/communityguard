import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import { TransactionalEmailsApi, SendSmtpEmail } from '@getbrevo/brevo';

// Initialize Brevo (Sendinblue) API client
const brevoClient = new TransactionalEmailsApi();
const apiKey = brevoClient.authentications['apiKey'];
apiKey.apiKey = process.env.BREVO_API_KEY!;

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. AUTH CHECK - Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    // 2. FETCH REAL HIGH RISK MEMBERS from churn_scores table
    const { data: highRiskMembers, error: dbError } = await supabase
      .from('churn_scores')
      .select(`
        discord_id,
        member_email,
        community_name,
        risk_score,
        community_id,
        username
      `)
      .eq('risk_level', 'HIGH_RISK')
      .is('recovery_attempted', false)  // Only send to those not yet emailed
      .limit(50);  // Rate limit protection - max 50 per request

    if (dbError) {
      console.error('Supabase query error:', dbError);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!highRiskMembers || highRiskMembers.length === 0) {
      return NextResponse.json({ 
        sent: 0, 
        failed: 0,
        message: 'No high-risk members found or all have been contacted' 
      });
    }

    let sent = 0;
    let failed = 0;
    const errors: string[] = [];

    // 3. SEND REAL EMAILS via Brevo API
    for (const member of highRiskMembers) {
      // Skip members without email
      if (!member.member_email) {
        console.log(`Skipping ${member.discord_id} - no email available`);
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(member.member_email)) {
        console.log(`Skipping ${member.discord_id} - invalid email: ${member.member_email}`);
        failed++;
        continue;
      }

      try {
        // Create Brevo email
        const sendSmtpEmail = new SendSmtpEmail();
        
        sendSmtpEmail.to = [{ email: member.member_email }];
        sendSmtpEmail.sender = { email: 'noreply@communityguard.ai', name: 'CommunityGuard' };
        sendSmtpEmail.subject = `We miss you in ${member.community_name}! 💙`;
        sendSmtpEmail.htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <title>We miss you!</title>
            </head>
            <body style="font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px;">
              <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="background: linear-gradient(135deg, #5865F2 0%, #7289DA 100%); padding: 40px 30px; text-align: center;">
                  <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">
                    Hey ${member.username || 'there'}! 👋
                  </h1>
                  <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">
                    We miss you in ${member.community_name}
                  </p>
                </div>
                
                <!-- Body -->
                <div style="padding: 40px 30px;">
                  <p style="color: #333; font-size: 16px; line-height: 1.6;">
                    It's been a while since we've seen you in our Discord community. Your presence matters to us!
                  </p>
                  
                  <div style="background: #f8f9fa; border-left: 4px solid #5865F2; padding: 20px; margin: 25px 0; border-radius: 0 8px 8px 0;">
                    <p style="margin: 0; color: #5865F2; font-weight: 600;">
                      📊 Risk Score: ${member.risk_score?.toFixed(1) || 'N/A'}/100
                    </p>
                    <p style="margin: 8px 0 0 0; color: #666; font-size: 14px;">
                      You're missing out on great conversations!
                    </p>
                  </div>
                  
                  <!-- CTA Button -->
                  <div style="text-align: center; margin: 35px 0;">
                    <a href="https://discord.com/channels/@me" 
                       style="display: inline-block; background: #5865F2; color: white; padding: 16px 40px; 
                              text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;
                              box-shadow: 0 4px 12px rgba(88, 101, 242, 0.3); transition: transform 0.2s;">
                      Rejoin the Community 🚀
                    </a>
                  </div>
                  
                  <p style="color: #666; font-size: 14px; line-height: 1.5;">
                    If you're no longer interested in being part of ${member.community_name}, you can ignore this email. Otherwise, we'd love to have you back!
                  </p>
                </div>
                
                <!-- Footer -->
                <div style="background: #f8f9fa; padding: 20px 30px; text-align: center; border-top: 1px solid #e9ecef;">
                  <p style="color: #999; font-size: 12px; margin: 0;">
                    Sent by CommunityGuard - AI-powered community management<br>
                    <a href="https://communityguard.ai" style="color: #5865F2; text-decoration: none;">communityguard.ai</a>
                  </p>
                </div>
              </div>
            </body>
            </html>
          `;

        // Send email via Brevo API
        const data = await brevoClient.sendTransacEmail(sendSmtpEmail);

        // Email sent successfully
        sent++;
        
        // 4. MARK AS ATTEMPTED in database
        const { error: updateError } = await supabase
          .from('churn_scores')
          .update({ 
            recovery_attempted: true, 
            last_email_sent: new Date().toISOString(),
            message_id: data.messageId  // Store Brevo message ID for tracking
          })
          .eq('discord_id', member.discord_id)
          .eq('community_id', member.community_id);

        if (updateError) {
          console.error(`Failed to update record for ${member.discord_id}:`, updateError);
        }

        // Add small delay to respect rate limits (Brevo: 300 emails/second)
        if (sent % 10 === 0) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }

      } catch (emailError: any) {
        console.error(`Failed to email ${member.member_email}:`, emailError);
        failed++;
        errors.push(`${member.member_email}: ${emailError.message}`);
      }
    }

    // 5. LOG ACTIVITY for analytics
    await supabase.from('email_logs').insert({
      user_id: user.id,
      sent_count: sent,
      failed_count: failed,
      total_members: highRiskMembers.length,
      created_at: new Date().toISOString()
    });

    return NextResponse.json({ 
      sent, 
      failed, 
      total: highRiskMembers.length,
      message: `Sent ${sent} recovery emails. ${failed} failed.` 
    });

  } catch (error: any) {
    console.error('Send recovery error:', error);
    return NextResponse.json({ 
      error: 'Server error', 
      details: error.message 
    }, { status: 500 });
  }
}
