import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  type: "new_article" | "newsletter_welcome" | "test";
  data?: {
    title?: string;
    excerpt?: string;
    slug?: string;
  };
  to?: string;
}

// Gmail SMTP configuration
const SMTP_HOST = "smtp.gmail.com";
const SMTP_PORT = 587;

// Base64 encode credentials for SMTP AUTH
function base64Encode(str: string): string {
  return btoa(str);
}

// Send email using raw SMTP via Deno TCP
async function sendSMTPEmail(
  to: string,
  subject: string,
  htmlBody: string,
  smtpUser: string,
  smtpPassword: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Connect to SMTP server
    const conn = await Deno.connect({
      hostname: SMTP_HOST,
      port: SMTP_PORT,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    // Helper to send command and read response
    async function sendCommand(cmd: string): Promise<string> {
      await conn.write(encoder.encode(cmd + "\r\n"));
      const buffer = new Uint8Array(1024);
      const bytesRead = await conn.read(buffer);
      if (bytesRead === null) return "";
      return decoder.decode(buffer.subarray(0, bytesRead));
    }

    async function readResponse(): Promise<string> {
      const buffer = new Uint8Array(1024);
      const bytesRead = await conn.read(buffer);
      if (bytesRead === null) return "";
      return decoder.decode(buffer.subarray(0, bytesRead));
    }

    // Read server greeting
    let response = await readResponse();

    // Send EHLO
    response = await sendCommand(`EHLO localhost`);

    // Start TLS
    response = await sendCommand("STARTTLS");
    // Start TLS
    response = await sendCommand("STARTTLS");

    // Upgrade to TLS
    const tlsConn = await Deno.startTls(conn, {
      hostname: SMTP_HOST,
    });

    // Helper for TLS connection
    async function sendTLSCommand(cmd: string): Promise<string> {
      await tlsConn.write(encoder.encode(cmd + "\r\n"));
      const buffer = new Uint8Array(4096);
      const bytesRead = await tlsConn.read(buffer);
      if (bytesRead === null) return "";
      return decoder.decode(buffer.subarray(0, bytesRead));
    }

    // Send EHLO again after TLS
    response = await sendTLSCommand(`EHLO localhost`);

    // AUTH LOGIN
    response = await sendTLSCommand("AUTH LOGIN");

    // Send username (base64 encoded)
    response = await sendTLSCommand(base64Encode(smtpUser));

    // Send password (base64 encoded)
    response = await sendTLSCommand(base64Encode(smtpPassword));

    if (!response.startsWith("235")) {
      tlsConn.close();
      return { success: false, error: "Authentication failed: " + response };
    }

    // MAIL FROM
    response = await sendTLSCommand(`MAIL FROM:<${smtpUser}>`);

    // RCPT TO
    response = await sendTLSCommand(`RCPT TO:<${to}>`);

    // DATA
    response = await sendTLSCommand("DATA");

    // Email content with headers
    const emailContent = [
      `From: L3arbiFit Newsletter <${smtpUser}>`,
      `To: ${to}`,
      `Subject: ${subject}`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      htmlBody,
      `.`,
    ].join("\r\n");

    response = await sendTLSCommand(emailContent);

    // QUIT
    response = await sendTLSCommand("QUIT");

    tlsConn.close();

    return { success: true };
  } catch (error: unknown) {
    console.error("SMTP Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: errorMessage };
  }
}

function getEmailTemplate(type: string, data: EmailRequest["data"], siteUrl: string) {
  const articleUrl = data?.slug ? `${siteUrl}/article/${data.slug}` : siteUrl;
  switch (type) {
    case "new_article":
      return {
        subject: `📰 New Article: ${data?.title || "Check it out!"}`,
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Georgia', serif; margin: 0; padding: 0; background: #f8f7f4; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #1a1a1a; color: #ffffff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: normal; letter-spacing: 2px; }
    .content { padding: 40px 30px; }
    .article-title { font-size: 24px; color: #1a1a1a; margin: 0 0 15px 0; line-height: 1.3; }
    .article-excerpt { color: #666; line-height: 1.6; margin: 0 0 25px 0; font-size: 16px; }
    .read-btn { display: inline-block; background: #1a1a1a; color: #ffffff; padding: 14px 30px; text-decoration: none; font-size: 14px; letter-spacing: 1px; text-transform: uppercase; }
    .footer { background: #f8f7f4; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5; }
    .footer p { color: #999; font-size: 12px; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>L3arbiFit</h1>
    </div>
    <div class="content">
      <h2 class="article-title">${data?.title || "New Article Published"}</h2>
      <p class="article-excerpt">${data?.excerpt || "A new article has been published on L3arbiFit. Click below to read it."}</p>
      <a href="${articleUrl}" class="read-btn">Read Article</a>
    </div>
    <div class="footer">
      <p>You received this email because you subscribed to L3arbiFit newsletter.</p>
      <p>&copy; ${new Date().getFullYear()} L3arbiFit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
        `,
      };
    case "newsletter_welcome":
      return {
        subject: "Welcome to L3arbiFit Newsletter! 💪",
        html: `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: 'Georgia', serif; margin: 0; padding: 0; background: #f8f7f4; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
    .header { background: #1a1a1a; color: #ffffff; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 28px; font-weight: normal; letter-spacing: 2px; }
    .content { padding: 40px 30px; text-align: center; }
    .content h2 { color: #1a1a1a; margin: 0 0 20px 0; font-size: 22px; }
    .content p { color: #666; line-height: 1.6; font-size: 16px; }
    .footer { background: #f8f7f4; padding: 25px; text-align: center; border-top: 1px solid #e5e5e5; }
    .footer p { color: #999; font-size: 12px; margin: 5px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>L3arbiFit</h1>
    </div>
    <div class="content">
      <h2>Welcome to L3arbiFit!</h2>
      <p>Thank you for subscribing to our newsletter. You'll receive notifications whenever we publish new fitness articles and tips.</p>
      <p style="margin-top: 20px;">Transform your body, elevate your mind!</p>
    </div>
    <div class="footer">
      <p>&copy; ${new Date().getFullYear()} L3arbiFit. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
        `,
      };
    default:
      return {
        subject: "Test Email from L3arbiFit",
        html: "<p>This is a test email from L3arbiFit.</p>",
      };
  }
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPassword = Deno.env.get("SMTP_PASSWORD");

    if (!smtpUser || !smtpPassword) {
      console.error("Missing SMTP credentials");
      return new Response(
        JSON.stringify({ error: "SMTP credentials not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { type, data, to }: EmailRequest = await req.json();

    const siteUrl = Deno.env.get("SITE_URL") || "https://readme-topaz-one.vercel.app";
    const template = getEmailTemplate(type, data, siteUrl);

    // If type is new_article, send to all subscribers
    if (type === "new_article") {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, supabaseKey);

      const { data: subscribers, error: subError } = await supabase
        .from("newsletter_subscriptions")
        .select("email")
        .eq("is_active", true);

      if (subError) {
        console.error("Error fetching subscribers:", subError);
        return new Response(
          JSON.stringify({ error: "Failed to fetch subscribers" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const results: { email: string; success: boolean; error?: string }[] = [];

      for (const subscriber of subscribers || []) {
        const result = await sendSMTPEmail(
          subscriber.email,
          template.subject,
          template.html,
          smtpUser,
          smtpPassword
        );
        results.push({ email: subscriber.email, ...result });
        // Small delay between emails to avoid rate limiting
        await new Promise((r) => setTimeout(r, 500));
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          sent: results.filter(r => r.success).length,
          failed: results.filter(r => !r.success).length,
          results 
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Single recipient
    if (!to) {
      return new Response(
        JSON.stringify({ error: "Recipient email required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const result = await sendSMTPEmail(to, template.subject, template.html, smtpUser, smtpPassword);

    if (!result.success) {
      return new Response(
        JSON.stringify({ error: result.error }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error in send-smtp-email:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
