require('dotenv').config();

const { createClient } = require('@supabase/supabase-js');
const { vendors, products, productReviews } = require('../src/lib/data');

// Use your Supabase project URL and service role key (never expose service role key in frontend!)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role for admin inserts
);

async function importVendors() {
  for (const vendor of vendors) {
    const { _id, ...rest } = vendor;
    const vendorData = {
      id: _id,
      shop_id: rest.shop_id,
      display_name: rest.display_name,
      logo: rest.logo,
      cover_image: rest.cover_image,
      description: rest.description,
      rating: rest.rating,
      num_reviews: rest.num_reviews,
      num_sales: rest.num_sales,
      is_verified: rest.is_verified,
      join_date: rest.join_date,
      business_type: rest.business_type,
      team_size: rest.team_size,
      response_rate: rest.response_rate,
      response_time: rest.response_time,
      fulfillment_rate: rest.fulfillment_rate,
      positive_reviews: rest.positive_reviews,
      return_policy: rest.return_policy,
      shipping_policy: rest.shipping_policy,
      contact: rest.contact,
      location: rest.location,
      social_media: rest.social_media,
      categories: rest.categories,
      num_products: rest.num_products,
      num_followers: rest.num_followers
    };
    const { error } = await supabase.from('vendors').insert([vendorData]);
    if (error) console.error('Vendor insert error:', error);
  }
  // console.log('Vendors imported');
}

// async function importCategories() {
//   for (const category of categories) {
//     const { id, ...rest } = category;
//     const categoryData = {
//       id,
//       thumbnail: rest.thumbnail,
//       title: rest.title,
//       description: rest.description,
//       keynotes: rest.keynotes,
//       tags: rest.tags
//     };
//     const { error } = await supabase.from('categories').insert([categoryData]);
//     if (error) console.error('Category insert error:', error);
//   }
//   // console.log('Categories imported');
// }

async function importProducts() {
  for (const product of products) {
    const { reviews, ...rest } = product; // Remove reviews field
    const { id, ...fields } = rest;
    const productData = {
      id,
      ...fields
    };
    const { error } = await supabase.from('products').insert([productData]);
    if (error) console.error('Product insert error:', error);
  }
  // console.log('Products imported');
}

async function importProductReviews() {
  if (!productReviews || productReviews.length === 0) {
    // console.log('No product reviews to import.');
    return;
  }
  for (const review of productReviews) {
    const { error } = await supabase.from('product_reviews').insert([review]);
    if (error) console.error('Product review insert error:', error);
  }
  // console.log('Product reviews imported');
}

async function main() {
  try {
    await importVendors();
    // await importCategories();
    await importProducts();
    await importProductReviews();
    // console.log('All data imported successfully!');
  } catch (error) {
    console.error('Error during import:', error);
  }
}

main();