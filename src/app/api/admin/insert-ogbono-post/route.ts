import { NextResponse } from "next/server";
import { createBlogPost } from "@/lib/actions/blog.actions";

export async function GET() {
  try {
    const postData = {
      title: 'The Right Way to Grind Ogbono & Other Seeds for Optimal Soup Thickness and Flavor',
      slug: 'the-right-way-to-grind-ogbono-and-other-seeds',
      excerpt: 'Ogbono, egusi and every other seed has its own special attitude. Grind them wrong, and your soup will tell everyone what a disaster your kitchen skills are.',
      content: `
        <p>Ogbono, egusi and every other seed has its own special attitude. Grind them wrong, and your soup will tell everyone what a disaster your kitchen skills are.</p>

        <p>Ogbono, in particular, is a Queen. It hates heat and impatience. Grind it too fast or in a hot blender, and it refuses to draw. Egusi is a little easier, but wet-ground egusi spoils fast if not used immediately.</p>

        <p>Here’s the truth: your soup starts before it hits the pot. Grinding is everything. Treat your seeds with care. Grind ogbono in small batches. Let it cool between batches. Don’t mix everything for convenience. Ogbono, crayfish, and pepper all behave differently. Treat each ingredient according to its needs.</p>

        <p>Storage is equally important. Dry, airtight containers are your friends. Heat and moisture are enemies. Nigerian kitchens invented these methods for a reason which is to make soups that draw beautifully and tasteful. When your ogbono soup pulls the way it should, when the egusi is rich and flavorful, know that it’s not magic, it’s preparation.</p>

        <p>This is also where a lot of people lose flavor. Don’t be lazy. Grind properly, store properly, and watch your soups turn into legends. The difference is night and day, and your family will notice.</p>
      `,
      status: 'published' as const,
      featured: false,
      featured_image: '/images/ogbono-seeds.jpg', // Placeholder
      category_id: undefined,
      author_id: undefined,
    };

    const newPost = await createBlogPost(postData);

    return NextResponse.json({ success: true, post: newPost });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
