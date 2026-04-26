import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type InquiryPayload = {
  id: string;
  inquiry_type: "booking" | "contact" | "inquiry";
  status: "new" | "in_progress" | "closed";
  name: string;
  email: string;
  phone: string | null;
  trek: string | null;
  people_count: number | null;
  preferred_date: string | null;
  message: string;
  source_path: string | null;
  created_at: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const webhookSecret = Deno.env.get("INQUIRY_WEBHOOK_SECRET");
  const incomingSecret = req.headers.get("x-webhook-secret");
  if (!webhookSecret || incomingSecret !== webhookSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const alertEmailFrom = Deno.env.get("ALERT_EMAIL_FROM") || "Idyllic Alerts <onboarding@resend.dev>";

  if (!supabaseUrl || !supabaseServiceRoleKey || !resendApiKey) {
    return new Response(JSON.stringify({ error: "Missing environment variables" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Initialize Supabase Client
  const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2.42.0");
  const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

  // 1. Fetch Notification Settings
  const { data: settingsData, error: settingsError } = await supabase
    .from("site_settings")
    .select("key, value");

  if (settingsError) {
    console.error("Failed to fetch settings:", settingsError);
  }

  const settings: Record<string, string> = {};
  (settingsData || []).forEach((row: { key: string; value: string }) => {
    settings[row.key] = row.value;
  });

  const isEnabled = settings["enquiry_notifications_enabled"] === "true";
  const alertEmailTo = settings["enquiry_email"] || "ujwlchapagai@gmail.com";

  console.log(`Notification status: ${isEnabled} (Setting: ${settings["enquiry_notifications_enabled"]})`);
  console.log(`Alert Email To: ${alertEmailTo}`);

  // 2. Check if notifications are disabled
  if (isEnabled !== true) {
    console.log("Notifications are OFF. Skipping email delivery.");
    return new Response(JSON.stringify({ ok: true, message: "Notifications skipped (disabled)" }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let payload: InquiryPayload;
  try {
    payload = (await req.json()) as InquiryPayload;
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON payload" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const subject = `New ${payload.inquiry_type.toUpperCase()} lead from ${payload.name}`;
  const createdAtText = payload.created_at
    ? new Date(payload.created_at).toLocaleString("en-US", { timeZone: "Asia/Kathmandu" })
    : "Unknown";

  const html = `
    <h2>New Inquiry Received</h2>
    <p><strong>Type:</strong> ${escapeHtml(payload.inquiry_type)}</p>
    <p><strong>Status:</strong> ${escapeHtml(payload.status)}</p>
    <p><strong>Name:</strong> ${escapeHtml(payload.name)}</p>
    <p><strong>Email:</strong> ${escapeHtml(payload.email)}</p>
    <p><strong>Phone:</strong> ${escapeHtml(payload.phone || "Not provided")}</p>
    <p><strong>Trek:</strong> ${escapeHtml(payload.trek || "General inquiry")}</p>
    <p><strong>Group size:</strong> ${escapeHtml(String(payload.people_count ?? "Not provided"))}</p>
    <p><strong>Preferred date:</strong> ${escapeHtml(payload.preferred_date || "Not provided")}</p>
    <p><strong>Source:</strong> ${escapeHtml(payload.source_path || "Unknown")}</p>
    <p><strong>Submitted at:</strong> ${escapeHtml(createdAtText)}</p>
    <hr />
    <p><strong>Message</strong></p>
    <p>${escapeHtml(payload.message).replace(/\n/g, "<br />")}</p>
  `;

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: alertEmailFrom,
      to: [alertEmailTo],
      subject,
      html,
      reply_to: payload.email,
    }),
  });

  if (!resendResponse.ok) {
    const errorText = await resendResponse.text();
    return new Response(
      JSON.stringify({ error: "Email provider failed", details: errorText }),
      {
        status: 502,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
