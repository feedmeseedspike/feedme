import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST() {
  try {
    // Use service role client to bypass RLS for seeding
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY!
    );

    // Sample blog posts data
    const samplePosts = [
      {
        title: "Jollof Rice: The Ultimate West African Comfort Food",
        slug: "jollof-rice-ultimate-west-african-comfort-food",
        excerpt: "Learn how to make the perfect Jollof rice with our step-by-step guide. This beloved West African dish is packed with flavor and perfect for any occasion.",
        content: `
          <p>Jollof rice is more than just a dish – it's a celebration of West African culture and flavor. This one-pot wonder combines fragrant rice with tomatoes, onions, and aromatic spices to create a meal that's both satisfying and deeply comforting.</p>
          
          <h2>The History of Jollof Rice</h2>
          <p>Jollof rice has its roots in the ancient Wolof empire, which spanned parts of present-day Senegal, Gambia, and Mauritania. Over time, this dish has evolved and spread across West Africa, with each country adding its own unique twist.</p>
          
          <h2>Tips for Perfect Jollof Rice</h2>
          <ul>
            <li>Use parboiled rice for the best texture</li>
            <li>Don't skip the tomato paste – it adds depth and color</li>
            <li>Let it cook low and slow for maximum flavor</li>
            <li>The slight char at the bottom (called "concon") is actually desirable!</li>
          </ul>
          
          <p>Whether you're making it for a family dinner or a special celebration, this Jollof rice recipe will become a staple in your kitchen.</p>
        `,
        featured_image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?w=800&h=600&fit=crop",
        featured_image_alt: "A plate of delicious Jollof rice with vegetables",
        status: "published",
        featured: true,
        prep_time: 20,
        cook_time: 45,
        servings: 6,
        difficulty: "medium",
        ingredients: [
          { name: "Parboiled rice", quantity: "3 cups" },
          { name: "Tomato paste", quantity: "1/4 cup" },
          { name: "Blended tomatoes", quantity: "2 cups" },
          { name: "Onions", quantity: "2 large" },
          { name: "Red bell peppers", quantity: "2" },
          { name: "Chicken stock", quantity: "4 cups" },
          { name: "Vegetable oil", quantity: "1/4 cup" },
          { name: "Curry powder", quantity: "2 tsp" },
          { name: "Thyme", quantity: "1 tsp" },
          { name: "Bay leaves", quantity: "3" }
        ],
        instructions: [
          "Rinse the rice until water runs clear, then set aside.",
          "Heat oil in a large pot and fry tomato paste for 2-3 minutes until darkened.",
          "Add blended tomatoes and cook for 15 minutes until reduced.",
          "Add rice, stock, and seasonings. Stir well.",
          "Cover and cook on low heat for 25-30 minutes until rice is tender.",
          "Let it rest for 5 minutes before serving."
        ],
        published_at: new Date().toISOString()
      },
      {
        title: "10 Health Benefits of Nigerian Local Vegetables",
        slug: "health-benefits-nigerian-local-vegetables",
        excerpt: "Discover the incredible nutritional power of Nigerian indigenous vegetables like ugu, bitter leaf, and scent leaf. These greens are not just delicious – they're superfoods!",
        content: `
          <p>Nigerian cuisine is blessed with an abundance of indigenous vegetables that are not only flavorful but also packed with essential nutrients. Let's explore the amazing health benefits of these local greens.</p>
          
          <h2>1. Ugu (Fluted Pumpkin Leaves)</h2>
          <p>Rich in vitamins A, C, and K, ugu leaves support immune function and bone health. They're also high in iron, making them excellent for preventing anemia.</p>
          
          <h2>2. Bitter Leaf (Vernonia amygdalina)</h2>
          <p>Despite its name, bitter leaf offers sweet health benefits. It's known for its anti-inflammatory properties and ability to help regulate blood sugar levels.</p>
          
          <h2>3. Scent Leaf (Ocimum gratissimum)</h2>
          <p>This aromatic herb is a natural antibiotic and has been traditionally used to treat respiratory conditions and digestive issues.</p>
          
          <h2>4. Water Leaf (Talinum triangulare)</h2>
          <p>High in omega-3 fatty acids and antioxidants, water leaf supports heart health and helps combat inflammation.</p>
          
          <p>Incorporating these vegetables into your daily meals is an easy way to boost your nutrition while enjoying authentic Nigerian flavors.</p>
        `,
        featured_image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?w=800&h=600&fit=crop",
        featured_image_alt: "Fresh Nigerian vegetables including ugu and bitter leaf",
        status: "published",
        featured: true,
        published_at: new Date(Date.now() - 86400000).toISOString() // 1 day ago
      },
      {
        title: "Quick & Easy Plantain Recipes for Busy Weekdays",
        slug: "quick-easy-plantain-recipes-busy-weekdays",
        excerpt: "Transform humble plantains into delicious meals with these simple recipes. Perfect for when you need something tasty and filling in under 30 minutes.",
        content: `
          <p>Plantains are a versatile and affordable ingredient that can be transformed into countless delicious dishes. Here are some quick recipes perfect for busy weekdays.</p>
          
          <h2>Fried Plantain (Dodo)</h2>
          <p>The classic preparation that never gets old. Slice ripe plantains and fry until golden brown. Serve as a side dish or snack.</p>
          
          <h2>Plantain Pancakes</h2>
          <p>Mash overripe plantains with eggs and a pinch of cinnamon for naturally sweet pancakes that are gluten-free and delicious.</p>
          
          <h2>Plantain Chips</h2>
          <p>Thinly slice green plantains and bake or fry for a healthy alternative to potato chips.</p>
          
          <h2>Stuffed Plantains</h2>
          <p>Cut ripe plantains lengthwise, stuff with seasoned ground meat or vegetables, and bake until tender.</p>
          
          <p>These recipes prove that plantains are much more than just a side dish – they're a meal solution!</p>
        `,
        featured_image: "https://images.unsplash.com/photo-1571167066234-ed606b4eca0b?w=800&h=600&fit=crop",
        featured_image_alt: "Golden fried plantains on a plate",
        status: "published",
        featured: false,
        prep_time: 10,
        cook_time: 15,
        servings: 4,
        difficulty: "easy",
        published_at: new Date(Date.now() - 172800000).toISOString() // 2 days ago
      },
      {
        title: "The Art of Spice Blending in Nigerian Cuisine",
        slug: "art-spice-blending-nigerian-cuisine",
        excerpt: "Master the secret to authentic Nigerian flavors by learning how to create your own spice blends. From curry powder to suya spice, we'll show you how.",
        content: `
          <p>The soul of Nigerian cuisine lies in its masterful use of spices. Understanding how to blend spices is the key to creating authentic, flavorful dishes that transport you straight to Nigeria.</p>
          
          <h2>Essential Nigerian Spices</h2>
          <p>Every Nigerian kitchen should have these fundamental spices: ginger, garlic, onions (the holy trinity), curry powder, thyme, bay leaves, and nutmeg.</p>
          
          <h2>Creating Your Own Curry Powder</h2>
          <p>Commercial curry powder is convenient, but making your own allows you to control the flavor profile and heat level.</p>
          
          <h2>Suya Spice Blend</h2>
          <p>This legendary spice mix combines ground peanuts, ginger, garlic, and chili peppers for a complex, nutty heat that's perfect for grilled meats.</p>
          
          <p>Experiment with different combinations and ratios to find your perfect blend. Remember, cooking is an art, and spices are your palette!</p>
        `,
        featured_image: "https://images.unsplash.com/photo-1596040033229-a9821ebd058d?w=800&h=600&fit=crop",
        featured_image_alt: "Colorful array of Nigerian spices and seasonings",
        status: "published",
        featured: false,
        published_at: new Date(Date.now() - 259200000).toISOString() // 3 days ago
      },
      {
        title: "Street Food Chronicles: Best Nigerian Snacks to Try",
        slug: "street-food-chronicles-best-nigerian-snacks",
        excerpt: "Take a culinary journey through Nigeria's vibrant street food scene. From puff puff to boli, discover the snacks that define Nigerian street culture.",
        content: `
          <p>Nigerian street food is a universe of flavors, textures, and experiences. These snacks are more than just food – they're cultural icons that bring communities together.</p>
          
          <h2>Puff Puff</h2>
          <p>These golden, fluffy balls of fried dough are the ultimate Nigerian comfort snack. Slightly sweet and perfectly addictive.</p>
          
          <h2>Boli (Roasted Plantain)</h2>
          <p>Plantains roasted over open flames and served with spicy pepper sauce or groundnuts. Simple yet incredibly satisfying.</p>
          
          <h2>Akara (Bean Cakes)</h2>
          <p>Crispy on the outside, fluffy on the inside, these bean fritters are packed with protein and flavor.</p>
          
          <h2>Suya</h2>
          <p>Spiced grilled meat that's become synonymous with Nigerian street food culture. The aroma alone is enough to stop traffic!</p>
          
          <p>Each of these snacks tells a story of Nigerian ingenuity and the ability to create something magical from simple ingredients.</p>
        `,
        featured_image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=800&h=600&fit=crop",
        featured_image_alt: "Nigerian street food vendor preparing fresh snacks",
        status: "published",
        featured: true,
        published_at: new Date(Date.now() - 345600000).toISOString() // 4 days ago
      }
    ];

    // Get category IDs for assignment
    const { data: categories } = await supabase
      .from("blog_categories")
      .select("id, slug");

    const categoryMap = categories?.reduce((acc: any, cat: any) => {
      acc[cat.slug] = cat.id;
      return acc;
    }, {}) || {};

    // Insert blog posts
    const postsToInsert = samplePosts.map(post => ({
      ...post,
      category_id: post.slug.includes('recipe') || post.slug.includes('jollof') || post.slug.includes('plantain') 
        ? categoryMap['recipes'] 
        : post.slug.includes('health') || post.slug.includes('benefits')
        ? categoryMap['nutrition-tips']
        : post.slug.includes('spice') || post.slug.includes('street')
        ? categoryMap['food-stories']
        : null
    }));

    const { data: insertedPosts, error: postsError } = await supabase
      .from("blog_posts")
      .insert(postsToInsert)
      .select();

    if (postsError) {
      console.error("Error inserting posts:", postsError);
      throw postsError;
    }

    // Add some tags to posts
    const { data: tags } = await supabase
      .from("blog_tags")
      .select("id, slug");

    const tagMap = tags?.reduce((acc: any, tag: any) => {
      acc[tag.slug] = tag.id;
      return acc;
    }, {}) || {};

    // Create post-tag relationships
    const postTagRelations = [];
    
    if (insertedPosts) {
      insertedPosts.forEach((post: any) => {
        if (post.slug.includes('jollof')) {
          postTagRelations.push(
            { post_id: post.id, tag_id: tagMap['nigerian'] },
            { post_id: post.id, tag_id: tagMap['lunch'] },
            { post_id: post.id, tag_id: tagMap['traditional'] }
          );
        } else if (post.slug.includes('plantain')) {
          postTagRelations.push(
            { post_id: post.id, tag_id: tagMap['quick-easy'] },
            { post_id: post.id, tag_id: tagMap['snacks'] }
          );
        } else if (post.slug.includes('health')) {
          postTagRelations.push(
            { post_id: post.id, tag_id: tagMap['healthy'] },
            { post_id: post.id, tag_id: tagMap['vegetarian'] }
          );
        } else if (post.slug.includes('spice')) {
          postTagRelations.push(
            { post_id: post.id, tag_id: tagMap['traditional'] },
            { post_id: post.id, tag_id: tagMap['nigerian'] }
          );
        } else if (post.slug.includes('street')) {
          postTagRelations.push(
            { post_id: post.id, tag_id: tagMap['snacks'] },
            { post_id: post.id, tag_id: tagMap['traditional'] }
          );
        }
      });
    }

    if (postTagRelations.length > 0) {
      const { error: tagError } = await supabase
        .from("blog_post_tags")
        .insert(postTagRelations.filter(rel => rel.tag_id)); // Only insert if tag_id exists

      if (tagError) {
        console.error("Error inserting post tags:", tagError);
      }
    }

    return NextResponse.json({ 
      success: true, 
      message: `Successfully created ${insertedPosts?.length || 0} blog posts with tags`,
      posts: insertedPosts
    });

  } catch (error) {
    console.error("Error seeding blog data:", error);
    return NextResponse.json(
      { success: false, error: "Failed to seed blog data" }, 
      { status: 500 }
    );
  }
}