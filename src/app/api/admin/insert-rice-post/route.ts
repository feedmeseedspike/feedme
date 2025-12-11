import { NextResponse } from "next/server";
import { createBlogPost } from "@/lib/actions/blog.actions";

export async function GET() {
  try {
    const postData = {
      title: 'Local vs Foreign Rice: Which is Truly Better?',
      slug: 'local-vs-foreign-rice-which-is-better', // Shortened slug for cleanliness
      excerpt: 'Rice is one of the most common and emotional foods in Nigerian homes. But which one is truly better? We dive into the debate.',
      content: `
        <p>Rice is one of the most common and emotional foods in Nigerian homes. People argue about it like politics.</p>
        <p>Foreign rice lovers say it is cleaner. Local rice lovers say it is healthier.</p>
        <p><strong>So which one is truly better?</strong></p>

        <h2>Let’s talk about foreign rice first</h2>
        <p>It looks clean, cooks neatly and it is easy to wash.</p>
        <p>But many people don’t know that most foreign rice is over-polished, meaning they remove the outer layer that contains fibre. That’s why some elderly people complain that it “does not hold the stomach.”</p>

        <h2>Now let’s talk about local rice</h2>
        <p>Local rice is stronger, richer, and full of fibre.</p>
        <p>Yes, it may come with stones or husk sometimes but that is just processing, not quality.</p>
        <p>Most elderly people actually digest local rice better because it contains more natural fibre.</p>

        <h2>So, which one should you buy this season?</h2>
        <p>Buy the one that doesn’t smell, isn’t dusty, is dry, not damp, and cooks well for your family.</p>

        <h3>At the end of the day, both are good.</h3>
        <p>Just wash them well and cook them properly.</p>
      `,
      status: 'published' as const,
      featured: false,
      featured_image: '/images/rice-comparison.jpg', // Placeholder
      category_id: undefined, // Will be null, or we could fetch one. Leaving undefined is safe.
      author_id: undefined, // Leaving undefined
      // views, likes will default to 0
    };

    const newPost = await createBlogPost(postData);

    return NextResponse.json({ success: true, post: newPost });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
