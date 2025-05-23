// // const { toSlug} = require('./utils'); // adjust path if needed

// const toSlug = (text) =>
//   text
//     .toLowerCase()
//     .replace(/[^\w\s-]+/g, '')
//     .replace(/\s+/g, '-')
//     .replace(/^-+|-+$/g, '')
//     .replace(/-+/g, '-')


//  const headerMenus =  [
//   {
//     name: "Today's Deal",
//     href: '/todays-deal',
//   },
//   {
//     name: 'Completed Orders',
//     href: '/account/order',
//   },
//   {
//     name: 'Favourites',
//     href: '/account/favourites',
//   },
//   {
//     name: 'Subscriptions',
//     href: '/search?tag=subcriptions',
//   },
//   {
//     name: 'Customer Service',
//     href: '/customer-service',
//   },
//   {
//     name: 'Vendors',
//     href: '/vendors',
//   },
//   // {
//   //   name: 'About Us',
//   //   href: '/page/about-us',
//   // },
//   // {
//   //   name: 'Help',
//   //   href: '/page/help',
//   // },
// ]

// // Helper to generate UUIDs (for demonstration, replace with real UUIDs in production)
// const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
//   const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
//   return v.toString(16);
// });

// // Generate UUIDs for vendors and map old IDs to new UUIDs
// const vendorIdMap = {};
// const vendors = [
//   {
//     _id: uuid(),
//     shop_id: "Shop1103816097",
//     display_name: "FarmFresh Produce",
//     logo: "https://picsum.photos/200/200?random=1",
//     cover_image: "https://picsum.photos/1200/400?random=101",
//     description: "Fresh farm produce delivered directly from local farms. We partner with smallholder farmers across Nigeria to bring you the freshest vegetables, fruits and herbs at affordable prices.",
//     rating: 4.8,
//     num_reviews: 24,
//     num_sales: 1245,
//     is_verified: true,
//     join_date: "2020-05-15T00:00:00Z",
//     business_type: "Agricultural Cooperative",
//     team_size: "11-50 employees",
//     response_rate: 98,
//     response_time: 2,
//     fulfillment_rate: 99,
//     positive_reviews: 96,
//     return_policy: "7-day return policy for damaged goods with proof",
//     shipping_policy: "Free shipping on orders above ₦15,000. Delivery within 2-3 business days in Lagos, 3-5 days nationwide.",
//     contact: {
//       email: "farmfresh@example.com",
//       phone: "+2348012345678",
//       address: "123 Farm Road, Surulere, Lagos",
//       workingHours: "Mon-Fri: 8am-6pm, Sat: 9am-4pm"
//     },
//     location: {
//       area: "Surulere",
//       city: "Lagos",
//       coordinates: { lat: 6.4984, lng: 3.3565 }
//     },
//     social_media: {
//       facebook: "https://facebook.com/farmfreshng",
//       twitter: "https://twitter.com/farmfreshng",
//       instagram: "https://instagram.com/farmfreshng"
//     },
//     categories: ["Vegetables", "Fruits", "Herbs"],
//     num_products: 42,
//     num_followers: 1243
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop2204927108",
//     display_name: "Riverbite Fisheries",
//     logo: "https://picsum.photos/200/200?random=2",
//     cover_image: "https://picsum.photos/1200/400?random=102",
//     description: "Premium quality smoked fish and seafood products sourced directly from Niger Delta fishermen. We use traditional smoking methods to preserve flavor and nutrients.",
//     rating: 4.6,
//     num_reviews: 18,
//     num_sales: 876,
//     is_verified: true,
//     join_date: "2019-11-22T00:00:00Z",
//     business_type: "Family Business",
//     team_size: "5-10 employees",
//     response_rate: 95,
//     response_time: 4,
//     fulfillment_rate: 97,
//     positive_reviews: 94,
//     return_policy: "No returns on perishable items. Damaged goods replaced if reported within 24 hours of delivery.",
//     shipping_policy: "Express shipping available at additional cost. Standard delivery within 3-5 business days.",
//     contact: {
//       email: "info@riverbite.com",
//       phone: "+2348023456789",
//       address: "45 Fish Market Road, Lekki Phase 1, Lagos",
//       workingHours: "Mon-Sat: 8am-7pm"
//     },
//     location: {
//       area: "Lekki",
//       city: "Lagos",
//       coordinates: { lat: 6.4474, lng: 3.4735 }
//     },
//     social_media: {
//       facebook: "https://facebook.com/riverbitefisheries",
//       instagram: "https://instagram.com/riverbitefisheries"
//     },
//     categories: ["Seafood", "Smoked Fish", "Dried Fish"],
//     num_products: 28,
//     num_followers: 892
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop3306038119",
//     display_name: "Orchard Direct",
//     logo: "https://picsum.photos/200/200?random=3",
//     cover_image: "https://picsum.photos/1200/400?random=103",
//     description: "Fresh fruits sourced directly from local orchards across Southwest Nigeria. We specialize in seasonal fruits at peak ripeness for maximum flavor and nutrition.",
//     rating: 4.7,
//     num_reviews: 32,
//     num_sales: 1567,
//     is_verified: true,
//     join_date: "2021-02-10T00:00:00Z",
//     business_type: "Agribusiness",
//     team_size: "20-50 employees",
//     response_rate: 99,
//     response_time: 1,
//     fulfillment_rate: 98,
//     positive_reviews: 97,
//     return_policy: "10-day satisfaction guarantee. Returns accepted for damaged or spoiled products.",
//     shipping_policy: "Next-day delivery in Ibadan. Nationwide delivery within 2-4 business days.",
//     contact: {
//       email: "orcharddirect@example.com",
//       phone: "+2348034567890",
//       address: "7 Fruit Lane, Yaba, Nigeria",
//       workingHours: "Mon-Fri: 7am-6pm, Sat: 8am-5pm"
//     },
//     location: {
//       area: "Yaba",
//       city: "Lagos",
//       coordinates: { lat: 6.3374, lng: 3.4235 }
//     },
//     social_media: {
//       facebook: "https://facebook.com/orcharddirectng",
//       twitter: "https://twitter.com/orcharddirectng",
//       instagram: "https://instagram.com/orcharddirectng",
//       whatsapp: "+2348034567890"
//     },
//     categories: ["Tropical Fruits", "Seasonal Fruits", "Organic Produce"],
//     num_products: 56,
//     num_followers: 2105
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop4407149120",
//     display_name: "Tropical Delights",
//     logo: "https://picsum.photos/200/200?random=4",
//     cover_image: "https://picsum.photos/1200/400?random=104",
//     description: "Exotic tropical fruits from the best farms across Nigeria. We specialize in hard-to-find varieties and premium quality fruits for discerning customers.",
//     rating: 4.9,
//     num_reviews: 28,
//     num_sales: 1342,
//     is_verified: true,
//     join_date: "2020-08-05T00:00:00Z",
//     business_type: "Agro-Export Company",
//     team_size: "50+ employees",
//     response_rate: 97,
//     response_time: 3,
//     fulfillment_rate: 99,
//     positive_reviews: 98,
//     return_policy: "14-day return policy for quality issues. Full refund or replacement.",
//     shipping_policy: "Free shipping on orders above ₦20,000. Temperature-controlled shipping available.",
//     contact: {
//       email: "tropical@example.com",
//       phone: "+2348045678901",
//       address: "22 Palm Street, Alimosho, Nigeria",
//       workingHours: "Mon-Fri: 8am-5pm"
//     },
//     location: {
//       area: "Alimosho",
//       city: "Lagos",
//       coordinates: { lat: 6.1434, lng: 3.4785 }
//     },
//     social_media: {
//       instagram: "https://instagram.com/tropicaldelightsng",
//       linkedin: "https://linkedin.com/company/tropicaldelights"
//     },
//     categories: ["Exotic Fruits", "Premium Produce", "Organic Fruits"],
//     num_products: 38,
//     num_followers: 2876
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop5508260131",
//     display_name: "Citrus Valley",
//     logo: "https://picsum.photos/200/200?random=5",
//     cover_image: "https://picsum.photos/1200/400?random=105",
//     description: "Premium citrus fruits from the valley farms of Benue State. Known for our sweet oranges, tangerines and grapefruits with high vitamin C content.",
//     rating: 4.5,
//     num_reviews: 15,
//     num_sales: 654,
//     is_verified: true,
//     join_date: "2022-01-18T00:00:00Z",
//     business_type: "Farm Cooperative",
//     team_size: "10-20 employees",
//     response_rate: 96,
//     response_time: 5,
//     fulfillment_rate: 95,
//     positive_reviews: 93,
//     return_policy: "5-day return window for damaged products. Replacement only.",
//     shipping_policy: "Standard shipping nationwide. Delivery within 3-7 business days.",
//     contact: {
//       email: "citrusvalley@example.com",
//       phone: "+2348056789012",
//       address: "10 Orange Grove, Ikorodu, Nigeria",
//       workingHours: "Mon-Sat: 7:30am-6pm"
//     },
//     location: {
//       area: "Ikorodu",
//       city: "Lagos",
//       coordinates: { lat: 5.7474, lng: 3.4935 }
//     },
//     social_media: {
//       facebook: "https://facebook.com/citrusvalleyng"
//     },
//     categories: ["Oranges", "Tangerines", "Grapefruits"],
//     num_products: 22,
//     num_followers: 743
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop6609371142",
//     display_name: "Summer Harvest",
//     logo: "https://picsum.photos/200/200?random=6",
//     cover_image: "https://picsum.photos/1200/400?random=106",
//     description: "Seasonal fruits and vegetables at their peak freshness. We follow natural growing cycles to deliver produce when it's most flavorful and nutritious.",
//     rating: 4.8,
//     num_reviews: 21,
//     num_sales: 987,
//     is_verified: true,
//     join_date: "2021-06-30T00:00:00Z",
//     business_type: "Sustainable Farm",
//     team_size: "15-30 employees",
//     response_rate: 99,
//     response_time: 2,
//     fulfillment_rate: 98,
//     positive_reviews: 97,
//     return_policy: "Quality guarantee. Full refund if not satisfied with product quality.",
//     shipping_policy: "Free shipping in Abuja for orders above ₦10,000. Nationwide delivery available.",
//     contact: {
//       email: "summerharvest@example.com",
//       phone: "+2348067890123",
//       address: "33 Sunshine Avenue, Ikoyi, Nigeria",
//       workingHours: "Mon-Fri: 8:30am-5:30pm"
//     },
//     location: {
//       area: "Ikoyi",
//       city: "Lagos",
//       coordinates: { lat: 6.2674, lng: 3.4835 }
//     },
//     social_media: {
//       twitter: "https://twitter.com/summerharvestng",
//       instagram: "https://instagram.com/summerharvestng"
//     },
//     categories: ["Seasonal Vegetables", "Organic Fruits", "Farm Fresh"],
//     num_products: 47,
//     num_followers: 1562
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop7710482153",
//     display_name: "Potato King",
//     logo: "https://picsum.photos/200/200?random=7",
//     cover_image: "https://picsum.photos/1200/400?random=107",
//     description: "Specializing in premium quality potatoes from the fertile plains of Jos Plateau. We offer multiple varieties including Irish, sweet and baby potatoes.",
//     rating: 4.4,
//     num_reviews: 19,
//     num_sales: 765,
//     is_verified: true,
//     join_date: "2020-09-14T00:00:00Z",
//     business_type: "Specialty Farm",
//     team_size: "5-15 employees",
//     response_rate: 94,
//     response_time: 6,
//     fulfillment_rate: 96,
//     positive_reviews: 92,
//     return_policy: "Returns accepted within 3 days for damaged goods. Replacement preferred over refund.",
//     shipping_policy: "Bulk discounts available. Shipping costs vary by weight and destination.",
//     contact: {
//       email: "potatoking@example.com",
//       phone: "+2348078901234",
//       address: "5 Tuber Road, Magodo, Nigeria",
//       workingHours: "Mon-Sat: 7am-7pm"
//     },
//     location: {
//       area: "Magodo",
//       city: "Lagos",
//       coordinates: { lat: 6.4574, lng: 3.6035 }
//     },
//     social_media: {
//       whatsapp: "+2348078901234"
//     },
//     categories: ["Potatoes", "Root Vegetables", "Farm Fresh"],
//     num_products: 18,
//     num_followers: 832
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop8811593164",
//     display_name: "Garlic Masters",
//     logo: "https://picsum.photos/200/200?random=8",
//     cover_image: "https://picsum.photos/1200/400?random=108",
//     description: "Premium quality garlic with maximum health benefits. Grown in the perfect climate of Kano State, our garlic is known for its strong flavor and medicinal properties.",
//     rating: 4.7,
//     num_reviews: 16,
//     num_sales: 543,
//     is_verified: true,
//     join_date: "2021-04-22T00:00:00Z",
//     business_type: "Specialty Producer",
//     team_size: "8-12 employees",
//     response_rate: 98,
//     response_time: 3,
//     fulfillment_rate: 97,
//     positive_reviews: 96,
//     return_policy: "Quality guarantee. Replacements for any unsatisfactory products.",
//     shipping_policy: "Flat rate shipping nationwide. Orders processed within 1-2 business days.",
//     contact: {
//       email: "garlicmasters@example.com",
//       phone: "+2348089012345",
//       address: "8 Bulb Street, Badagry, Nigeria",
//       workingHours: "Mon-Fri: 9am-5pm"
//     },
//     location: {
//       area: "Badagry",
//       city: "Lagos",
//       coordinates: { lat: 6.4174, lng: 3.6335 }
//     },
//     social_media: {
//       facebook: "https://facebook.com/garlicmastersng",
//       instagram: "https://instagram.com/garlicmastersng"
//     },
//     categories: ["Garlic", "Medicinal Plants", "Spices"],
//     num_products: 14,
//     num_followers: 921
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop9922704175",
//     display_name: "Ginger Roots",
//     logo: "https://picsum.photos/200/200?random=9",
//     cover_image: "https://picsum.photos/1200/400?random=109",
//     description: "Premium ginger with strong flavor and health benefits. Our ginger is sun-dried naturally to preserve its essential oils and medicinal properties.",
//     rating: 4.6,
//     num_reviews: 14,
//     num_sales: 432,
//     is_verified: true,
//     join_date: "2022-03-08T00:00:00Z",
//     business_type: "Family Farm",
//     team_size: "5-8 employees",
//     response_rate: 97,
//     response_time: 4,
//     fulfillment_rate: 96,
//     positive_reviews: 95,
//     return_policy: "7-day return policy. Refund or replacement at customer's choice.",
//     shipping_policy: "Free shipping on orders above ₦8,000. Standard shipping available.",
//     contact: {
//       email: "gingerroots@example.com",
//       phone: "+2348090123456",
//       address: "12 Spice Lane, Ojo, Nigeria",
//       workingHours: "Mon-Sat: 8am-6pm"
//     },
//     location: {
//       area: "Ojo",
//       city: "Lagos",
//       coordinates: { lat: 6.4174, lng: 3.6335 }
//     },
//     social_media: {
//       instagram: "https://instagram.com/gingerrootsng"
//     },
//     categories: ["Ginger", "Medicinal Roots", "Spices"],
//     num_products: 12,
//     num_followers: 678
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop1033815186",
//     display_name: "Spice World",
//     logo: "https://picsum.photos/200/200?random=10",
//     cover_image: "https://picsum.photos/1200/400?random=110",
//     description: "Premium quality spices and condiments sourced directly from farmers across Nigeria. We offer the freshest, most aromatic spices for your kitchen.",
//     rating: 4.9,
//     num_reviews: 27,
//     num_sales: 1123,
//     is_verified: true,
//     join_date: "2019-12-15T00:00:00Z",
//     business_type: "Specialty Food Retailer",
//     team_size: "15-25 employees",
//     response_rate: 99,
//     response_time: 1,
//     fulfillment_rate: 99,
//     positive_reviews: 98,
//     return_policy: "30-day satisfaction guarantee. Full refund if not completely satisfied.",
//     shipping_policy: "Free nationwide shipping on all orders above ₦10,000.",
//     contact: {
//       email: "spiceworld@example.com",
//       phone: "+2348101234567",
//       address: "15 Seasoning Avenue, Epe, Nigeria",
//       workingHours: "Mon-Fri: 8:30am-5:30pm, Sat: 9am-3pm"
//     },
//     location: {
//       area: "Epe",
//       city: "Lagos",
//       coordinates: { lat: 6.4774, lng: 3.6045 }
//     },
//     social_media: {
//       facebook: "https://facebook.com/spiceworldng",
//       twitter: "https://twitter.com/spiceworldng",
//       instagram: "https://instagram.com/spiceworldng",
//       pinterest: "https://pinterest.com/spiceworldng"
//     },
//     categories: ["Spices", "Seasonings", "Culinary Herbs"],
//     num_products: 63,
//     num_followers: 3245
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop1144926197",
//     display_name: "Herbal Haven",
//     logo: "https://picsum.photos/200/200?random=11",
//     cover_image: "https://picsum.photos/1200/400?random=111",
//     description: "Premium herbal products for health and wellness. We specialize in traditional Nigerian herbs with modern quality control for maximum benefits.",
//     rating: 4.8,
//     num_reviews: 23,
//     num_sales: 876,
//     is_verified: true,
//     join_date: "2020-07-19T00:00:00Z",
//     business_type: "Wellness Company",
//     team_size: "10-15 employees",
//     response_rate: 98,
//     response_time: 2,
//     fulfillment_rate: 98,
//     positive_reviews: 97,
//     return_policy: "14-day return policy for unopened products. Herbal consultations available.",
//     shipping_policy: "Discreet packaging. Free shipping on wellness packages above ₦25,000.",
//     contact: {
//       email: "herbalhaven@example.com",
//       phone: "+2348112345678",
//       address: "20 Leafy Greens, Ojo, Nigeria",
//       workingHours: "Mon-Fri: 9am-5pm"
//     },
//     location: {
//       area: "Ojo",
//       city: "Lagos",
//       coordinates: { lat: 6.4574, lng: 3.6035 }
//     },
//     social_media: {
//       facebook: "https://facebook.com/herbalhavenng",
//       youtube: "https://youtube.com/herbalhavenng"
//     },
//     categories: ["Medicinal Herbs", "Wellness Products", "Traditional Remedies"],
//     num_products: 37,
//     num_followers: 1897
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop2144926197",
//     display_name: "Pepper Paradise",
//     logo: "https://picsum.photos/200/200?random=12",
//     cover_image: "https://picsum.photos/1200/400?random=112",
//     description: "Specialists in premium peppers from across Nigeria. We source directly from farms in Ogun, Oyo and Lagos states.",
//     rating: 4.6,
//     num_reviews: 18,
//     num_sales: 654,
//     is_verified: true,
//     join_date: "2021-03-15T00:00:00Z",
//     business_type: "Agricultural Produce",
//     team_size: "5-10 employees",
//     response_rate: 95,
//     response_time: 4,
//     fulfillment_rate: 96,
//     positive_reviews: 95,
//     return_policy: "7-day return policy for damaged products",
//     shipping_policy: "Free shipping on orders above ₦15,000 within Lagos",
//     contact: {
//       email: "pepperparadise@example.com",
//       phone: "+2348023456789",
//       address: "15 Spicy Lane, Yaba, Lagos",
//       workingHours: "Mon-Sat: 8am-6pm"
//     },
//     location: {
//       area: "Yaba",
//       city: "Lagos",
//       coordinates: { lat: 6.4989, lng: 3.3819 }
//     },
//     social_media: {
//       instagram: "https://instagram.com/pepperparadiseng",
//       twitter: "https://twitter.com/pepperparadiseng"
//     },
//     categories: ["Peppers", "Farm Produce"],
//     num_products: 22,
//     num_followers: 1245
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop3144926197",
//     display_name: "Fruit Haven",
//     logo: "https://picsum.photos/200/200?random=13",
//     cover_image: "https://picsum.photos/1200/400?random=113",
//     description: "Premium tropical fruits sourced directly from farms across Nigeria. We bring you the freshest seasonal fruits.",
//     rating: 4.7,
//     num_reviews: 32,
//     num_sales: 1023,
//     is_verified: true,
//     join_date: "2020-11-22T00:00:00Z",
//     business_type: "Fruit Distributor",
//     team_size: "8-12 employees",
//     response_rate: 97,
//     response_time: 3,
//     fulfillment_rate: 97,
//     positive_reviews: 96,
//     return_policy: "24-hour return for damaged fruits",
//     shipping_policy: "Same-day delivery within Surulere",
//     contact: {
//       email: "fruithaven@example.com",
//       phone: "+2348034567890",
//       address: "8 Juicy Road, Surulere, Lagos",
//       workingHours: "Mon-Sun: 7am-8pm"
//     },
//     location: {
//       area: "Surulere",
//       city: "Lagos",
//       coordinates: { lat: 6.4924, lng: 3.3557 }
//     },
//     social_media: {
//       facebook: "https://facebook.com/fruithavenng",
//       instagram: "https://instagram.com/fruithavenng"
//     },
//     categories: ["Tropical Fruits", "Seasonal Produce"],
//     num_products: 28,
//     num_followers: 2156
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop4144926197",
//     display_name: "Veggie Delight",
//     logo: "https://picsum.photos/200/200?random=14",
//     cover_image: "https://picsum.photos/1200/400?random=114",
//     description: "Organic vegetable specialists providing farm-fresh produce to Lagos households since 2019.",
//     rating: 4.5,
//     num_reviews: 27,
//     num_sales: 789,
//     is_verified: true,
//     join_date: "2019-08-10T00:00:00Z",
//     business_type: "Organic Farm",
//     team_size: "6-8 employees",
//     response_rate: 96,
//     response_time: 5,
//     fulfillment_rate: 95,
//     positive_reviews: 94,
//     return_policy: "No returns on fresh vegetables",
//     shipping_policy: "Next-day delivery within Lagos",
//     contact: {
//       email: "veggiedelight@example.com",
//       phone: "+2348045678901",
//       address: "12 Green Street, Ikeja, Lagos",
//       workingHours: "Mon-Fri: 9am-5pm"
//     },
//     location: {
//       area: "Ikeja",
//       city: "Lagos",
//       coordinates: { lat: 6.6018, lng: 3.3515 }
//     },
//     social_media: {
//       twitter: "https://twitter.com/veggiedelightng",
//       youtube: "https://youtube.com/veggiedelightng"
//     },
//     categories: ["Organic Vegetables", "Leafy Greens"],
//     num_products: 19,
//     num_followers: 1678
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop5144926197",
//     display_name: "Tuber World",
//     logo: "https://picsum.photos/200/200?random=15",
//     cover_image: "https://picsum.photos/1200/400?random=115",
//     description: "Your one-stop shop for premium Nigerian tubers. We source directly from farms in Osun, Oyo and Benue states.",
//     rating: 4.4,
//     num_reviews: 21,
//     num_sales: 567,
//     is_verified: true,
//     join_date: "2021-01-05T00:00:00Z",
//     business_type: "Tuber Distributor",
//     team_size: "7-10 employees",
//     response_rate: 94,
//     response_time: 6,
//     fulfillment_rate: 93,
//     positive_reviews: 92,
//     return_policy: "3-day return for damaged tubers",
//     shipping_policy: "Free delivery within Victoria Island on orders above ₦20,000",
//     contact: {
//       email: "tuberworld@example.com",
//       phone: "+2348056789012",
//       address: "5 Root Avenue, Victoria Island, Lagos",
//       workingHours: "Mon-Sat: 8am-7pm"
//     },
//     location: {
//       area: "Victoria Island",
//       city: "Lagos",
//       coordinates: { lat: 6.4281, lng: 3.4219 }
//     },
//     social_media: {
//       instagram: "https://instagram.com/tuberworldng",
//       facebook: "https://facebook.com/tuberworldng"
//     },
//     categories: ["Yams", "Root Crops"],
//     num_products: 15,
//     num_followers: 1432
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop6144926197",
//     display_name: "Pepper Heat",
//     logo: "https://picsum.photos/200/200?random=16",
//     cover_image: "https://picsum.photos/1200/400?random=116",
//     description: "Specialists in hot peppers and spices from across West Africa. We bring the heat to your kitchen!",
//     rating: 4.3,
//     num_reviews: 19,
//     num_sales: 432,
//     is_verified: false,
//     join_date: "2022-02-18T00:00:00Z",
//     business_type: "Spice Merchant",
//     team_size: "3-5 employees",
//     response_rate: 93,
//     response_time: 8,
//     fulfillment_rate: 92,
//     positive_reviews: 91,
//     return_policy: "No returns on spicy products",
//     shipping_policy: "Next-day delivery within Lekki",
//     contact: {
//       email: "pepperheat@example.com",
//       phone: "+2348067890123",
//       address: "7 Hot Corner, Lekki Phase 1, Lagos",
//       workingHours: "Mon-Fri: 10am-6pm"
//     },
//     location: {
//       area: "Lekki",
//       city: "Lagos",
//       coordinates: { lat: 6.4396, lng: 3.4544 }
//     },
//     social_media: {
//       twitter: "https://twitter.com/pepperheatng",
//       tiktok: "https://tiktok.com/@pepperheatng"
//     },
//     categories: ["Hot Peppers", "Spices"],
//     num_products: 12,
//     num_followers: 987
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop7144926197",
//     display_name: "Fruit Kingdom",
//     logo: "https://picsum.photos/200/200?random=17",
//     cover_image: "https://picsum.photos/1200/400?random=117",
//     description: "Royal treatment for your fruit needs. We supply the freshest seasonal fruits to Lagos homes.",
//     rating: 4.9,
//     num_reviews: 45,
//     num_sales: 1567,
//     is_verified: true,
//     join_date: "2020-05-30T00:00:00Z",
//     business_type: "Fruit Distributor",
//     team_size: "12-15 employees",
//     response_rate: 98,
//     response_time: 2,
//     fulfillment_rate: 98,
//     positive_reviews: 97,
//     return_policy: "12-hour return for damaged fruits",
//     shipping_policy: "Same-day delivery within Ajah",
//     contact: {
//       email: "fruitkingdom@example.com",
//       phone: "+2348078901234",
//       address: "22 Orchard Road, Ajah, Lagos",
//       workingHours: "Mon-Sun: 7am-9pm"
//     },
//     location: {
//       area: "Ajah",
//       city: "Lagos",
//       coordinates: { lat: 6.4698, lng: 3.5852 }
//     },
//     social_media: {
//       instagram: "https://instagram.com/fruitkingdomng",
//       facebook: "https://facebook.com/fruitkingdomng",
//       youtube: "https://youtube.com/fruitkingdomng"
//     },
//     categories: ["Tropical Fruits", "Seasonal Produce"],
//     num_products: 31,
//     num_followers: 2876
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop8144926197",
//     display_name: "Leafy Greens",
//     logo: "https://picsum.photos/200/200?random=18",
//     cover_image: "https://picsum.photos/1200/400?random=118",
//     description: "Specialists in fresh, organic leafy vegetables grown with sustainable farming practices.",
//     rating: 4.6,
//     num_reviews: 24,
//     num_sales: 678,
//     is_verified: true,
//     join_date: "2021-07-14T00:00:00Z",
//     business_type: "Organic Farm",
//     team_size: "5-7 employees",
//     response_rate: 96,
//     response_time: 4,
//     fulfillment_rate: 95,
//     positive_reviews: 94,
//     return_policy: "No returns on fresh greens",
//     shipping_policy: "Next-day delivery within Mainland Lagos",
//     contact: {
//       email: "leafygreens@example.com",
//       phone: "+2348089012345",
//       address: "14 Garden Close, Maryland, Lagos",
//       workingHours: "Mon-Fri: 8am-5pm"
//     },
//     location: {
//       area: "Maryland",
//       city: "Lagos",
//       coordinates: { lat: 6.5627, lng: 3.3578 }
//     },
//     social_media: {
//       twitter: "https://twitter.com/leafygreensng",
//       instagram: "https://instagram.com/leafygreensng"
//     },
//     categories: ["Leafy Vegetables", "Organic Produce"],
//     num_products: 17,
//     num_followers: 1543
//   },
//   {
//     _id: uuid(),
//     shop_id: "Shop9144926197",
//     display_name: "Tuber Delights",
//     logo: "https://picsum.photos/200/200?random=19",
//     cover_image: "https://picsum.photos/1200/400?random=119",
//     description: "Your trusted source for quality tubers and root vegetables. We deliver farm-fresh products across Lagos.",
//     rating: 4.7,
//     num_reviews: 29,
//     num_sales: 732,
//     is_verified: true,
//     join_date: "2020-09-25T00:00:00Z",
//     business_type: "Tuber Distributor",
//     team_size: "8-10 employees",
//     response_rate: 97,
//     response_time: 3,
//     fulfillment_rate: 96,
//     positive_reviews: 95,
//     return_policy: "2-day return for damaged products",
//     shipping_policy: "Free delivery within Apapa on orders above ₦18,000",
//     contact: {
//       email: "tuberdelights@example.com",
//       phone: "+2348090123456",
//       address: "9 Root Street, Apapa, Lagos",
//       workingHours: "Mon-Sat: 8am-6pm"
//     },
//     location: {
//       area: "Apapa",
//       city: "Lagos",
//       coordinates: { lat: 6.4489, lng: 3.3597 }
//     },
//     "social_media": {
//         "facebook": "https://facebook.com/tuberdelightsng",
//         "instagram": "https://instagram.com/tuberdelightsng"
//       },
//       "categories": ["Root Vegetables", "Staple Foods"],
//     "num_products": 21,
//     "num_followers": 1876
//   }
// ].map(vendor => {
//   const newId = uuid();
//   vendorIdMap[vendor._id] = newId;
//   return { ...vendor, _id: newId };
// });

