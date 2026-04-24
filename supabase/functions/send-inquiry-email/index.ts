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

  const resendApiKey = Deno.env.get("RESEND_API_KEY");
  const alertEmailTo = Deno.env.get("ALERT_EMAIL_TO");
  const alertEmailFrom = Deno.env.get("ALERT_EMAIL_FROM") || "Idyllic Alerts <onboarding@resend.dev>";

  if (!resendApiKey || !alertEmailTo) {
    return new Response(JSON.stringify({ error: "Missing RESEND_API_KEY or ALERT_EMAIL_TO" }), {
      status: 500,
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
