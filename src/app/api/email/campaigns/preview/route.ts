import { NextResponse } from "next/server";
import { render } from "@react-email/render";
import NewsletterEmail from "@/utils/email/newsletterEmail";
import PromotionalEmail from "@/utils/email/promotionalEmail";
import { createServerComponentClient } from "@utils/supabase/server";
import React from "react";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { campaignType, data } = body;

    if (!campaignType || !data) {
      return NextResponse.json(
        { success: false, error: "Campaign type and data are required" },
        { status: 400 }
      );
    }

    const supabase = await createServerComponentClient();
    let emailHtml: string;

    if (campaignType === 'newsletter') {
      let featuredProducts: any[] = [];
      let bundlesArr: any[] = [];

      try {
        const selectedProductIds = data.selectedProductIds || [];
        if (selectedProductIds.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('name, description, price, images, slug')
            .in('id', selectedProductIds);
          featuredProducts = (products || []).map((p: any) => ({
            name: p.name,
            description: p.description,
            price: p?.price && p.price > 0 ? `₦${p.price.toLocaleString()}` : '',
            image: p?.images?.[0] || 'https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png',
            productUrl: `https://shopfeedme.com/product/${p.slug}`,
          }));
        }

        const selectedBundleIds = data.selectedBundleIds || [];
        if (selectedBundleIds.length > 0) {
          const { data: bundles } = await supabase
            .from('bundles')
            .select('name, description, price, image_url, slug, id')
            .in('id', selectedBundleIds);
          bundlesArr = (bundles || []).map((b: any) => ({
            name: b.name,
            description: b.description,
            price: b?.price && b.price > 0 ? `₦${b.price.toLocaleString()}` : '',
            bundleUrl: b.slug ? `https://shopfeedme.com/bundle/${b.slug}` : `https://shopfeedme.com/bundles/${b.id}`,
          }));
        }
      } catch (e) {
        console.warn('Preview enrichment failed:', e);
      }

      const componentProps = {
        customerName: "Valued Customer",
        month: data.month || "Current Month",
        year: data.year || new Date().getFullYear().toString(),
        newsletterTitle: data.newsletterTitle || 'Fresh Updates from FeedMe',
        bannerImage: data.bannerImage || '',
        mainContentHtml: data.mainContent || '',
        productsHeading: data.productsHeading || '🥬 Featured This Month',
        bundlesHeading: data.bundlesHeading || '🎁 Bundle Deals',
        featuredProducts: featuredProducts.length > 0 ? featuredProducts : undefined,
        bundles: bundlesArr.length > 0 ? bundlesArr : undefined,
        shopUrl: data.shopUrl || 'https://shopfeedme.com',
        unsubscribeUrl: '#',
        preferencesUrl: '#',
      };

      emailHtml = await render(
        React.createElement(NewsletterEmail, componentProps)
      );
    } else if (campaignType === 'promotional') {
      let featuredProducts: any[] = [];
      const discount = data.discountPercentage || 0;

      try {
        const selectedProductIds = data.selectedProductIds || [];
        if (selectedProductIds.length > 0) {
          const { data: products } = await supabase
            .from('products')
            .select('name, price, images, slug')
            .in('id', selectedProductIds);
          
          featuredProducts = (products || []).map((p: any) => {
            const original = p.price || 0;
            const sale = Math.round(original * (1 - discount / 100));
            return {
              name: p.name,
              originalPrice: `₦${original.toLocaleString()}`,
              salePrice: `₦${sale.toLocaleString()}`,
              savings: `Save ₦${(original - sale).toLocaleString()}`,
              image: p?.images?.[0] || 'https://res.cloudinary.com/ahisi/image/upload/v1731071676/logo_upovep.png',
              productUrl: `https://shopfeedme.com/product/${p.slug}`,
            };
          });
        }
      } catch (e) {
        console.warn('Promo preview enrichment failed:', e);
      }

      const promoProps = {
        customerName: "Valued Customer",
        discountPercentage: discount,
        promoCode: data.promoCode || 'PROMO',
        expiryDate: data.expiryDate || 'Limited Time',
        saleTitle: data.saleTitle || 'Special Offer',
        saleDescription: data.saleDescription || '',
        featuredProducts: featuredProducts.length > 0 ? featuredProducts : undefined,
        unsubscribeUrl: '#',
        preferencesUrl: '#',
        shopUrl: data.shopUrl || 'https://shopfeedme.com',
      };
      emailHtml = await render(
        React.createElement(PromotionalEmail, promoProps)
      );
    } else {
      return NextResponse.json({ success: false, error: "Unsupported campaign type" }, { status: 400 });
    }

    return NextResponse.json({ success: true, html: emailHtml });
  } catch (error: any) {
    console.error("Error generating preview:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate preview", details: error?.message },
      { status: 500 }
    );
  }
}