// // Generate UUIDs for categories and map old IDs to new UUIDs
// const categoryIdMap = {};
// const categories = [
//   {
//     id: uuid(),
//     title: "Fruits",
//     description: "Fruits",
//     keynotes: ["Fruits"],
//     tags: ["fruits"],
//     thumbnail: {
//       url: "https://res.cloudinary.com/ahisi/image/upload/v1734976806/ahisi/1734976793066_fruit.png",
//       public_id: "ahisi/1734976793066_fruit"
//     },
//     created_at: "2024-12-23T18:00:07.504Z",
//     updated_at: "2025-03-11T10:43:03.352Z"
//   },
//   {
//     id: uuid(),
//     title: "Tubers",
//     description: "Tubers",
//     keynotes: ["Tubers"],
//     tags: ["tubers"],
//     thumbnail: {
//       url: "https://res.cloudinary.com/ahisi/image/upload/v1734977737/ahisi/1734977735158_tubers.png",
//       public_id: "ahisi/1734977735158_tubers"
//     },
//     created_at: "2024-12-23T18:15:38.180Z",
//     updated_at: "2024-12-23T18:15:38.180Z"
//   },
//   {
//     id: uuid(),
//     title: "Oil & Sauces",
//     description: "Oil & Sauces",
//     keynotes: ["Oil & Sauces"],
//     tags: ["oil-& sauces"],
//     thumbnail: {
//       url: "https://res.cloudinary.com/ahisi/image/upload/v1734977790/ahisi/1734977785892_vegetable-oil.png",
//       public_id: "ahisi/1734977785892_vegetable-oil"
//     },
//     created_at: "2024-12-23T18:16:30.950Z",
//     updated_at: "2025-03-03T16:18:11.402Z"
//   },
//   {
//     id: uuid(),
//     title: "Spices & Condiments",
//     description: "Spices & Condiments",
//     keynotes: ["Spices & Condiments"],
//     tags: ["spices-& condiments"],
//     thumbnail: {
//       url: "https://res.cloudinary.com/ahisi/image/upload/v1734977822/ahisi/1734977819900_spices-condiments.png",
//       public_id: "ahisi/1734977819900_spices-condiments"
//     },
//     created_at: "2024-12-23T18:18:33.603Z",
//     updated_at: "2025-03-05T13:53:54.840Z"
//   },
//   {
//     "thumbnail": {
//       "url": "https://res.cloudinary.com/ahisi/image/upload/v1734977873/ahisi/1734977869118_vegetables.png",
//       "public_id": "ahisi/1734977869118_vegetables"
//     },
//     "_id": uuid(),
//     "title": "Vegetables",
//     "description": "Vegetables",
//     "keynotes": ["Vegetables"],
//     "tags": ["vegetables"],
//     "created_at": "2024-12-23T18:17:54.600Z",
//     "updated_at": "2025-02-11T14:30:21.900Z",

