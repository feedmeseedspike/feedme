import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { render } from "@react-email/render";
import { sendMail } from "@/utils/email/mailer";
import DiscountedProductsEmail from "@/utils/email/discountedProductsEmail";
import { formatNaira, mapSupabaseProductToIProductInput } from "@/lib/utils";
import * as React from "react";
import { getAllCategoriesQuery } from "@/queries/categories";
import fs from "fs";
import path from "path";

// Types matching Supabase products
interface SupabaseProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  list_price: number;
  images: any;
  tags: string[];
  options: any;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { testEmail, isProduction = false } = body;

    console.log("Campaign Request Received:", { testEmail, isProduction });

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.SERVICE_ROLE_KEY!
    );

    console.log("Supabase client initialized");

    // 0. Fetch categories for mapping if needed (though mapSupabaseProductToIProductInput needs it)
    const { data: allCategoriesData } = await getAllCategoriesQuery(supabase);
    const allCategories = (allCategoriesData as any[]) || [];

    // 1. Fetch Products
    console.log("Fetching published products...");
    
    const { data: rawProducts, error: productsError } = await supabase
      .from("products")
      .select("*")
      .eq("is_published", true)
      .order("num_sales", { ascending: false });

    if (productsError) {
      console.error("Supabase products fetch error:", productsError);
      throw productsError;
    }

    const DISCOUNT_TAGS = [
      "discount:5%", "discount:10%", "discount:15%", "discount:20%", "discount:25%",
      "discount:30%", "discount:40%", "discount:50%", "discount:5", "discount:10",
      "discount:15", "discount:20", "discount:25", "discount:30", "discount:40", "discount:50",
      "Discount:5%", "Discount:10%", "Discount:15%", "Discount:20%", "Discount:25%",
      "Discount:30%", "Discount:40%", "Discount:50%", "Discount: 10 % discount",
      "Discount: 5 % discount", "Discount: 20 % discount"
    ];

    // Map to IProductInput to use existing logic for options
    const mappedProducts = (rawProducts || []).map(p => mapSupabaseProductToIProductInput(p, allCategories));

    const discountedProducts = mappedProducts.filter(p => {
      const pTags = p.tags || [];
      return pTags.some((tag: string) => 
        DISCOUNT_TAGS.includes(tag) || tag.toLowerCase().includes("discount")
      );
    }).slice(0, 8);

    console.log(`Found ${discountedProducts.length} discounted products`);

    if (discountedProducts.length === 0) {
      return NextResponse.json({ 
        error: "No discounted products found to send",
        totalChecked: rawProducts?.length || 0 
      }, { status: 404 });
    }

    // 2. Format products
    const formattedProducts = discountedProducts.map((p) => {
      const basePrice = p.price || 0;
      const salePriceStr = formatNaira(basePrice);
      
      // Calculate exactly +10% for the original price
      const calculatedOriginalPrice = Math.round(basePrice * 1.1);
      const originalPriceStr = formatNaira(calculatedOriginalPrice);

      let imageUrl = "https://shopfeedme.com/product-placeholder.png";
      if (Array.isArray(p.images) && p.images.length > 0) {
        const imageData = p.images[0];
        if (typeof imageData === "string") {
          try {
            const parsed = JSON.parse(imageData);
            imageUrl = parsed.url || imageData;
          } catch {
            imageUrl = imageData;
          }
        } else if (imageData && (imageData as any).url) {
          imageUrl = (imageData as any).url;
        } else if (typeof imageData === 'string' && (imageData as string).startsWith('http')) {
          imageUrl = imageData;
        }
      }

      return {
        name: p.name,
        originalPrice: originalPriceStr,
        salePrice: salePriceStr,
        discountPercentage: "10%",
        image: imageUrl,
        productUrl: `https://shopfeedme.com/product/${p.slug}`,
      };
    });

    // 3. Define Recipients
    let recipients: { email: string; name?: string }[] = [];
    if (testEmail) {
      recipients = [{ email: testEmail, name: body.testName || "Valued Customer" }];
    } else if (isProduction) {
      // Fetch from public users table
      const { data: publicUsers, error: userError } = await supabase
        .from("users")
        .select("email, display_name");
      
      // Fetch from Auth Admin API (for absolute coverage)
      const { data: authUsersData, error: authError } = await supabase.auth.admin.listUsers({
        page: 1,
        perPage: 1000,
      });

      if (userError) console.error("Error fetching public users:", userError);
      if (authError) console.error("Error fetching auth users:", authError);

      const emailMap = new Map<string, { email: string; name: string }>();

      // 1. Add public users to map
      (publicUsers || []).forEach(u => {
        if (u.email) {
          const email = u.email.toLowerCase().trim();
          emailMap.set(email, { 
            email, 
            name: u.display_name || "Valued Customer" 
          });
        }
      });

      // 2. Add auth users to map (fills gaps)
      (authUsersData?.users || []).forEach(u => {
        if (u.email) {
          const email = u.email.toLowerCase().trim();
          if (!emailMap.has(email)) {
            emailMap.set(email, { 
              email, 
              name: (u.user_metadata?.display_name as string) || (u.user_metadata?.name as string) || "Valued Customer" 
            });
          }
        }
      });

      recipients = Array.from(emailMap.values());
    } else {
      return NextResponse.json({ error: "No target specified" }, { status: 400 });
    }

    // 4. Send Emails with Checkpoint System
    const SENT_LOG_PATH = path.join(process.cwd(), "campaign_sent_log.json");
    
    // Load sent log
    let sentEmails: string[] = [];
    if (fs.existsSync(SENT_LOG_PATH)) {
      try {
        sentEmails = JSON.parse(fs.readFileSync(SENT_LOG_PATH, "utf8"));
      } catch (e) {
        console.error("Error reading sent log:", e);
      }
    }

    console.log(`Starting campaign. ${sentEmails.length} users already sent. Remaining: ${recipients.length - sentEmails.filter(e => recipients.some(r => r.email === e)).length}`);
    
    const results = [];
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    for (let i = 0; i < recipients.length; i++) {
      const recipient = recipients[i];
      
      // SKIP if already sent
      if (sentEmails.includes(recipient.email)) {
        console.log(`Skipping ${recipient.email} (Already sent)`);
        continue;
      }

      try {
        if (i > 0 && i % 10 === 0) {
          console.log(`Progress: ${i}/${recipients.length} processed...`);
        }

        const emailHtml = await render(
          <DiscountedProductsEmail 
            customerName={recipient.name}
            products={formattedProducts}
            shopUrl="https://shopfeedme.com"
            showUnsubscribe={false}
            supportText="Need help placing an order or bulk orders? Call +2348088282487"
          />
        );

        await sendMail({
          to: recipient.email,
          from: `"FeedMe Deals" <${process.env.NODEMAILER_USER}>`,
          subject: `🔥 ${recipient.name}, check out these 10% OFF deals!`,
          html: emailHtml,
        });
        
        // Success! Record it in the log
        sentEmails.push(recipient.email);
        fs.writeFileSync(SENT_LOG_PATH, JSON.stringify(sentEmails, null, 2));
        
        results.push({ email: recipient.email, success: true });
        
        await sleep(500); 
      } catch (err: any) {
        console.error(`Failed to send to ${recipient.email}:`, err);
        results.push({ email: recipient.email, success: false, error: err.message });
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Emails sent to ${recipients.length} recipients`,
      details: results 
    });

  } catch (error: any) {
    console.error("CRITICAL Campaign Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}


