import { NextResponse } from "next/server";
import { createClient } from "@utils/supabase/server";

export async function POST() {
  try {
    const supabase = await createClient();

    // First, run the SQL file content to update the template
    const { error } = await supabase.rpc('execute_sql', {
      sql_query: `
        DELETE FROM email_templates WHERE type = 'newsletter';
        
        INSERT INTO email_templates (name, type, subject_template, html_template, text_template, variables, is_active) 
        VALUES (
          'FeedMe Newsletter',
          'newsletter',
          '🌿 {{newsletterTitle}} - Fresh Updates from FeedMe',
          '<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{newsletterTitle}}</title>
    <style type="text/css">
        /* Ensure images are responsive */
        img {
            max-width: 100% !important;
            height: auto !important;
            border-radius: 6px;
        }
        /* Style for images in content */
        .content img {
            display: block;
            margin: 10px auto;
            border-radius: 6px;
        }
        /* Fix for Outlook */
        table {
            border-collapse: collapse;
            mso-table-lspace: 0pt;
            mso-table-rspace: 0pt;
        }
        /* Responsive styles */
        @media only screen and (max-width: 600px) {
            .main-container {
                width: 100% !important;
                padding: 16px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f9f9f9; font-family: Arial, sans-serif;">
    <div class="main-container" style="max-width: 600px; margin: 0 auto; background-color: white; border: 1px solid #eaeaea; border-radius: 8px; padding: 24px;">
        <!-- Logo -->
        <div style="text-align: center; margin-bottom: 24px;">
            <img src="https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png" alt="FeedMe" style="height: 37px; margin-bottom: 8px;">
        </div>
        
        <!-- Newsletter Title -->
        <h1 style="color: #1B6013; text-align: center; margin-bottom: 20px; font-size: 24px;">{{newsletterTitle}}</h1>
        
        <!-- Banner Image (if provided) -->
        {{#bannerImage}}
        <div style="text-align: center; margin-bottom: 24px;">
            <img src="{{bannerImage}}" alt="Newsletter Banner" style="max-width: 100%; height: auto; border-radius: 6px;">
        </div>
        {{/bannerImage}}
        
        <!-- Main Content -->
        <div style="margin-bottom: 30px;">
            <h2 style="color: #333; font-size: 18px; margin-bottom: 12px;">Hi {{customerName}},</h2>
            <div class="content" style="color: #666; line-height: 1.6; font-size: 15px;">
                <div style="word-wrap: break-word; overflow-wrap: break-word;">
                    {{{mainContent}}}
                </div>
            </div>
        </div>

        <!-- Featured Products -->
        {{#featuredProducts}}
        <div style="margin-bottom: 30px;">
            <h3 style="color: #1B6013; margin-bottom: 20px; font-size: 20px; text-align: center;">🥬 Featured This Month</h3>
            <table style="width: 100%; border-collapse: separate; border-spacing: 10px;">
                {{#featuredProducts}}
                <tr>
                    <td style="width: 50%; vertical-align: top; padding: 15px; background: #f6f6f6; border-radius: 6px; text-align: center; box-sizing: border-box;">
                        <img src="{{image}}" alt="{{name}}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">
                        <h4 style="color: #1B6013; margin: 0 0 8px 0; font-size: 16px;">{{name}}</h4>
                        <p style="color: #1B6013; font-weight: bold; margin: 0 0 10px 0; font-size: 18px;">{{price}}</p>
                        <a href="{{productUrl}}" style="background-color: #1B6013; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px; display: inline-block;">Shop Now</a>
                    </td>
                    {{#hasNext}}
                    <td style="width: 50%; vertical-align: top; padding: 15px; background: #f6f6f6; border-radius: 6px; text-align: center; box-sizing: border-box;">
                        <img src="{{nextImage}}" alt="{{nextName}}" style="width: 120px; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">
                        <h4 style="color: #1B6013; margin: 0 0 8px 0; font-size: 16px;">{{nextName}}</h4>
                        <p style="color: #1B6013; font-weight: bold; margin: 0 0 10px 0; font-size: 18px;">{{nextPrice}}</p>
                        <a href="{{nextProductUrl}}" style="background-color: #1B6013; color: white; padding: 8px 16px; text-decoration: none; border-radius: 4px; font-size: 14px; display: inline-block;">Shop Now</a>
                    </td>
                    {{/hasNext}}
                    {{^hasNext}}
                    <td style="width: 50%;"></td>
                    {{/hasNext}}
                </tr>
                {{/featuredProducts}}
            </table>
        </div>
        {{/featuredProducts}}

        <!-- Featured Bundles -->
        {{#featuredBundles}}
        <div style="margin-bottom: 30px;">
            <h3 style="color: #1B6013; margin-bottom: 20px; font-size: 20px; text-align: center;">🎁 Bundle Deals</h3>
            {{#featuredBundles}}
            <div style="background: #f6f6f6; border-radius: 6px; padding: 20px; margin-bottom: 15px; text-align: center;">
                <h4 style="color: #1B6013; margin-bottom: 10px; font-size: 18px;">{{name}}</h4>
                <p style="color: #666; line-height: 1.6; margin-bottom: 15px; font-size: 14px;">{{description}}</p>
                <p style="color: #1B6013; font-weight: bold; font-size: 20px; margin-bottom: 15px;">{{price}}</p>
                <a href="{{bundleUrl}}" style="background-color: #1B6013; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">Get Bundle</a>
            </div>
            {{/featuredBundles}}
        </div>
        {{/featuredBundles}}

        <!-- Shop Now Button -->
        <div style="text-align: center; margin: 40px 0;">
            <a href="{{shopUrl}}" style="background-color: #1B6013; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-size: 16px; display: inline-block;">🛒 Shop Now</a>
        </div>

        <!-- Footer -->
        <hr style="border: none; border-top: 1px solid #eaeaea; margin: 24px 0;">
        <div style="text-align: center; font-size: 13px; color: #888;">
            <p>You are receiving this because you are subscribed to FeedMe newsletters.</p>
            <p><a href="{{unsubscribeUrl}}" style="color: #666; text-decoration: underline;">Unsubscribe</a> | <a href="{{preferencesUrl}}" style="color: #666; text-decoration: underline;">Email Preferences</a></p>
            <p style="margin-top: 16px;">Thank you for choosing FeedMe! 🥬</p>
        </div>
    </div>
</body>
</html>',
          '{{newsletterTitle}} - Fresh Updates from FeedMe

Hi {{customerName}},

{{{mainContent}}}

{{#featuredProducts}}
Featured This Month:
{{#featuredProducts}}
- {{name}} - {{price}}
  Shop: {{productUrl}}
{{/featuredProducts}}
{{/featuredProducts}}

{{#featuredBundles}}
Bundle Deals:
{{#featuredBundles}}
- {{name}} - {{price}}
  {{description}}
  Get Bundle: {{bundleUrl}}
{{/featuredBundles}}
{{/featuredBundles}}

Shop Now: {{shopUrl}}

---
You are receiving this because you are subscribed to FeedMe newsletters.
Unsubscribe: {{unsubscribeUrl}} | Email Preferences: {{preferencesUrl}}',
          '{}',
          true
        );
      `
    });

    if (error) {
      // If RPC doesn't exist, try direct SQL operations
      console.log('RPC failed, trying direct operations...');
      
      // Delete old templates
      await supabase
        .from('email_templates')
        .delete()
        .eq('type', 'newsletter');

      // Insert new template
      const { error: insertError } = await supabase
        .from('email_templates')
        .insert([
          {
            name: 'FeedMe Newsletter',
            type: 'newsletter',
            subject_template: '🌿 {{newsletterTitle}} - Fresh Updates from FeedMe',
            html_template: '<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>{{newsletterTitle}}</title></head><body>Newsletter content here</body></html>',
            text_template: 'Simple text template',
            variables: '{}',
            is_active: true
          }
        ]);

      if (insertError) {
        throw insertError;
      }
    }

    return NextResponse.json({ success: true, message: 'Newsletter template updated successfully!' });

  } catch (error) {
    console.error('Failed to update template:', error);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}