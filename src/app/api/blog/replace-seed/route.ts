import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// WARNING: This endpoint deletes existing blog posts and post-tag relations before inserting new ones.
// Protect behind server-only triggers or call manually when you intend to refresh demo content.

export async function POST() {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
    );

    // 1) Delete existing post-tag relations first (due to FK), then posts
    await supabase.from("blog_post_tags").delete().neq("post_id", "00000000-0000-0000-0000-000000000000");
    await supabase.from("blog_posts").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // 2) Compose five realistic, customer-attracting posts
    const now = Date.now();
    const posts = [
      {
        title: "Weekly Essentials Under ₦5,000: Smart Shopping Guide",
        slug: "weekly-essentials-under-5000-smart-shopping-guide",
        excerpt:
          "Feed the family without breaking the bank. A practical checklist of pantry staples, fresh produce, and hacks to stretch every naira.",
        content: `
          <p>Prices are up, but smart planning still wins. This guide shows exactly how to shop weekly essentials for under ₦5,000, including pantry staples, proteins, and fresh produce—without compromising on taste or nutrition.</p>
          <h2>What to Prioritize</h2>
          <ul>
            <li>Carbs that go far: garri, rice, spaghetti</li>
            <li>Affordable proteins: eggs, beans, sardines</li>
            <li>Flavor boosters: fresh pepper mix, curry, thyme, seasoning cubes</li>
            <li>Vegetables in season for best prices</li>
          </ul>
          <h2>Sample Cart (₦4,850 avg.)</h2>
          <ul>
            <li>1kg rice</li>
            <li>Spaghetti (2 packs)</li>
            <li>Eggs (1 crate half)</li>
            <li>Beans (500g)</li>
            <li>Fresh pepper mix + onions</li>
            <li>Ugu or spinach bunch</li>
          </ul>
          <p>Order these as a bundle on FeedMe and get next‑day delivery. Prices update live so you always get the best deal.</p>
        `,
        featured_image:
          "https://images.unsplash.com/photo-1542838132-92c53300491e?w=1200&h=800&fit=crop",
        featured_image_alt: "Affordable grocery basket with rice, eggs and vegetables",
        status: "published",
        featured: true,
        published_at: new Date(now - 1 * 86400000).toISOString(),
        reading_time: 4,
        meta_title: "Weekly Essentials Under ₦5,000",
        meta_description: "A practical ₦5,000 shopping guide for Nigerian families.",
      },
      {
        title: "5 Quick 20‑Minute Dinners Using Pantry Staples",
        slug: "five-quick-20-minute-dinners-using-pantry-staples",
        excerpt:
          "Fast, fresh, and affordable meals with what you already have—perfect for busy weeknights.",
        content: `
          <p>Short on time? These five dinners come together in twenty minutes or less using everyday staples.</p>
          <h2>Ideas That Work</h2>
          <ol>
            <li>Creamy sardine spaghetti with chili flakes</li>
            <li>Egg fried rice with mixed veggies</li>
            <li>Beans and plantain skillet (ripe or semi‑ripe)</li>
            <li>Garlic suya‑spiced noodles with sautéed peppers</li>
            <li>One‑pot jollof couscous</li>
          </ol>
          <p>Add any missing items to your FeedMe cart in one tap from our recipe cards.</p>
        `,
        featured_image:
          "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=1200&h=800&fit=crop",
        featured_image_alt: "Quick dinner plates arranged on a table",
        status: "published",
        featured: false,
        published_at: new Date(now - 2 * 86400000).toISOString(),
        reading_time: 3,
        meta_title: "20‑Minute Dinners From Pantry Staples",
        meta_description: "Five fast Nigerian dinner ideas from pantry staples.",
      },
      {
        title: "How To Meal Prep For 5 Days Without Getting Bored",
        slug: "how-to-meal-prep-for-5-days-without-getting-bored",
        excerpt:
          "A step‑by‑step plan with interchangeable bases, proteins, and sauces—save time and money.",
        content: `
          <p>Meal prep doesn’t have to be repetitive. Use interchangeable bases, proteins and sauces to keep things exciting.</p>
          <h2>The Framework</h2>
          <ul>
            <li>Bases: jollof rice, boiled yam, couscous</li>
            <li>Proteins: eggs, chicken portions, beans</li>
            <li>Veg: sautéed mixed peppers, steamed greens</li>
            <li>Sauces: pepper sauce, suya mayo, tomato stew</li>
          </ul>
          <p>Order everything as a bundle on FeedMe—prep on Sunday, coast till Friday.</p>
        `,
        featured_image:
          "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=1200&h=800&fit=crop",
        featured_image_alt: "Meal prep containers with rice, veggies and protein",
        status: "published",
        featured: true,
        published_at: new Date(now - 3 * 86400000).toISOString(),
        reading_time: 5,
        meta_title: "5‑Day Meal Prep Plan",
        meta_description: "Flexible Nigerian meal prep plan for the work week.",
      },
      {
        title: "Fresh vs Frozen: What’s Best To Buy And When?",
        slug: "fresh-vs-frozen-whats-best-to-buy-and-when",
        excerpt:
          "Save more with smart swaps. When frozen is better value than fresh—and when it isn’t.",
        content: `
          <p>Frozen isn’t a downgrade—it’s often harvested at peak freshness and can be cheaper. Learn when to choose fresh or frozen for best value and nutrition.</p>
          <h2>Smart Swaps</h2>
          <ul>
            <li>Frozen mixed veg for quick stir‑fries</li>
            <li>Fresh leafy greens for soups and sauces</li>
            <li>Frozen chicken portions for batch cooking</li>
          </ul>
          <p>Compare prices live on FeedMe and stock up when deals drop.</p>
        `,
        featured_image:
          "https://images.unsplash.com/photo-1464454709131-ffd692591ee5?w=1200&h=800&fit=crop",
        featured_image_alt: "Open freezer with labeled containers",
        status: "published",
        featured: false,
        published_at: new Date(now - 4 * 86400000).toISOString(),
        reading_time: 4,
        meta_title: "Fresh vs Frozen: Save More",
        meta_description: "When to buy fresh or frozen to save money.",
      },
      {
        title: "Vendor Spotlight: Inside Our Sourcing And Quality Checks",
        slug: "vendor-spotlight-inside-our-sourcing-and-quality-checks",
        excerpt:
          "Meet the people behind your basket. How we vet vendors, track freshness, and keep prices fair.",
        content: `
          <p>We partner with trusted vendors and run strict quality checks—from farm to doorstep. Here’s how we keep your basket fresh and fairly priced.</p>
          <h2>Our Process</h2>
          <ul>
            <li>Vetting and hygiene audits</li>
            <li>Cold chain for perishables</li>
            <li>Transparent pricing and seasonal deals</li>
          </ul>
          <p>Shop confidently—your order is handled by people who care.</p>
        `,
        featured_image:
          "https://images.unsplash.com/photo-1556767576-cfba2abd7b27?w=1200&h=800&fit=crop",
        featured_image_alt: "Market vendor sorting fresh produce",
        status: "published",
        featured: true,
        published_at: new Date(now - 5 * 86400000).toISOString(),
        reading_time: 4,
        meta_title: "Vendor Spotlight",
        meta_description: "How FeedMe sources quality produce at fair prices.",
      },
    ];

    // 3) Map categories
    const { data: categories } = await supabase
      .from("blog_categories")
      .select("id, slug");

    const categoryMap: Record<string, string> = (categories || []).reduce(
      (acc: Record<string, string>, cat: any) => {
        acc[cat.slug] = cat.id;
        return acc;
      },
      {}
    );

    const postsToInsert = posts.map((post) => ({
      ...post,
      category_id:
        post.slug.includes("vendor")
          ? categoryMap["vendor-spotlight"]
          : post.slug.includes("meal-prep")
          ? categoryMap["cooking-tips"]
          : post.slug.includes("frozen") || post.slug.includes("fresh")
          ? categoryMap["nutrition-tips"]
          : post.slug.includes("dinners") || post.slug.includes("staples")
          ? categoryMap["recipes"]
          : categoryMap["food-stories"] || null,
    }));

    const { data: inserted, error: insertError } = await supabase
      .from("blog_posts")
      .insert(postsToInsert)
      .select();

    if (insertError) {
      console.error("Error inserting new posts", insertError);
      throw insertError;
    }

    // 4) Tag mapping
    const { data: tags } = await supabase
      .from("blog_tags")
      .select("id, slug");

    const tagMap: Record<string, string> = (tags || []).reduce(
      (acc: Record<string, string>, tag: any) => {
        acc[tag.slug] = tag.id;
        return acc;
      },
      {}
    );

    const relations: { post_id: string; tag_id: string }[] = [];
    (inserted || []).forEach((p: any) => {
      if (p.slug.includes("vendor")) {
        if (tagMap["nigerian"]) relations.push({ post_id: p.id, tag_id: tagMap["nigerian"] });
      }
      if (p.slug.includes("dinners") || p.slug.includes("meal-prep")) {
        if (tagMap["quick-easy"]) relations.push({ post_id: p.id, tag_id: tagMap["quick-easy"] });
        if (tagMap["healthy"]) relations.push({ post_id: p.id, tag_id: tagMap["healthy"] });
      }
      if (p.slug.includes("fresh") || p.slug.includes("frozen")) {
        if (tagMap["healthy"]) relations.push({ post_id: p.id, tag_id: tagMap["healthy"] });
      }
      if (p.slug.includes("weekly")) {
        if (tagMap["budget"]) {
          relations.push({ post_id: p.id, tag_id: tagMap["budget"] });
        }
      }
    });

    if (relations.length > 0) {
      await supabase.from("blog_post_tags").insert(relations);
    }

    return NextResponse.json({
      success: true,
      message: `Replaced blog posts with ${inserted?.length || 0} new entries`,
      posts: inserted,
    });
  } catch (error) {
    console.error("replace-seed error", error);
    return NextResponse.json(
      { success: false, error: "Failed to replace blog posts" },
      { status: 500 }
    );
  }
}



