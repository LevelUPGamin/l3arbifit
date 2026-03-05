import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  type: "new_article" | "newsletter_welcome" | "contact_confirmation";
  data: {
    name?: string;
    articleTitle?: string;
    articleSlug?: string;
    articleExcerpt?: string;
    articleCoverImage?: string;
    articleCategory?: string;
    siteUrl?: string;
  };
}

const getEmailTemplate = (
  type: string, 
  data: NotificationRequest["data"]
) => {
  const siteUrl = data.siteUrl || "https://readme.lovable.app";
  
  const baseStyles = `
    font-family: 'Georgia', 'Times New Roman', serif;
    max-width: 600px;
    margin: 0 auto;
    background-color: #faf9f7;
    color: #1a1a1a;
  `;

  const headerStyles = `
    background-color: #1a1a1a;
    color: #faf9f7;
    padding: 32px 24px;
    text-align: center;
  `;

  const contentStyles = `
    padding: 40px 24px;
    background-color: #faf9f7;
  `;

  const buttonStyles = `
    display: inline-block;
    background-color: #1a1a1a;
    color: #faf9f7;
    padding: 14px 32px;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: 0.5px;
    text-transform: uppercase;
    border: none;
    margin-top: 24px;
  `;

  const footerStyles = `
    padding: 24px;
    text-align: center;
    font-size: 12px;
    color: #888;
    border-top: 1px solid #e5e5e5;
  `;

  switch (type) {
    case "new_article":
      return {
        subject: `New Article: ${data.articleTitle}`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="${baseStyles}">
              <!-- Header -->
              <div style="${headerStyles}">
                <h1 style="margin: 0; font-size: 28px; font-weight: 400; letter-spacing: 4px;">L3ARBIT</h1>
                <p style="margin: 8px 0 0; font-size: 12px; letter-spacing: 2px; opacity: 0.8;">NEW ARTICLE PUBLISHED</p>
              </div>
              
              <!-- Cover Image -->
              ${data.articleCoverImage ? `
                <div style="width: 100%; height: 250px; overflow: hidden;">
                  <img src="${data.articleCoverImage}" alt="${data.articleTitle}" style="width: 100%; height: 100%; object-fit: cover;" />
                </div>
              ` : ''}
              
              <!-- Content -->
              <div style="${contentStyles}">
                ${data.articleCategory ? `
                  <span style="font-size: 11px; letter-spacing: 2px; text-transform: uppercase; color: #666; margin-bottom: 12px; display: block;">
                    ${data.articleCategory}
                  </span>
                ` : ''}
                
                <h2 style="font-size: 28px; font-weight: 400; margin: 0 0 16px; line-height: 1.3; color: #1a1a1a;">
                  ${data.articleTitle}
                </h2>
                
                ${data.articleExcerpt ? `
                  <p style="font-size: 16px; line-height: 1.7; color: #4a4a4a; margin: 0 0 24px;">
                    ${data.articleExcerpt}
                  </p>
                ` : ''}
                
                <a href="${siteUrl}/article/${data.articleSlug}" style="${buttonStyles}">
                  Read Article →
                </a>
              </div>
              
              <!-- Footer -->
              <div style="${footerStyles}">
                <p style="margin: 0;">You received this email because you're subscribed to L3arbiFit newsletter.</p>
                <p style="margin: 8px 0 0;">
                  <a href="${siteUrl}" style="color: #1a1a1a; text-decoration: none;">Visit L3arbiFit</a>
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "newsletter_welcome":
      return {
        subject: "Welcome to L3arbiFit Newsletter!",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="${baseStyles}">
              <!-- Header -->
              <div style="${headerStyles}">
                <h1 style="margin: 0; font-size: 28px; font-weight: 400; letter-spacing: 4px;">L3ARBIT</h1>
              </div>
              
              <!-- Content -->
              <div style="${contentStyles}">
                <h2 style="font-size: 24px; font-weight: 400; margin: 0 0 20px; color: #1a1a1a;">
                  Welcome to our newsletter!
                </h2>
                
                <p style="font-size: 16px; line-height: 1.7; color: #4a4a4a; margin: 0 0 16px;">
                  Thank you for subscribing. You'll be the first to know when new articles are published.
                </p>
                
                <p style="font-size: 16px; line-height: 1.7; color: #4a4a4a; margin: 0 0 24px;">
                  We share thoughtful articles on technology, culture, and ideas that matter.
                </p>
                
                <a href="${siteUrl}" style="${buttonStyles}">
                  Explore Articles
                </a>
              </div>
              
              <!-- Footer -->
              <div style="${footerStyles}">
                <p style="margin: 0;">Best regards,<br/>The L3arbiFit Team</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    case "contact_confirmation":
      return {
        subject: "We received your message",
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="margin: 0; padding: 0; background-color: #f5f5f5;">
            <div style="${baseStyles}">
              <!-- Header -->
              <div style="${headerStyles}">
                <h1 style="margin: 0; font-size: 28px; font-weight: 400; letter-spacing: 4px;">L3ARBIT</h1>
              </div>
              
              <!-- Content -->
              <div style="${contentStyles}">
                <h2 style="font-size: 24px; font-weight: 400; margin: 0 0 20px; color: #1a1a1a;">
                  Thank you, ${data.name}!
                </h2>
                
                <p style="font-size: 16px; line-height: 1.7; color: #4a4a4a; margin: 0 0 16px;">
                  We have received your message and will get back to you as soon as possible.
                </p>
                
                <p style="font-size: 16px; line-height: 1.7; color: #4a4a4a; margin: 0;">
                  In the meantime, feel free to explore our latest articles.
                </p>
                
                <a href="${siteUrl}" style="${buttonStyles}">
                  Browse Articles
                </a>
              </div>
              
              <!-- Footer -->
              <div style="${footerStyles}">
                <p style="margin: 0;">Best regards,<br/>The L3arbiFit Team</p>
              </div>
            </div>
          </body>
          </html>
        `,
      };

    default:
      throw new Error(`Unknown notification type: ${type}`);
  }
};

const handler = async (req: Request): Promise<Response> => {
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      console.error("RESEND_API_KEY is not configured");
      throw new Error("RESEND_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const resend = new Resend(RESEND_API_KEY);
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    
    const { type, data }: NotificationRequest = await req.json();
    
    const { subject, html } = getEmailTemplate(type, data);

    // For new_article, send to all active newsletter subscribers
    if (type === "new_article") {
      const { data: subscribers, error: subError } = await supabase
        .from("newsletter_subscriptions")
        .select("email")
        .eq("is_active", true);

      if (subError) {
        console.error("Error fetching subscribers:", subError);
        throw new Error("Failed to fetch subscribers");
      }

      if (!subscribers || subscribers.length === 0) {
        return new Response(
          JSON.stringify({ message: "No subscribers to notify" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Send emails to all subscribers
      const emailPromises = subscribers.map(async (sub) => {
        try {
          const result = await resend.emails.send({
            from: "L3arbiFit <playnassro2@gmail.com>",
            to: [sub.email],
            subject,
            html,
          });
          return { email: sub.email, success: true, result };
        } catch (err: any) {
          console.error(`Failed to send to ${sub.email}:`, err.message);
          return { email: sub.email, success: false, error: err.message };
        }
      });

      const results = await Promise.all(emailPromises);
      const successCount = results.filter(r => r.success).length;
      
      return new Response(
        JSON.stringify({ 
          message: `Sent to ${successCount} of ${subscribers.length} subscribers`,
          results 
        }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // For other types, we need a specific recipient (passed in the request)
    const requestBody = await req.clone().json();
    const to = requestBody.to;
    
    if (!to) {
      throw new Error("Recipient email (to) is required for this notification type");
    }

    const emailResponse = await resend.emails.send({
      from: "L3arbiFit <playnassro2@gmail.com>",
      to: [to],
      subject,
      html,
    });

    return new Response(JSON.stringify(emailResponse), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-notification function:", error.message || error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
