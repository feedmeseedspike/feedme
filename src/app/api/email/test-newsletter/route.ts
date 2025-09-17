import { NextResponse } from "next/server";
import { createClient } from "@utils/supabase/server";
import nodemailer from "nodemailer";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { campaignData } = await request.json();

    // Check if user is admin
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError || !userData.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_staff, role')
      .eq('user_id', userData.user.id)
      .single();

    if (!profile?.is_staff && profile?.role !== 'admin') {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    // Get newsletter template (use the most recent one if multiple exist)
    const { data: templates, error: templateError } = await supabase
      .from('email_templates')
      .select('*')
      .eq('type', 'newsletter')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1);

    const template = templates?.[0];

    if (!template) {
      return NextResponse.json(
        { success: false, error: "Newsletter template not found" },
        { status: 404 }
      );
    }

    // Get selected products and bundles
    const { data: selectedProducts } = await supabase
      .from('products')
      .select('*')
      .in('id', campaignData.selectedProductIds || []);

    const { data: selectedBundles } = await supabase
      .from('bundles')  
      .select('*')
      .in('id', campaignData.selectedBundleIds || []);

    const products = selectedProducts?.map((product: any) => {
      // Handle product options pricing with proper formatting
      let displayPrice = '';
      
      if (product.price && product.price > 0) {
        displayPrice = `₦${product.price.toLocaleString()}`;
      } else if (product.product_options && product.product_options.length > 0) {
        const prices = product.product_options.map((opt: any) => opt.price || 0).filter((price: number) => price > 0);
        if (prices.length > 0) {
          const minPrice = Math.min(...prices);
          const maxPrice = Math.max(...prices);
          if (minPrice === maxPrice) {
            displayPrice = `₦${minPrice.toLocaleString()}`;
          } else {
            displayPrice = `From ₦${minPrice.toLocaleString()}`;
          }
        } else {
          // Hide price entirely when not available
          displayPrice = '';
        }
      } else {
        // Hide price entirely when not available
        displayPrice = '';
      }
      
      return {
        name: product.name,
        price: displayPrice,
        productUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/product/${product.slug}`,
        image: product.images?.[0] || '/placeholder-product.jpg'
      };
    }) || [];

    // Products are now ready for template processing

    // Use simple test token without database insertion
    const testUnsubToken = "test";

    // Prepare email data
    const emailData: Record<string, any> = {
      customerName: "Jeremiah", // Your name for test
      month: campaignData.month || new Date().toLocaleString('default', { month: 'long' }),
      year: campaignData.year || new Date().getFullYear().toString(),
      newsletterTitle: campaignData.newsletterTitle || 'Fresh Updates from FeedMe',
      mainContent: campaignData.mainContent || 'Welcome to our fresh newsletter!',
      bannerImage: campaignData.bannerImage || '',
      shopUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}`,
      unsubscribeUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/unsubscribe?token=${testUnsubToken}`,
      preferencesUrl: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/email-preferences`,
      
      // Products for template processing  
      featuredProducts: products.length > 0 ? products : null,
      
      // Bundles for template processing
      featuredBundles: selectedBundles && selectedBundles.length > 0 ? selectedBundles.map(bundle => ({
        name: bundle.name,
        description: bundle.description,
        price: `₦${bundle.price?.toLocaleString()}`,
        bundleUrl: bundle.slug 
          ? `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/bundles/${bundle.slug}`
          : `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/bundles/${bundle.id}`
      })) : null
    };

    // Replace template variables
    let htmlContent = template.html_template;
    let textContent = template.text_template;
    let subject = campaignData.subject || template.subject_template;

    console.log('Starting template processing...');
    console.log('Featured products:', emailData.featuredProducts);
    console.log('Featured bundles:', emailData.featuredBundles);

    // Replace simple variables (preserving HTML for rich text fields)
    Object.keys(emailData).forEach(key => {
      if (typeof emailData[key] === 'string' || typeof emailData[key] === 'number' || typeof emailData[key] === 'boolean') {
        // Handle triple mustache for mainContent (unescaped HTML)
        if (key === 'mainContent') {
          const tripleRegex = new RegExp(`{{{${key}}}}`, 'g');
          htmlContent = htmlContent.replace(tripleRegex, emailData[key].toString());
          // For text version, strip HTML tags
          const textOnly = emailData[key].toString().replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ');
          textContent = textContent.replace(tripleRegex, textOnly);
        }
        
        const regex = new RegExp(`{{${key}}}`, 'g');
        htmlContent = htmlContent.replace(regex, emailData[key].toString());
        textContent = textContent.replace(regex, emailData[key].toString());
        subject = subject.replace(regex, emailData[key].toString());
      }
    });

    // Handle banner image conditional section
    if (emailData.bannerImage) {
      const bannerRegex = /{{#bannerImage}}([\s\S]*?){{\/bannerImage}}/g;
      htmlContent = htmlContent.replace(bannerRegex, '$1');
    } else {
      const bannerRegex = /{{#bannerImage}}[\s\S]*?{{\/bannerImage}}/g;
      htmlContent = htmlContent.replace(bannerRegex, '');
    }

    // Handle featured products section (normalize to a clean 2-col grid)
    if (emailData.featuredProducts && emailData.featuredProducts.length > 0) {
      const productBlock = /{{#featuredProducts}}([\s\S]*?){{\/featuredProducts}}/g;
      const match = htmlContent.match(productBlock);
      if (match) {
        let gridHtml = '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-collapse: separate; border-spacing: 12px;">';
        for (let i = 0; i < emailData.featuredProducts.length; i += 2) {
          const left = emailData.featuredProducts[i];
          const right = emailData.featuredProducts[i + 1];
          gridHtml += '<tr>';
          gridHtml += `<td width="50%" valign="top" style="background: #f6f6f6; border-radius: 6px; padding: 14px 12px; text-align: center;">` +
            `<img src="${left.image}" alt="${left.name}" width="120" height="120" style="width: 120px; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">` +
            `<p style="font-size: 15px; color: #1B6013; margin: 0 0 6px;"><strong>${left.name}</strong></p>` +
            (left.description ? `<p style="font-size: 14px; color: #222; margin: 0 0 6px;">${left.description}</p>` : '') +
            (left.price ? `<p style="font-size: 14px; color: #1B6013; font-weight: bold; margin: 0 0 10px;">${left.price}</p>` : '') +
            `<a href="${left.productUrl}" style="background-color: #1B6013; color: #fff; padding: 8px 14px; text-decoration: none; border-radius: 6px; font-size: 14px; display: inline-block;">Shop Now</a>` +
          `</td>`;
          if (right) {
            gridHtml += `<td width="50%" valign="top" style="background: #f6f6f6; border-radius: 6px; padding: 14px 12px; text-align: center;">` +
              `<img src="${right.image}" alt="${right.name}" width="120" height="120" style="width: 120px; height: 120px; object-fit: cover; border-radius: 6px; margin-bottom: 10px;">` +
              `<p style="font-size: 15px; color: #1B6013; margin: 0 0 6px;"><strong>${right.name}</strong></p>` +
              (right.description ? `<p style=\"font-size: 14px; color: #222; margin: 0 0 6px;\">${right.description}</p>` : '') +
              (right.price ? `<p style=\"font-size: 14px; color: #1B6013; font-weight: bold; margin: 0 0 10px;\">${right.price}</p>` : '') +
              `<a href="${right.productUrl}" style="background-color: #1B6013; color: #fff; padding: 8px 14px; text-decoration: none; border-radius: 6px; font-size: 14px; display: inline-block;">Shop Now</a>` +
            `</td>`;
          } else {
            gridHtml += '<td width="50%"></td>';
          }
          gridHtml += '</tr>';
        }
        gridHtml += '</table>';
        htmlContent = htmlContent.replace(productBlock, gridHtml);
      }
    } else {
      htmlContent = htmlContent.replace(/{{#featuredProducts}}[\s\S]*?{{\/featuredProducts}}/g, '');
    }

    // Handle featured bundles section (normalize to single-column cards)
    if (emailData.featuredBundles && emailData.featuredBundles.length > 0) {
      const blockRegex = /{{#featuredBundles}}([\s\S]*?){{\/featuredBundles}}/g;
      const match = htmlContent.match(blockRegex);
      if (match) {
        let block = match[0];
        let listHtml = '';
        emailData.featuredBundles.forEach((bundle: any) => {
          listHtml += `<div style=\"background: #f6f6f6; border-radius: 6px; padding: 18px 14px; text-align: center; margin-bottom: 12px;\">` +
            `<p style=\"font-size: 16px; color: #1B6013; margin: 0 0 8px;\"><strong>${bundle.name}</strong></p>` +
            (bundle.description ? `<p style=\"font-size: 14px; color: #222; margin: 0 0 8px;\">${bundle.description}</p>` : '') +
            (bundle.price ? `<p style=\"font-size: 16px; color: #1B6013; font-weight: bold; margin: 0 0 12px;\">${bundle.price}</p>` : '') +
            `<a href=\"${bundle.bundleUrl}\" style=\"background-color: #1B6013; color: #fff; padding: 10px 18px; text-decoration: none; border-radius: 6px; font-size: 14px; display: inline-block;\">Get Bundle</a>` +
          `</div>`;
        });
        htmlContent = htmlContent.replace(blockRegex, listHtml);
      }
    } else {
      htmlContent = htmlContent.replace(/{{#featuredBundles}}[\s\S]*?{{\/featuredBundles}}/g, '');
    }

    // Upload inline base64 images (from rich text) to Supabase storage and replace with public URLs
    try {
      const supabase = await createClient();
      const dataUriRegex = /src=\"data:image\/(png|jpeg|jpg|gif|webp);base64,([^\"]+)\"/g;
      const matches = [...htmlContent.matchAll(dataUriRegex)];
      for (const m of matches) {
        const ext = m[1] || 'png';
        const base64 = m[2];
        const buffer = Buffer.from(base64, 'base64');
        const filePath = `newsletter/${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
        const { error } = await supabase.storage
          .from('product-images')
          .upload(filePath, buffer, { contentType: `image/${ext}`, upsert: false });
        if (!error) {
          const { data: publicUrlData } = supabase.storage.from('product-images').getPublicUrl(filePath);
          const publicUrl = publicUrlData.publicUrl;
          htmlContent = htmlContent.replace(m[0], `src=\"${publicUrl}\"`);
        }
      }
    } catch (e) {
      console.error('Inline image upload failed:', e);
    }

    // Ensure inline styles for images in mainContent and template
    const imgDefaultStyle = 'max-width: 100%; height: auto; border-radius: 6px; display: block; margin: 10px auto;';
    // Add style to img tags that lack a style attribute
    htmlContent = htmlContent.replace(/<img(?![^>]*style=)([^>]*)>/g, `<img style="${imgDefaultStyle}"$1>`);
    // For img tags that already have style, append our safe responsive rules
    htmlContent = htmlContent.replace(/<img([^>]*?)style="([^"]*)"([^>]*)>/g, (m: string, pre: string, style: string, post: string) => {
      const fullTag = `<img${pre}style="${style}"${post}>`;
      const isLogo = /logo_upovep\.png/.test(fullTag);
      if (isLogo) {
        // Preserve explicit small dimensions; only ensure display and margin
        const merged = `${style}; display: block; margin: 10px auto;`.replace(/\s+/g, ' ');
        return `<img${pre}style="${merged}"${post}>`;
      }
      const merged = `${style}; ${imgDefaultStyle}`.replace(/\s+/g, ' ');
      return `<img${pre}style="${merged}"${post}>`;
    });

    // Normalize relative image URLs in rich content to absolute URLs (emails need absolute URLs)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    htmlContent = htmlContent.replace(/(<img[^>]*src=")\/(?!\/)([^">]+)("[^>]*>)/g, `$1${baseUrl}/$2$3`);

    // Final cleanup - remove any remaining template variables
    console.log('Final cleanup of template variables...');
    htmlContent = htmlContent.replace(/{{[^}]*}}/g, '');
    textContent = textContent.replace(/{{[^}]*}}/g, '');
    
    console.log('Template processing complete');

    // Create email transporter
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODEMAILER_USER,
        pass: process.env.NODEMAILER_PASS
      }
    });

    // Send test email
    await transporter.sendMail({
      from: `"FeedMe" <${process.env.NODEMAILER_USER}>`,
      to: "oyedelejeremiah.ng@gmail.com",
      subject: `[TEST] ${subject}`,
      html: htmlContent,
      text: textContent
    });

    return NextResponse.json({
      success: true,
      message: "Test newsletter sent successfully!"
    });

  } catch (error: any) {
    console.error("Error sending test newsletter:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to send test newsletter",
        details: error?.message
      },
      { status: 500 }
    );
  }
}