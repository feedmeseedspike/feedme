// Load environment variables from .env
require('dotenv').config();

// Register ts-node with CommonJS output and Node module resolution
require('ts-node').register({
  transpileOnly: true,
  compilerOptions: { module: 'commonjs', moduleResolution: 'node' },
});

// Import needed actions
const { createBlogPost, getBlogPostBySlugAdmin, updateBlogPost } = require('../lib/actions/blog.actions');

// Helper to generate slug (same as server uses)
function generateSlug(title) {
  try {
    const slugify = require('slugify');
    return slugify(title, { lower: true, strict: true });
  } catch (_) {
    return title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  }
}

// Define the post data with HTML formatting (since the frontend expects HTML from Quill)
const postData = {
  title: "December Is Here And Bulk Buying Is Your Secret Weapon",
  excerpt: "December in Nigeria is a celebration. Bulk buying becomes the smartest decision you can make.",
  content: `<h1>December Is Here And Bulk Buying Is Your Secret Weapon</h1>
<p>December in Nigeria is not just a month. It's a celebration, a festival, a movement, a spiritual calling.</p>
<p><strong>Food flows like water.</strong> Guests appear like angels; uninvited, unexpected, unlimited.</p>
<blockquote>Whether it’s the Christmas celebrations, end‑of‑year gatherings, detty December visitors, family members coming home, people returning from the village or just regular Nigerian December enjoyment.</blockquote>
<blockquote>There is one truth: if you don’t prepare well, December will finish you.</blockquote>
<h2>Why bulk buying in December?</h2>
<ul>
<li>Prices are cheaper now than when the month gets hotter</li>
<li>You avoid the Christmas rush</li>
<li>You save money by buying cartons, bags, and packages</li>
<li>You reduce constant market trips</li>
<li>Your house stays stocked through the entire festive period</li>
<li>No last‑minute running around</li>
</ul>
<p>More peace for you, more food for your family.</p>
<p>And with <strong>FEEDME</strong>, you don’t even need to step outside. Everything arrives at your doorstep, neat, complete, and stress‑free.</p>
<p><em>December is the one month where food disappears faster than money.</em></p>
<p>Don’t let your kitchen embarrass you.</p>
<p><strong>Bulk up. Stock up. Stay ready.</strong></p>`,
  status: "draft",
  featured: false,
  meta_title: "December Bulk Buying Guide",
  meta_description: "Learn why bulk buying in December is essential for Nigerian households.",
  meta_keywords: "December, bulk buying, Nigeria, FEEDME",
};

(async () => {
  try {
    const slug = generateSlug(postData.title);
    const existing = await getBlogPostBySlugAdmin(slug);
    if (existing && existing.id) {
      const updated = await updateBlogPost(existing.id, postData);
      console.log('Blog post updated:', updated);
    } else {
      const created = await createBlogPost(postData);
      console.log('Blog post created:', created);
    }
  } catch (err) {
    console.error('Error upserting blog post:', err);
  }
})();
