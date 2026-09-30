import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://esm.sh/zod@3.22.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

export type NotificationType =
  | "kyc_approved"
  | "kyc_rejected"
  | "idea_status_changed"
  | "team_join_request"
  | "hackathon_deadline_24h"
  | "results_published";

const SendNotificationSchema = z.object({
  userId: z.string().min(1, "Recipient userId is required"),
  type: z.enum([
    "kyc_approved",
    "kyc_rejected",
    "idea_status_changed",
    "team_join_request",
    "hackathon_deadline_24h",
    "results_published",
  ]),
  title: z.string().optional(),
  body: z.string().optional(),
  link: z.string().optional(),
  email: z.string().email().optional(),
  recipientName: z.string().optional(),
  metadata: z.record(z.any()).optional().default({}),
});

interface RenderedContent {
  title: string;
  body: string;
  link: string;
  category: "kyc" | "idea" | "team" | "hackathon" | "general";
  html: string;
}

function renderNotification(
  type: NotificationType,
  recipientName: string,
  meta: Record<string, any>,
  customTitle?: string,
  customBody?: string,
  customLink?: string
): RenderedContent {
  const brandCyan = "#00d2ff";
  const brandBg = "#0b0f19";
  const cardBg = "#151c2c";
  const textLight = "#f8fafc";
  const textMuted = "#94a3b8";

  let title = customTitle || "";
  let body = customBody || "";
  let link = customLink || "/";
  let category: "kyc" | "idea" | "team" | "hackathon" | "general" = "general";
  let badgeColor = brandCyan;
  let badgeText = "Notification";

  switch (type) {
    case "kyc_approved":
      category = "kyc";
      badgeColor = "#10b981";
      badgeText = "KYC Verified";
      title = customTitle || "🎉 KYC Identity Verification Approved!";
      body =
        customBody ||
        "Congratulations! Your student credentials have been officially verified. Your role has been elevated to Innovator with access to hackathon registrations, idea grants, and campus incubators.";
      link = customLink || "/profile?tab=kyc";
      break;

    case "kyc_rejected":
      category = "kyc";
      badgeColor = "#ef4444";
      badgeText = "KYC Action Required";
      title = customTitle || "⚠️ KYC Verification Requires Attention";
      body =
        customBody ||
        `Your KYC application could not be verified.${
          meta.rejection_reason ? ` Reason: ${meta.rejection_reason}.` : ""
        } ${meta.remarks ? ` Admin remarks: "${meta.remarks}".` : ""} Please resubmit your document in the KYC Hub.`;
      link = customLink || "/profile?tab=kyc";
      break;

    case "idea_status_changed":
      category = "idea";
      badgeColor = "#3b82f6";
      badgeText = "Idea Review Update";
      title =
        customTitle ||
        `💡 Idea Status Updated: "${meta.ideaTitle || "Your Innovation"}"`;
      body =
        customBody ||
        `Your submission has moved to "${meta.newStatus}". ${
          meta.reason ? `Notes: "${meta.reason}".` : "Check the IdeaBox portal for review feedback and next steps."
        }`;
      link = customLink || (meta.ideaId ? `/ideabox?idea=${meta.ideaId}` : "/ideabox");
      break;

    case "team_join_request":
      category = "team";
      badgeColor = "#8b5cf6";
      badgeText = "Squad Request";
      title =
        customTitle ||
        `🚀 New Teammate Request for "${meta.teamName || "Your Squad"}"`;
      body =
        customBody ||
        `${meta.applicantName || "A builder"} has requested to join your team as ${
          meta.requestedRole || "Developer"
        }.${meta.message ? ` Message: "${meta.message}"` : ""}`;
      link = customLink || "/hackathons";
      break;

    case "hackathon_deadline_24h":
      category = "hackathon";
      badgeColor = "#f59e0b";
      badgeText = "24H Countdown";
      title =
        customTitle ||
        `⏳ 24 Hours Left: ${meta.hackathonTitle || "BMCE Hackathon"}`;
      body =
        customBody ||
        `Submissions strictly lock in 24 hours. Ensure your GitHub repo URL, commit SHA, and demo video are saved before the deadline!`;
      link = customLink || "/hackathons";
      break;

    case "results_published":
      category = "hackathon";
      badgeColor = "#10b981";
      badgeText = "Leaderboard Live";
      title =
        customTitle ||
        `🏆 Official Results Published: ${meta.hackathonTitle || "Hackathon"}`;
      body =
        customBody ||
        "The jury has finalized evaluation scores and published the official leaderboard rankings. View the results now!";
      link = customLink || "/hackathons";
      break;
  }

  // Base responsive HTML email template
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: ${brandBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: ${textLight};">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: ${brandBg}; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="max-width: 600px; width: 100%; background-color: ${cardBg}; border: 1px solid rgba(255,255,255,0.1); border-radius: 12px; overflow: hidden;">
                <!-- Header -->
                <tr>
                  <td style="padding: 28px 32px; background: linear-gradient(135deg, rgba(0,210,255,0.15), rgba(59,130,246,0.08)); border-bottom: 1px solid rgba(255,255,255,0.08);">
                    <table width="100%">
                      <tr>
                        <td>
                          <span style="font-size: 20px; font-weight: 800; color: #fff; letter-spacing: -0.5px;">
                            IEDC <span style="color: ${brandCyan};">BMCE</span>
                          </span>
                          <div style="font-size: 11px; color: ${textMuted}; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px;">
                            Innovation & Entrepreneurship Development Centre
                          </div>
                        </td>
                        <td align="right">
                          <span style="display: inline-block; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; background: ${badgeColor}22; color: ${badgeColor}; border: 1px solid ${badgeColor}44;">
                            ${badgeText}
                          </span>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>

                <!-- Content -->
                <tr>
                  <td style="padding: 36px 32px;">
                    <div style="font-size: 14px; color: ${textMuted}; margin-bottom: 8px;">
                      Hello ${recipientName || "Member"},
                    </div>
                    <h2 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #ffffff; line-height: 1.3;">
                      ${title}
                    </h2>
                    <p style="margin: 0 0 28px 0; font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                      ${body}
                    </p>

                    <!-- CTA Button -->
                    <table cellpadding="0" cellspacing="0" style="margin: 24px 0;">
                      <tr>
                        <td style="border-radius: 8px; background: linear-gradient(135deg, ${brandCyan}, #3b82f6);">
                          <a href="${meta.appBaseUrl || "https://iedc.bmce.ac.in"}${link}" target="_blank" style="display: inline-block; padding: 12px 28px; font-size: 14px; font-weight: 700; color: #000000; text-decoration: none; border-radius: 8px;">
                            Open in IEDC Portal &rarr;
                          </a>
                        </td>
                      </tr>
                    </table>

                    <div style="padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.06); font-size: 12px; color: ${textMuted}; line-height: 1.5;">
                      You received this notification because your notification preferences allow updates for ${category.toUpperCase()} events. You can manage your preferences anytime in your IEDC profile.
                    </div>
                  </td>
                </tr>

                <!-- Footer -->
                <tr>
                  <td style="padding: 20px 32px; background-color: rgba(0,0,0,0.25); text-align: center; font-size: 11px; color: ${textMuted}; border-top: 1px solid rgba(255,255,255,0.05);">
                    Baselios Mathews II College of Engineering &bull; Sasthamcotta, Kollam &bull; Kerala 690520
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;

  return { title, body, link, category, html };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

    // Use service role key to manage notifications and preferences with bypass if available,
    // otherwise fallback to anon key with caller's authorization header.
    const authHeader = req.headers.get("Authorization");
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseServiceKey || supabaseAnonKey,
      {
        global: {
          headers: authHeader && !supabaseServiceKey ? { Authorization: authHeader } : {},
        },
      }
    );

    const body = await req.json();
    const payload = SendNotificationSchema.parse(body);

    // 1. Fetch recipient profile to obtain email, full name, and institution
    const { data: recipientProfile, error: profileErr } = await supabaseClient
      .from("profiles")
      .select("full_name, email")
      .eq("id", payload.userId)
      .maybeSingle();

    if (profileErr) {
      console.warn("Could not fetch recipient profile:", profileErr.message);
    }

    const recipientName =
      payload.recipientName || recipientProfile?.full_name || "Innovator";
    const recipientEmail =
      payload.email || recipientProfile?.email;

    // 2. Render templates and determine category
    const rendered = renderNotification(
      payload.type,
      recipientName,
      payload.metadata,
      payload.title,
      payload.body,
      payload.link
    );

    // 3. Query user notification preferences
    const { data: prefs, error: prefsErr } = await supabaseClient
      .from("notification_preferences")
      .select("channel, enabled")
      .eq("user_id", payload.userId)
      .eq("type", rendered.category);

    let inAppEnabled = true;
    let emailEnabled = true;

    if (!prefsErr && prefs && prefs.length > 0) {
      prefs.forEach((p) => {
        if (p.channel === "in_app") inAppEnabled = p.enabled;
        if (p.channel === "email") emailEnabled = p.enabled;
      });
    }

    let inAppCreated = false;
    let createdNotificationId: string | null = null;
    let emailSent = false;
    let emailError: string | null = null;

    // 4. Write In-App Notification if enabled
    if (inAppEnabled) {
      const { data: notifRow, error: notifErr } = await supabaseClient
        .from("notifications")
        .insert({
          user_id: payload.userId,
          type: payload.type,
          title: rendered.title,
          body: rendered.body,
          link: rendered.link,
          metadata: payload.metadata,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (notifErr) {
        console.error("Failed to insert in-app notification:", notifErr);
      } else {
        inAppCreated = true;
        createdNotificationId = notifRow?.id || null;
      }
    }

    // 5. Send Email via Resend if enabled and email address exists
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const resendFromEmail =
      Deno.env.get("RESEND_FROM_EMAIL") || "IEDC BMCE <onboarding@resend.dev>";

    if (emailEnabled && recipientEmail) {
      if (resendApiKey) {
        try {
          const resendResp = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${resendApiKey}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              from: resendFromEmail,
              to: [recipientEmail],
              subject: rendered.title,
              html: rendered.html,
            }),
          });

          if (resendResp.ok) {
            emailSent = true;
          } else {
            const errData = await resendResp.text();
            emailError = `Resend API error (${resendResp.status}): ${errData}`;
            console.error("Resend error:", emailError);

            // Queue to notification_jobs for background retry
            await supabaseClient.from("notification_jobs").insert({
              payload: {
                userId: payload.userId,
                email: recipientEmail,
                type: payload.type,
                title: rendered.title,
                body: rendered.body,
                link: rendered.link,
                html: rendered.html,
              },
              status: "pending",
              attempts: 1,
              last_error: emailError,
              scheduled_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(), // retry in 5 mins
            });
          }
        } catch (err: any) {
          emailError = err.message || "Failed to reach Resend API";
          console.error("Resend exception:", emailError);
        }
      } else {
        console.log(
          `[Resend Notice] RESEND_API_KEY is not configured. Email to ${recipientEmail} rendered and simulated successfully: "${rendered.title}".`
        );
        emailSent = true; // simulated in development
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        inAppCreated,
        notificationId: createdNotificationId,
        emailSent,
        emailError,
        recipient: {
          id: payload.userId,
          name: recipientName,
          email: recipientEmail || null,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return new Response(
        JSON.stringify({
          error: "Invalid request payload",
          details: err.errors.map((e) => e.message),
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.error("send-notification internal error:", err);
    return new Response(
      JSON.stringify({
        error: err.message || "An unexpected error occurred while sending notification.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