//   },
//   {
//     "thumbnail": {
//       "url": "https://res.cloudinary.com/ahisi/image/upload/v1734977912/ahisi/1734977907653_general.png",
//       "public_id": "ahisi/1734977907653_general"
//     },
//     "_id": uuid(),
//     "title": "General",
//     "description": "General",
//     "keynotes": ["General"],
//     "tags": ["general"],
//     "created_at": "2024-12-23T18:18:33.603Z",
//     "updated_at": "2025-03-03T16:07:49.242Z",

//   },
// ].map(category => {
//   const newId = uuid();
//   categoryIdMap[category.id || category._id] = newId;
//   return { ...category, id: newId, _id: newId };
// });

// // Generate UUIDs for products and update vendor_id/category_ids
// const products = [
//   {
//     id: uuid(),
//     name: 'Onion',
//     slug: 'onion',
//     description: 'Onions are versatile root vegetables known for their sharp flavor, aroma, and health benefits. Available in red, and white varieties.',
//     price: 3000,
//     list_price: 0,
//     brand: 'Onion',
//     avg_rating: 4.71,
//     num_reviews: 7,
//     num_sales: 9,
//     count_in_stock: 11,
//     stock_status: 'In Stock',
//     is_published: false,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0k000000000",
//     category_ids: ["6769a979-015a-bc57-a03e-c8b500000000"], // General
//     tags: ['new-arrival', "best-seller", "fresh-vegetables"],
//     images: ["https://res.cloudinary.com/ahisi/image/upload/v1732183603/ahisi/1732183602881_produce.jpg", '/images/p11-2.jpg'],
//     options: [
//       {
//         name: "1kg",
//         price: 3000,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732183603/ahisi/1732183602881_produce.jpg",
//       },
//       {
//         name: "2kg",
//         price: 5500,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732183603/ahisi/1732183602881_produce_2kg.jpg",
//       },
//       {
//         name: "5kg",
//         price: 12000,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732183603/ahisi/1732183602881_produce_5kg.jpg",
//       },
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 0 },
//       { rating: 4, count: 2 },
//       { rating: 5, count: 5 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: "Riverbite",
//     slug: "riverbite",
//     description: "Riverbite is a premium smoked catfish snack set apart by superior quality and careful preparation. Each package contains four expertly degutted catfish cutlets.",
//     price: 5850,
//     list_price: 5850,
//     brand: "Riverbite",
//     avg_rating: 0,
//     num_reviews: 0,
//     num_sales: 0,
//     count_in_stock: 50,
//     stock_status: 'In Stock',
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0l000000000",
//     category_ids: ["6769a931-015a-bc57-a03e-c8ad00000000"], // Spices & Condiments
//     tags: ["best-seller", "todays-deal"],
//     images: ["https://res.cloudinary.com/ahisi/image/upload/v1732000738/ahisi/1732000738261_produce_20241119_081636_0000.jpg"],
//     options: [
//       {
//         name: "Standard Pack",
//         price: 5850,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732000738/ahisi/1732000738261_produce_20241119_081636_0000.jpg",
//       },
//     ],
//     rating_distribution: [],
//     created_at: "2025-01-28T13:56:48.184Z",
//     updated_at: "2024-11-28T14:29:10.916Z"
//   },
//   {
//     id: uuid(),
//     name: 'Apple',
//     slug: 'apple',
//     description: 'Apples are versatile, and used in snacks, baking, and juices. They come in various colors and are rich in fiber, vitamin C, and antioxidants.',
//     price: 650,
//     list_price: 650,
//     brand: 'Local Farm',
//     avg_rating: 4.5,
//     num_reviews: 5,
//     num_sales: 7,
//     count_in_stock: 20,
//     stock_status: 'Out of Stock',
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0m000000000",
//     category_ids: ["6769a527-015a-bc57-a03e-c87000000000"], // Fruits
//     tags: ["new-arrival", "fresh-fruits"],
//     images: ["https://res.cloudinary.com/ahisi/image/upload/v1732372960/ahisi/1732372957967_1732110649466_produce-1.jpg"],
//     options: [
//       {
//         name: "1kg",
//         price: 650,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732372960/ahisi/1732372957967_1732110649466_produce-1.jpg",
//       },
//       {
//         name: "2kg",
//         price: 1200,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732372960/ahisi/1732372957967_1732110649466_produce-1_2kg.jpg",
//       },
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 1 },
//       { rating: 4, count: 2 },
//       { rating: 5, count: 2 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: 'Pineapple',
//     slug: 'pineapple',
//     description: 'Pineapple is a tropical fruit with a sweet, tangy flavor and high in Vitamin C, fiber, and antioxidants. It is enjoyed fresh or in various dishes like smoothies, desserts, and juices.',
//     price: 1550,
//     list_price: 1550,
//     brand: 'Tropical Farms',
//     avg_rating: 4.8,
//     num_reviews: 10,
//     num_sales: 12,
//     count_in_stock: 25,
//     stock_status: 'In Stock',
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0n000000000",
//     category_ids: ["6769a527-015a-bc57-a03e-c87000000000"], // Fruits
//     tags: ['new-arrival', "todays-deal"],
//     images: ["https://res.cloudinary.com/ahisi/image/upload/v1732136297/ahisi/1732136297347_produce-2.jpg"],
//     options: [
//       {
//         name: "1 piece",
//         price: 1550,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732136297/ahisi/1732136297347_produce-2.jpg",
//       },
//       {
//         name: "2 pieces",
//         price: 3000,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732136297/ahisi/1732136297347_produce-2_2pieces.jpg",
//       },
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 1 },
//       { rating: 4, count: 3 },
//       { rating: 5, count: 6 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: 'Orange',
//     slug: 'orange',
//     description: 'Oranges are often eaten fresh, juiced, or used in cooking and baking. They are a popular choice for boosting immunity and promoting hydration.',
//     price: 150,
//     list_price: 150,
//     brand: 'Citrus Farms',
//     avg_rating: 4.6,
//     num_reviews: 8,
//     num_sales: 15,
//     count_in_stock: 50,
//     stock_status: 'In Stock',
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0o000000000",
//     category_ids: ["6769a527-015a-bc57-a03e-c87000000000"], // Fruits
//     tags: ["new-arrival", "fresh-fruits"],
//     images: ["https://res.cloudinary.com/ahisi/image/upload/v1732429967/ahisi/1732429966569_produce-26.jpg"],
//     options: [
//       {
//         name: "1kg",
//         price: 150,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732429967/ahisi/1732429966569_produce-26.jpg",
//       },
//       {
//         name: "5kg",
//         price: 700,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732429967/ahisi/1732429966569_produce-26_5kg.jpg",
//       },
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 1 },
//       { rating: 4, count: 3 },
//       { rating: 5, count: 4 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: 'Watermelon',
//     slug: 'watermelon',
//     description: 'Watermelon is a sweet, juicy fruit with high water content, making it hydrating and refreshing. It\'s rich in vitamins A and C, low in calories, and perfect for snacking or adding to fruit salads.',
//     price: 3000,
//     list_price: 3000,
//     brand: 'Summer Farms',
//     avg_rating: 4.9,
//     num_reviews: 12,
//     num_sales: 20,
//     count_in_stock: 30,
//     stock_status: 'Out of Stock',
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0p000000000",
//     category_ids: ["6769a527-015a-bc57-a03e-c87000000000"], // Fruits
//     tags: ["new-arrival"],
//     images: ["https://res.cloudinary.com/ahisi/image/upload/v1732184338/ahisi/1732184337235_produce-5.jpg"],
//     options: [
//       {
//         name: "1 piece",
//         price: 3000,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732184338/ahisi/1732184337235_produce-5.jpg",
//       },
//       {
//         name: "Half",
//         price: 1500,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732184338/ahisi/1732184337235_produce-5_half.jpg",
//       },
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 0 },
//       { rating: 4, count: 2 },
//       { rating: 5, count: 10 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: 'Irish Potato',
//     slug: 'irish-potato',
//     description: 'Irish potatoes are rich in carbohydrates, fiber, and vitamins. They are versatile in cooking and are used in dishes like mashed potatoes, fries, and stews. The product is sourced from Jos.',
//     price: 4000,
//     list_price: 4000,
//     brand: 'Local Farm',
//     avg_rating: 4.5,
//     num_reviews: 6,
//     num_sales: 10,
//     count_in_stock: 25,
//     stock_status: 'In Stock',
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0q000000000",
//     category_ids: ["6769a8ca-015a-bc57-a03e-c8a500000000"], // Tubers
//     tags: ['new-arrival', "best-seller"],
//     images: ["https://res.cloudinary.com/ahisi/image/upload/v1732430067/ahisi/1732430066821_produce-1.png", "https://th.bing.com/th/id/R.aa0a7e5f75178906f0d2741f13543af0?rik=q4vuMh3PW8lGJg&riu=http%3a%2f%2fwww.valleyspuds.com%2fwp-content%2fuploads%2fValley-Spuds-Pile-of-White-Potatoes.jpg&ehk=ZQ5wZKG9ZoqCX22zdRT6MQaW6zeZyVUIQUbCWIpJ7kU%3d&risl=&pid=ImgRaw&r=0", "https://t4.ftcdn.net/jpg/02/75/77/89/360_F_275778955_xxJe5fQvDy5oXbjupdJ162zLwU4sf3kT.jpg"],
//     options: [
//       {
//         name: "1kg",
//         price: 4000,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732430067/ahisi/1732430066821_produce-1.png",
//       },
//       {
//         name: "2kg",
//         price: 7500,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732430067/ahisi/1732430066821_produce-1_2kg.png",
//       },
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 1 },
//       { rating: 4, count: 2 },
//       { rating: 5, count: 3 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: 'Garlic',
//     slug: 'garlic',
//     description: 'Garlic is a flavorful, aromatic bulb used in cooking and known for its health benefits, such as boosting immunity and supporting heart health.',
//     price: 7000,
//     list_price: 7000,
//     brand: 'Local Farm',
//     avg_rating: 4.7,
//     num_reviews: 8,
//     num_sales: 12,
//     count_in_stock: 30,
//     stock_status: 'Out of Stock',
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0r000000000",
//     category_ids: ["6769a979-015a-bc57-a03e-c8b500000000"], // General
//     tags: ["new-arrival"],
//     images: ["https://res.cloudinary.com/ahisi/image/upload/v1732540256/ahisi/1732540256046_produce-30.jpg"],
//     // nutritionalInfo: {
//     //   servingsPerContainer: '1.0',
//     //   servingSize: 'Tatasha (medium)',
//     //   calories: 95,
//     //   protein: 0.47,
//     //   sodium: 1.8,
//     //   fiber: 4.4,
//     //   sugars: 18.91
//     // },
//     options: [
//       {
//         name: "1kg - 22pcs",
//         price: 7000,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732540256/ahisi/1732540256046_produce-30.jpg",
//       },
//       {
//         name: "500g - 11pcs",
//         price: 3500,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732540256/ahisi/1732540256046_produce-30_500g.jpg",
//       },
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 1 },
//       { rating: 4, count: 3 },
//       { rating: 5, count: 4 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: 'Ginger',
//     slug: 'ginger',
//     description: 'Ginger is known for its spicy flavor and health benefits, including aiding digestion and reducing inflammation. It is used in cooking, baking and beverages.',
//     price: 5000,
//     list_price: 6500,
//     brand: 'Local Farm',
//     avg_rating: 4.6,
//     num_reviews: 7,
//     num_sales: 15,
//     count_in_stock: 40,
//     stock_status: 'In Stock',
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0s000000000",
//     category_ids: ["6769a979-015a-bc57-a03e-c8b500000000"], // General
//     tags: ['todays-deal'],
//     images: ["https://res.cloudinary.com/ahisi/image/upload/v1732430259/ahisi/1732430259444_produce-27.jpg"],
//     options: [
//       {
//         name: "1kg",
//         price: 5000,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732430259/ahisi/1732430259444_produce-27.jpg",
//       },
//       {
//         name: "500g",
//         price: 2500,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732430259/ahisi/1732430259444_produce-27_500g.jpg",
//       },
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 1 },
//       { rating: 4, count: 2 },
//       { rating: 5, count: 4 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: 'Turmeric',
//     slug: 'turmeric',
//     description: 'Turmeric is a yellow spice known for its earthy flavor and active compound, curcumin. It offers potential anti-inflammatory and antioxidant benefits and is used in cooking, natural remedies, and beauty products.',
//     price: 3000,
//     list_price: 3000,
//     brand: 'Local Farm',
//     avg_rating: 4.8,
//     num_reviews: 9,
//     num_sales: 18,
//     count_in_stock: 35,
//     stock_status: 'In Stock',
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0t000000000",
//     category_ids: ["6769a931-015a-bc57-a03e-c8ad00000000"], // Spices & Condiments
//     tags: ['new-arrival'],
//     images: ["https://res.cloudinary.com/ahisi/image/upload/v1732430481/ahisi/1732430481369_produce-29.jpg"],
//     options: [
//       {
//         name: "1kg",
//         price: 3000,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732430481/ahisi/1732430481369_produce-29.jpg",
//       },
//       {
//         name: "500g",
//         price: 1500,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732430481/ahisi/1732430481369_produce-29_500g.jpg",
//       },
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 1 },
//       { rating: 4, count: 3 },
//       { rating: 5, count: 5 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: 'Hibiscus',
//     slug: 'hibiscus',
//     description: 'Hibiscus (Zobo leaf) is a nutrient-rich plant known for its antioxidant, vitamin C, and mineral content. It is used to make a tangy herbal drink, offering health benefits like immune support, improved digestion, and reduced blood pressure.',
//     price: 2500,
//     list_price: 2500,
//     brand: 'Local Farm',
//     avg_rating: 4.9,
//     num_reviews: 10,
//     num_sales: 20,
//     count_in_stock: 11,
//     stock_status: 'In Stock',
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0u000000000",
//     category_ids: ["6769a952-015a-bc57-a03e-c8b100000000"], // Vegetables
//     tags: ['new-arrival', "best-seller"],
//     images: ["https://res.cloudinary.com/ahisi/image/upload/v1732430647/ahisi/1732430647434_produce-28.jpg"],
//     options: [
//       {
//         name: "1kg",
//         price: 2500,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732430647/ahisi/1732430647434_produce-28.jpg",
//       },
//       {
//         name: "500g",
//         price: 1250,
//         image: "https://res.cloudinary.com/ahisi/image/upload/v1732430647/ahisi/1732430647434_produce-28_500g.jpg",
//       },
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 1 },
//       { rating: 4, count: 2 },
//       { rating: 5, count: 7 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: "Bell Pepper",
//     slug: "bell-pepper",
//     description: "Fresh organic bell peppers packed with vitamins A and C. Perfect for salads, stir-fries, and grilling.",
//     price: 1800,
//     list_price: 2000,
//     brand: "Farm Fresh",
//     avg_rating: 3.7,
//     num_reviews: 15,
//     num_sales: 0,
//     count_in_stock: 20,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0v000000000",
//     category_ids: ["6769a952-015a-bc57-a03e-c8b100000000"], // Vegetables
//     tags: ["organic", "fresh"],
//     images: ["https://images.unsplash.com/photo-1625676982857-60e0455a419c?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1622376242797-538aa64a9d38?q=80&w=1419&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1640958904674-715dfa6a9693?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"],
//     options: [
//       {
//         name: "1kg",
//         price: 1800,
//         image: "https://images.unsplash.com/photo-1715554408457-47b02a5ee97b?q=80&w=1503&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
//       },
//       {
//         name: "500g",
//         price: 1000,
//         image: "https://images.unsplash.com/photo-1567229122875-bb3fbd000245?q=80&w=1375&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
//       }
//     ],
//     rating_distribution: [
//         { rating: 1, count: 0 },
//         { rating: 2, count: 3 },
//         { rating: 3, count: 3 },
//         { rating: 4, count: 2 },
//         { rating: 5, count: 7 },
//       ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: "Peach",
//     slug: "peach",
//     description: "Sweet and juicy watermelon, perfect for hot summer days. Rich in hydration and essential nutrients.",
//     price: 3500,
//     list_price: 4000,
//     brand: "Nature's Sweet",
//     avg_rating: 4.8,
//     num_reviews: 20,
//     num_sales: 0,
//     count_in_stock: 11,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0w000000000",
//     category_ids: ["6769a527-015a-bc57-a03e-c87000000000"], // Fruits
//     tags: ["juicy", "summer"],
//     images: ["https://images.unsplash.com/photo-1568702846914-96b305d2aaeb"],
//     options: [
//       {
//         name: "Whole",
//         price: 3500,
//         image: "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb"
//       },
//       {
//         name: "Half",
//         price: 2000,
//         image: "https://images.unsplash.com/photo-1571575173700-afb9492e6a50"
//       },
//       {
//         name: "Quarter",
//         price: 1500,
//         image: "https://images.unsplash.com/photo-1531171596281-8b5d26917d8b?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
//       },
//       {
//         name: "Nano",
//         price: 1000,
//         image: "https://images.unsplash.com/photo-1571575173700-afb9492e6a50"
//       },
//     ],
//     rating_distribution: [
//         { rating: 1, count: 0 },
//         { rating: 2, count: 7 },
//         { rating: 3, count: 3 },
//         { rating: 4, count: 2 },
//         { rating: 5, count: 7 },
//       ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: "Carrot",
//     slug: "carrot",
//     description: "Fresh crunchy carrots packed with beta-carotene and essential nutrients for eye health.",
//     price: 1200,
//     list_price: 1500,
//     brand: "Root Harvest",
//     avg_rating: 4.5,
//     num_reviews: 12,
//     num_sales: 0,
//     count_in_stock: 15,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0x000000000",
//     category_ids: ["6769a952-015a-bc57-a03e-c8b100000000"], // Vegetables
//     tags: ["crunchy", "vitamin-rich"],
//     images: ["https://images.unsplash.com/photo-1447175008436-054170c2e979"],
//     options: [
//       {
//         name: "1kg",
//         price: 1200,
//         image: "https://images.unsplash.com/photo-1447175008436-054170c2e979"
//       },
//       {
//         name: "500g",
//         price: 700,
//         image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37"
//       },
//       {
//         name: "250g",
//         price: 700,
//         image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37"
//       },
//       {
//         name: "100g",
//         price: 700,
//         image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37"
//       }
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 0 },
//       { rating: 4, count: 0 },
//       { rating: 5, count: 0 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: "Yam",
//     slug: "yam",
//     description: "Premium quality yam, a staple food rich in carbohydrates and essential minerals.",
//     price: 2800,
//     list_price: 3000,
//     brand: "Farm Roots",
//     avg_rating: 4.6,
//     num_reviews: 18,
//     num_sales: 0,
//     count_in_stock: 25,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0y000000000",
//     category_ids: ["6769a8ca-015a-bc57-a03e-c8a500000000"], // Tubers
//     tags: ["staple", "energy"],
//     images: ["https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"],
//     options: [
//       {
//         name: "1 tuber",
//         price: 2800,
//         image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"
//       },
//       {
//         name: "500g",
//         price: 1500,
//         image: "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
//       }
//     ],
//     rating_distribution: [
//         { rating: 1, count: 0 },
//         { rating: 2, count: 7 },
//         { rating: 3, count: 3 },
//         { rating: 4, count: 2 },
//         { rating: 5, count: 7 },
//       ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: "Chili Pepper",
//     slug: "chili-pepper",
//     description: "Hot chili peppers perfect for adding spice to your dishes. Rich in capsaicin for metabolism boost.",
//     price: 1500,
//     list_price: 1800,
//     brand: "Spice Masters",
//     avg_rating: 4.4,
//     num_reviews: 14,
//     num_sales: 0,
//     count_in_stock: 30,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0z000000000",
//     category_ids: ["6769a931-015a-bc57-a03e-c8ad00000000"], // Spices & Condiments
//     tags: ["spicy", "hot"],
//     images: [
//         "https://images.unsplash.com/photo-1743193143066-29d976eb6edd?q=80&w=1370&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", 
//         "https://images.unsplash.com/photo-1613884203976-facb46894ef6?q=80&w=1430&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
//         "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
//       ],
//     options: [
//       {
//         name: "200g",
//         price: 1500,
//         image: "https://images.unsplash.com/photo-1698171650767-2cfcd636c689?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
//       },
//       {
//         name: "100g",
//         price: 800,
//         image: "https://images.unsplash.com/photo-1599987662084-97832741bfa2?q=80&w=1404&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
//       }
//     ],
//     rating_distribution: [
//         { rating: 1, count: 0 },
//         { rating: 2, count: 7 },
//         { rating: 3, count: 3 },
//         { rating: 4, count: 2 },
//         { rating: 5, count: 7 },
//       ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: "Mango",
//     slug: "mango",
//     description: "Juicy sweet mangoes, the king of fruits. Rich in vitamins A and C with delicious tropical flavor.",
//     price: 2500,
//     list_price: 3000,
//     count_in_stock: 11,
//     brand: "Tropical Delight",
//     avg_rating: 4.9,
//     num_reviews: 25,
//     num_sales: 0,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j10000000000",
//     category_ids: ["6769a527-015a-bc57-a03e-c87000000000"], // Fruits
//     tags: ["sweet", "seasonal"],
//     images: ["https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"],
//     options: [
//       {
//         name: "1kg",
//         price: 2500,
//         image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"
//       },
//       {
//         name: "500g",
//         price: 1400,
//         image: "https://images.unsplash.com/photo-1571575173700-afb9492e6a50"
//       }
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 0 },
//       { rating: 4, count: 0 },
//       { rating: 5, count: 0 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: "Spinach",
//     slug: "spinach",
//     description: "Fresh organic spinach packed with iron and essential vitamins for healthy blood and bones.",
//     price: 1000,
//     list_price: 1200,
//     brand: "Green Leaf",
//     avg_rating: 4.6,
//     num_reviews: 16,
//     num_sales: 0,
//     count_in_stock: 20,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j11000000000",
//     category_ids: ["6769a952-015a-bc57-a03e-c8b100000000"], // Vegetables
//     tags: ["leafy", "iron-rich"],
//     images: ["https://images.unsplash.com/photo-1576045057995-568f588f82fb"],
//     options: [
//       {
//         name: "Bunch",
//         price: 1000,
//         image: "https://images.unsplash.com/photo-1576045057995-568f588f82fb"
//       },
//       {
//         name: "500g",
//         price: 600,
//         image: "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37"
//       }
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 0 },
//       { rating: 4, count: 0 },
//       { rating: 5, count: 0 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: "Sweet Potato",
//     slug: "sweet-potato",
//     description: "Nutritious sweet potatoes rich in fiber, vitamins, and antioxidants. Perfect for roasting or mashing.",
//     price: 1800,
//     list_price: 2000,
//     brand: "Root Goodness",
//     avg_rating: 4.7,
//     num_reviews: 14,
//     num_sales: 0,
//     count_in_stock: 18,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j12000000000",
//     category_ids: ["6769a8ca-015a-bc57-a03e-c8a500000000"], // Tubers
//     tags: ["nutritious", "versatile"],
//     images: ["https://images.unsplash.com/photo-1596124579923-4ff0425b1dd1"],
//     options: [
//       {
//         name: "1kg",
//         price: 1800,
//         image: "https://images.unsplash.com/photo-1596124579923-4ff0425b1dd1"
//       },
//       {
//         name: "500g",
//         price: 1000,
//         image: "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
//       }
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 0 },
//       { rating: 4, count: 0 },
//       { rating: 5, count: 0 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: "Pineapple",
//     slug: "pineapple",
//     description: "Juicy tropical pineapple with perfect balance of sweetness and acidity. Rich in bromelain for digestion.",
//     price: 3000,
//     list_price: 3500,
//     brand: "Tropical Gold",
//     avg_rating: 4.8,
//     num_reviews: 18,
//     num_sales: 0,
//     count_in_stock: 15,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j13000000000",
//     category_ids: ["6769a527-015a-bc57-a03e-c87000000000"], // Fruits
//     tags: ["tropical", "sweet"],
//     images: ["https://images.unsplash.com/photo-1550258987-190a2d41a8ba"],
//     options: [
//       {
//         name: "Whole",
//         price: 3000,
//         image: "https://images.unsplash.com/photo-1550258987-190a2d41a8ba"
//       },
//       {
//         name: "Half",
//         price: 1700,
//         image: "https://images.unsplash.com/photo-1571575173700-afb9492e6a50"
//       }
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 0 },
//       { rating: 4, count: 0 },
//       { rating: 5, count: 0 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//     name: "Cassava",
//     slug: "cassava",
//     description: "Fresh cassava roots, a gluten-free staple food rich in carbohydrates and essential minerals.",
//     price: 2200,
//     list_price: 2500,
//     brand: "Root Essentials",
//     avg_rating: 4.5,
//     num_reviews: 12,
//     num_sales: 0,
//     count_in_stock: 20,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j14000000000",
//     category_ids: ["6769a8ca-015a-bc57-a03e-c8a500000000"], // Tubers
//     tags: ["staple", "gluten-free"],
//     images: ["https://images.unsplash.com/photo-1603569283847-aa295f0d016a"],
//     options: [
//       {
//         name: "1kg",
//         price: 2200,
//         image: "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
//       },
//       {
//         name: "500g",
//         price: 1200,
//         image: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"
//       }
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 0 },
//       { rating: 4, count: 0 },
//       { rating: 5, count: 0 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//       name: "Broccoli",
//       slug: "broccoli",
//     description: "Fresh broccoli, rich in vitamins and minerals, perfect for steaming or stir-frying.",
//       price: 1800,
//     list_price: 2000,
//       brand: "Green Valley",
//     avg_rating: 4.7,
//     num_reviews: 10,
//     num_sales: 0,
//     count_in_stock: 15,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j13000000000",
//     category_ids: ["6769a952-015a-bc57-a03e-c8b100000000"], // Vegetables
//     tags: ["fresh-vegetables", "trending"],
//     images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"],
//       options: [
//         {
//           name: "1kg",
//           price: 1800,
//           image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"
//         }
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 0 },
//       { rating: 4, count: 0 },
//       { rating: 5, count: 0 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//       name: "Cucumber",
//       slug: "cucumber",
//     description: "Crisp and refreshing cucumbers, great for salads and hydration.",
//       price: 900,
//     list_price: 1000,
//       brand: "Veggie Delight",
//     avg_rating: 4.5,
//     num_reviews: 8,
//     num_sales: 0,
//     count_in_stock: 25,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j0x000000000",
//     category_ids: ["6769a952-015a-bc57-a03e-c8b100000000"], // Vegetables
//     tags: ["fresh-vegetables", "trending"],
//     images: ["https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"],
//       options: [
//         {
//           name: "1kg",
//           price: 900,
//           image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"
//         }
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 0 },
//       { rating: 4, count: 0 },
//       { rating: 5, count: 0 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   },
//   {
//     id: uuid(),
//       name: "Lettuce",
//       slug: "lettuce",
//     description: "Fresh lettuce, perfect for salads and sandwiches.",
//       price: 700,
//     list_price: 800,
//       brand: "Leafy Greens",
//     avg_rating: 4.8,
//     num_reviews: 12,
//     num_sales: 0,
//     count_in_stock: 30,
//     stock_status: "In Stock",
//     is_published: true,
//     vendor_id: "65a1b2c3-d4e5-f6g7-h8i9-j11000000000",
//     category_ids: ["6769a952-015a-bc57-a03e-c8b100000000"], // Vegetables
//     tags: ["fresh-vegetables"],
//     images: ["https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=800&q=80"],
//       options: [
//         {
//           name: "Bunch",
//           price: 700,
//           image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=800&q=80"
//         }
//     ],
//     rating_distribution: [
//       { rating: 1, count: 0 },
//       { rating: 2, count: 0 },
//       { rating: 3, count: 0 },
//       { rating: 4, count: 0 },
//       { rating: 5, count: 0 },
//     ],
//     created_at: "2025-01-01T00:00:00.000Z",
//     updated_at: "2025-01-01T00:00:00.000Z"
//   }
// ].map(product => {
//   const newId = uuid();
//   // Map vendor_id and category_ids to new UUIDs
//   const vendor_id = vendorIdMap[product.vendor_id];
//   const category_ids = (product.category_ids || []).map(cid => categoryIdMap[cid]);
//   // Remove vendor field if present
//   const { vendor, ...rest } = product;
//   return { ...rest, id: newId, vendor_id, category_ids };
// });

// module.exports = { vendors, categories, products };