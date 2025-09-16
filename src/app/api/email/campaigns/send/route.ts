import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import { sendMail } from "@/utils/email/mailer";
import NewsletterEmail from "@/utils/email/newsletterEmail";
import PromotionalEmail from "@/utils/email/promotionalEmail";
import { createServerComponentClient } from "@utils/supabase/server";
import React from "react";

interface CampaignRequest {
  campaignType: 'newsletter' | 'promotional';
  subject: string;
  recipients?: string[]; // Optional: specific recipients
  segmentId?: string; // Optional: target specific segment
  data: {
    // Newsletter data
    customerName?: string;
    month?: string;
    year?: string;
    featuredProducts?: Array<{
      name: string;
      description: string;
      price: string;
      image: string;
      productUrl: string;
    }>;
    // Promotional data
    discountPercentage?: number;
    promoCode?: string;
    expiryDate?: string;
    saleTitle?: string;
    saleDescription?: string;
    // Common data
    shopUrl?: string;
    unsubscribeUrl?: string;
    preferencesUrl?: string;
  };
  sendImmediately?: boolean;
  scheduledAt?: string;
}

export async function POST(request: Request) {
  try {
    const body: CampaignRequest = await request.json();
    const {
      campaignType,
      subject,
      recipients,
      segmentId,
      data,
      sendImmediately = false,
      scheduledAt
    } = body;

    if (!campaignType || !subject) {
      return NextResponse.json(
        { success: false, error: "Campaign type and subject are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerComponentClient();
    
    // Get recipients list
    let recipientsList: Array<{ email: string; name: string; userId: string }> = [];

    if (recipients && recipients.length > 0) {
      // Send to specific recipients
      const { data: users, error } = await supabase
        .from('profiles')
        .select('user_id, display_name, email')
        .in('email', recipients);
      
      if (error) throw error;
      
      recipientsList = users
        .filter(user => user.email)
        .map(user => ({
          email: user.email,
          name: user.display_name || 'Valued Customer',
          userId: user.user_id
        }));
    } else {
      // Send to all users with email preferences enabled
      const emailType = campaignType === 'newsletter' ? 'newsletter_enabled' : 'promotional_enabled';
      
      const { data: users, error } = await supabase
        .from('profiles')
        .select(`
          user_id,
          display_name,
          email,
          email_preferences!inner(${emailType})
        `)
        .eq(`email_preferences.${emailType}`, true)
        .not('email', 'is', null);
      
      if (error) throw error;
      
      recipientsList = users
        .filter(user => user.email)
        .map(user => ({
          email: user.email,
          name: user.display_name || 'Valued Customer',
          userId: user.user_id
        }));
    }

    if (recipientsList.length === 0) {
      return NextResponse.json(
        { success: false, error: "No recipients found" },
        { status: 400 }
      );
    }

    // Create campaign record
    const { data: campaign, error: campaignError } = await supabase
      .from('email_campaigns')
      .insert({
        name: `${campaignType} - ${new Date().toLocaleDateString()}`,
        type: campaignType,
        subject: subject,
        status: sendImmediately ? 'sending' : 'scheduled',
        scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString(),
        target_segment: segmentId ? { segmentId } : { recipients: recipients },
      })
      .select()
      .single();

    if (campaignError) throw campaignError;

    if (sendImmediately) {
      // Send emails immediately
      let successCount = 0;
      let failureCount = 0;

      for (const recipient of recipientsList) {
        try {
          // Generate unsubscribe token
          const unsubscribeToken = generateUnsubscribeToken();
          const { error: tokenError } = await supabase
            .from('unsubscribe_tokens')
            .insert({
              token: unsubscribeToken,
              user_id: recipient.userId,
              email: recipient.email,
              expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
            });

          if (tokenError) throw tokenError;

          // Personalize data
          const personalizedData = {
            ...data,
            customerName: recipient.name,
            unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/unsubscribe?token=${unsubscribeToken}`,
            preferencesUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/email-preferences?token=${unsubscribeToken}`,
            shopUrl: data.shopUrl || process.env.NEXT_PUBLIC_BASE_URL || 'https://shopfeedme.com'
          };

          // Render email template
          let emailHtml: string;
          
          if (campaignType === 'newsletter') {
            // Enrich newsletter data with selected products and bundles
            let featuredProducts: Array<{ name: string; description: string; price: string; image: string; productUrl: string; }> = [];
            let bundlesArr: Array<{ name: string; description: string; price?: string; bundleUrl: string; }> = [];

            try {
              const selectedProductIds = (data as any).selectedProductIds || [];
              if (selectedProductIds.length > 0) {
                const { data: products } = await supabase
                  .from('products')
                  .select('name, description, price, images, slug')
                  .in('id', selectedProductIds);
                featuredProducts = (products || []).map((p: any) => ({
                  name: p.name,
                  description: p.description,
                  price: p?.price && p.price > 0 ? `₦${p.price.toLocaleString()}` : '',
                  image: p?.images?.[0] || '/placeholder-product.jpg',
                  productUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/product/${p.slug}`,
                }));
              }

              const selectedBundleIds = (data as any).selectedBundleIds || [];
              if (selectedBundleIds.length > 0) {
                const { data: bundles } = await supabase
                  .from('bundles')
                  .select('name, description, price, image_url, slug, id')
                  .in('id', selectedBundleIds);
                bundlesArr = (bundles || []).map((b: any) => ({
                  name: b.name,
                  description: b.description,
                  price: b?.price && b.price > 0 ? `₦${b.price.toLocaleString()}` : '',
                  bundleUrl: b.slug
                    ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/bundle/${b.slug}`
                    : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/bundles/${b.id}`,
                }));
              }
            } catch (e) {
              console.warn('Failed to enrich newsletter items:', e);
            }

            const month = (data as any).month || new Date().toLocaleString('default', { month: 'long' });
            const year = (data as any).year || new Date().getFullYear().toString();

            const componentProps: any = {
              customerName: recipient.name,
              month,
              year,
              newsletterTitle: (data as any).newsletterTitle || 'Fresh Updates from FeedMe',
              bannerImage: (data as any).bannerImage || '',
              mainContentHtml: (data as any).mainContent || '',
              productsHeading: (data as any).productsHeading || '🥬 Featured This Month',
              bundlesHeading: (data as any).bundlesHeading || '🎁 Bundle Deals',
              featuredProducts,
              bundles: bundlesArr,
              shopUrl: personalizedData.shopUrl,
              unsubscribeUrl: personalizedData.unsubscribeUrl,
              preferencesUrl: personalizedData.preferencesUrl,
            };

            emailHtml = await render(
              React.createElement(NewsletterEmail, componentProps)
            );
          } else if (campaignType === 'promotional') {
            // Only pass fields PromotionalEmail expects
            const promoProps: any = {
              customerName: recipient.name,
              discountPercentage: (data as any).discountPercentage,
              promoCode: (data as any).promoCode,
              expiryDate: (data as any).expiryDate,
              saleTitle: (data as any).saleTitle,
              saleDescription: (data as any).saleDescription,
              unsubscribeUrl: personalizedData.unsubscribeUrl,
              preferencesUrl: personalizedData.preferencesUrl,
              shopUrl: personalizedData.shopUrl,
            };
            emailHtml = await render(
              React.createElement(PromotionalEmail, promoProps)
            );
          } else {
            throw new Error(`Unsupported campaign type: ${campaignType}`);
          }

          // Send email
          await sendMail({
            to: recipient.email,
            subject: subject,
            html: emailHtml,
          });

          // Add to email queue as sent
          await supabase
            .from('email_queue')
            .insert({
              campaign_id: campaign.id,
              user_id: recipient.userId,
              email: recipient.email,
              personalization_data: personalizedData,
              status: 'sent',
              sent_at: new Date().toISOString()
            });

          // Track analytics
          await supabase
            .from('email_analytics')
            .insert({
              campaign_id: campaign.id,
              user_id: recipient.userId,
              email: recipient.email,
              event_type: 'sent'
            });

          successCount++;
        } catch (error) {
          console.error(`Failed to send email to ${recipient.email}:`, error);
          
          // Add to email queue as failed
          await supabase
            .from('email_queue')
            .insert({
              campaign_id: campaign.id,
              user_id: recipient.userId,
              email: recipient.email,
              personalization_data: data,
              status: 'failed',
              error_message: error instanceof Error ? error.message : 'Unknown error'
            });

          failureCount++;
        }
      }

      // Update campaign status
      await supabase
        .from('email_campaigns')
        .update({
          status: failureCount > 0 ? 'completed_with_errors' : 'completed',
          sent_count: successCount
        })
        .eq('id', campaign.id);

      return NextResponse.json({
        success: true,
        message: `Campaign sent successfully`,
        campaignId: campaign.id,
        stats: {
          total: recipientsList.length,
          sent: successCount,
          failed: failureCount
        }
      });
    } else {
      // Schedule emails for later processing
      for (const recipient of recipientsList) {
        await supabase
          .from('email_queue')
          .insert({
            campaign_id: campaign.id,
            user_id: recipient.userId,
            email: recipient.email,
            personalization_data: {
              ...data,
              customerName: recipient.name
            },
            status: 'pending',
            scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : new Date().toISOString()
          });
      }

      return NextResponse.json({
        success: true,
        message: `Campaign scheduled successfully`,
        campaignId: campaign.id,
        scheduledFor: scheduledAt || 'now',
        recipientCount: recipientsList.length
      });
    }

  } catch (error: any) {
    console.error("Error sending email campaign:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send email campaign",
        details: error?.message
      },
      { status: 500 }
    );
  }
}

// Generate secure unsubscribe token
function generateUnsubscribeToken(): string {
  return Math.random().toString(36).substring(2) + 
         Date.now().toString(36) + 
         Math.random().toString(36).substring(2);
}