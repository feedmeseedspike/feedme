import { toSlug } from "src/lib/utils"

export const headerMenus =  [
  {
    name: "Today's Deal",
    href: '/todays-deal',
  },
  {
    name: 'Completed Orders',
    href: '/account/order',
  },
  {
    name: 'Favourites',
    href: '/account/favourites',
  },
  // {
  //   name: 'Subscriptions',
  //   href: '/search?tag=subcriptions',
  // },
  {
    name: 'Customer Support',
    href: '/customer-support',
  },
  // {
  //   name: 'Vendors',
  //   href: '/vendors',
  // },
  // {
  //   name: 'About Us',
  //   href: '/page/about-us',
  // },
  // {
  //   name: 'Help',
  //   href: '/page/help',
  // },
]

export const products = [
  {
    _id: "66ec2b2abc0e9yrha6616686",
    name: 'Onion',
    slug: toSlug('Onion'),
    category: ['General'],
    images: ["https://res.cloudinary.com/ahisi/image/upload/v1732183603/ahisi/1732183602881_produce.jpg", '/images/p11-2.jpg'],
    tags: ['new-arrival', "best-seller", "fresh-vegetables"],
    isPublished: false,
    price: 3000,
    listPrice: 0,
    brand: 'Onion',
    vendor: {
      id: "65a1b2c3d4e5f6g7h8i9j0k",
      shopId: "Shop1103816097",
      displayName: "FarmFresh Produce",
      logo: "https://res.cloudinary.com/ahisi/image/upload/v1732183603/ahisi/vendor_logos/farmfresh_logo.jpg"
    },
    avgRating: 4.71,
    numReviews: 7,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 2 },
      { rating: 5, count: 5 },
    ],
    numSales: 9,
    countInStock: 11,
    stockStatus: 'In Stock',
    description: 'Onions are versatile root vegetables known for their sharp flavor, aroma, and health benefits. Available in red, and white varieties.',
    colors: ['White', 'Brown'],
    options: [
      {
        name: "1kg",
        price: 3000,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732183603/ahisi/1732183602881_produce.jpg",
      },
      {
        name: "2kg",
        price: 5500,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732183603/ahisi/1732183602881_produce_2kg.jpg",
      },
      {
        name: "5kg",
        price: 12000,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732183603/ahisi/1732183602881_produce_5kg.jpg",
      },
    ],
    reviews: [],
  },
  {
    _id: "66ec2b2abc0e9f3ea6616686",
    name: "Riverbite",
    slug: "riverbite",
    category: ["Pepper"],
    images: ["https://res.cloudinary.com/ahisi/image/upload/v1732000738/ahisi/1732000738261_produce_20241119_081636_0000.jpg"],
    brand: "Riverbite",
    vendor: {
      id: "65a1b2c3d4e5f6g7h8i9j0l",
      shopId: "Shop2204927108",
      displayName: "Riverbite Fisheries",
      logo: "https://res.cloudinary.com/ahisi/image/upload/v1732000738/ahisi/vendor_logos/riverbite_logo.jpg"
    },
    description: "Riverbite is a premium smoked catfish snack set apart by superior quality and careful preparation. Each package contains four expertly degutted catfish cutlets.",
    price: 5850,
    listPrice: 5850,
    countInStock: 50,
    tags: ["best-seller", "todays-deal"],
    colors: [],
    sizes: [],
    avgRating: 0,
    numReviews: 0,
    stockStatus: 'In Stock',
    ratingDistribution: [],
    numSales: 0,
    isPublished: true,
    reviews: [],
    createdAt: "2025-01-28T13:56:48.184Z",
    updatedAt: "2024-11-28T14:29:10.916Z",
    options: [
      {
        name: "Standard Pack",
        price: 5850,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732000738/ahisi/1732000738261_produce_20241119_081636_0000.jpg",
      },
    ],
  },
  {
    _id: "66ec2b2abgh0e9f3ea6jtk4616686",
    name: 'Apple',
    slug: toSlug('Apple'),
    category: ['Fruits'],
    images: ["https://res.cloudinary.com/ahisi/image/upload/v1732372960/ahisi/1732372957967_1732110649466_produce-1.jpg"],
    tags: ["new-arrival", "fresh-fruits"],
    isPublished: true,
    price: 650,
    listPrice: 650,
    brand: 'Local Farm',
    vendor: {
      id: "65a1b2c3d4e5f6g7h8i9j0m",
      shopId: "Shop3306038119",
      displayName: "Orchard Direct",
      logo: "https://res.cloudinary.com/ahisi/image/upload/v1732372960/ahisi/vendor_logos/orchard_logo.jpg"
    },
    avgRating: 4.5,
    numReviews: 5,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 1 },
      { rating: 4, count: 2 },
      { rating: 5, count: 2 },
    ],
    numSales: 7,
    countInStock: 20,
    stockStatus: 'Out of Stock',
    description: 'Apples are versatile, and used in snacks, baking, and juices. They come in various colors and are rich in fiber, vitamin C, and antioxidants.',
    colors: ['Red', 'Green', 'Yellow'],
    options: [
      {
        name: "1kg",
        price: 650,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732372960/ahisi/1732372957967_1732110649466_produce-1.jpg",
      },
      {
        name: "2kg",
        price: 1200,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732372960/ahisi/1732372957967_1732110649466_produce-1_2kg.jpg",
      },
    ],
    reviews: [],
  },
  {
    _id: "66ec2b2abgh0e9fhrj33ea6616686",
    name: 'Pineapple',
    slug: toSlug('Pineapple'),
    category: ['Fruits'],
    images: ["https://res.cloudinary.com/ahisi/image/upload/v1732136297/ahisi/1732136297347_produce-2.jpg"],
    tags: ['new-arrival', "todays-deal"],
    isPublished: true,
    price: 1550,
    listPrice: 1550,
    brand: 'Tropical Farms',
    vendor: {
      id: "65a1b2c3d4e5f6g7h8i9j0n",
      shopId: "Shop4407149120",
      displayName: "Tropical Delights",
      logo: "https://res.cloudinary.com/ahisi/image/upload/v1732136297/ahisi/vendor_logos/tropical_logo.jpg"
    },
    avgRating: 4.8,
    numReviews: 10,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 1 },
      { rating: 4, count: 3 },
      { rating: 5, count: 6 },
    ],
    numSales: 12,
    countInStock: 25,
    stockStatus: 'In Stock',
    description: 'Pineapple is a tropical fruit with a sweet, tangy flavor and high in Vitamin C, fiber, and antioxidants. It is enjoyed fresh or in various dishes like smoothies, desserts, and juices.',
    colors: ['Yellow'],
    options: [
      {
        name: "1 piece",
        price: 1550,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732136297/ahisi/1732136297347_produce-2.jpg",
      },
      {
        name: "2 pieces",
        price: 3000,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732136297/ahisi/1732136297347_produce-2_2pieces.jpg",
      },
    ],
    reviews: [],
  },
  {
    _id: "66ec2ngjrkb2abgh0e9f3ea6616686",
    name: 'Orange',
    slug: toSlug('Orange'),
    category: ['Fruits'],
    images: ["https://res.cloudinary.com/ahisi/image/upload/v1732429967/ahisi/1732429966569_produce-26.jpg"],
    tags: ["new-arrival", "fresh-fruits"],
    isPublished: true,
    price: 150,
    listPrice: 150,
    brand: 'Citrus Farms',
    vendor: {
      id: "65a1b2c3d4e5f6g7h8i9j0o",
      shopId: "Shop5508260131",
      displayName: "Citrus Valley",
      logo: "https://res.cloudinary.com/ahisi/image/upload/v1732429967/ahisi/vendor_logos/citrus_logo.jpg"
    },
    avgRating: 4.6,
    numReviews: 8,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 1 },
      { rating: 4, count: 3 },
      { rating: 5, count: 4 },
    ],
    numSales: 15,
    countInStock: 50,
    stockStatus: 'In Stock',
    description: 'Oranges are often eaten fresh, juiced, or used in cooking and baking. They are a popular choice for boosting immunity and promoting hydration.',
    colors: ['Orange'],
    options: [
      {
        name: "1kg",
        price: 150,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732429967/ahisi/1732429966569_produce-26.jpg",
      },
      {
        name: "5kg",
        price: 700,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732429967/ahisi/1732429966569_produce-26_5kg.jpg",
      },
    ],
    reviews: [],
  },
  {
    _id: "66ec2bbfd2abgh0e9f3ea6616686",
    name: 'Watermelon',
    slug: toSlug('Watermelon'),
    category: ['Fruits'],
    images: ["https://res.cloudinary.com/ahisi/image/upload/v1732184338/ahisi/1732184337235_produce-5.jpg"],
    tags: ["new-arrival"],
    isPublished: true,
    price: 3000,
    listPrice: 3000,
    brand: 'Summer Farms',
    vendor: {
      id: "65a1b2c3d4e5f6g7h8i9j0p",
      shopId: "Shop6609371142",
      displayName: "Summer Harvest",
      logo: "https://res.cloudinary.com/ahisi/image/upload/v1732184338/ahisi/vendor_logos/summer_logo.jpg"
    },
    avgRating: 4.9,
    numReviews: 12,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 0 },
      { rating: 4, count: 2 },
      { rating: 5, count: 10 },
    ],
    numSales: 20,
    countInStock: 30,
    stockStatus: 'Out of Stock',
    description: 'Watermelon is a sweet, juicy fruit with high water content, making it hydrating and refreshing. It\'s rich in vitamins A and C, low in calories, and perfect for snacking or adding to fruit salads.',
    colors: ['Green', 'Red'],
    options: [
      {
        name: "1 piece",
        price: 3000,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732184338/ahisi/1732184337235_produce-5.jpg",
      },
      {
        name: "Half",
        price: 1500,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732184338/ahisi/1732184337235_produce-5_half.jpg",
      },
    ],
    reviews: [],
  },
  {
    _id: "66ec2b2abgh0e9f3ea6616686",
    name: 'Irish Potato',
    slug: toSlug('Irish Potato'),
    category: ['Tubers'],
    images: ["https://res.cloudinary.com/ahisi/image/upload/v1732430067/ahisi/1732430066821_produce-1.png", "https://th.bing.com/th/id/R.aa0a7e5f75178906f0d2741f13543af0?rik=q4vuMh3PW8lGJg&riu=http%3a%2f%2fwww.valleyspuds.com%2fwp-content%2fuploads%2fValley-Spuds-Pile-of-White-Potatoes.jpg&ehk=ZQ5wZKG9ZoqCX22zdRT6MQaW6zeZyVUIQUbCWIpJ7kU%3d&risl=&pid=ImgRaw&r=0", "https://t4.ftcdn.net/jpg/02/75/77/89/360_F_275778955_xxJe5fQvDy5oXbjupdJ162zLwU4sf3kT.jpg"],
    tags: ['new-arrival', "best-seller"],
    isPublished: true,
    price: 4000,
    listPrice: 4000,
    brand: 'Local Farm',
    vendor: {
      id: "65a1b2c3d4e5f6g7h8i9j0q",
      shopId: "Shop7710482153",
      displayName: "Potato King",
      logo: "https://res.cloudinary.com/ahisi/image/upload/v1732430067/ahisi/vendor_logos/potato_logo.jpg"
    },
    avgRating: 4.5,
    numReviews: 6,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 1 },
      { rating: 4, count: 2 },
      { rating: 5, count: 3 },
    ],
    numSales: 10,
    countInStock: 25,
    stockStatus: 'In Stock',
    description: 'Irish potatoes are rich in carbohydrates, fiber, and vitamins. They are versatile in cooking and are used in dishes like mashed potatoes, fries, and stews. The product is sourced from Jos.',
    colors: ['Brown'],
    options: [
      {
        name: "1kg",
        price: 4000,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732430067/ahisi/1732430066821_produce-1.png",
      },
      {
        name: "2kg",
        price: 7500,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732430067/ahisi/1732430066821_produce-1_2kg.png",
      },
    ],
    reviews: [
      {
        "product": "60c72b2f9e1d4b4c5c5c5c5c",
        "user": "60c72b2f9e1d4b4c5c5c5c6d",
        "isVerifiedPurchase": true,
        "title": "Great Product!",
        "comment": " Lorem ipsum dolor, sit amet consectetur adipisicing elit. Laudantium voluptatibus beatae error distinctio? Hic distinctio perspiciatis, nesciunt laudantium error rerum atque suscipit debitis illo, tenetur accusamus optio maxime molestias labore.",
        "rating": 5
      },
      {
        "product": "60c72b2f9e1d4b4c5c5c5c5c",
        "user": "60c72b2f9e1d4b4c5c5c5c6e",
        "isVerifiedPurchase": false,
        "title": "Not what I expected",
        "comment": "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Laudantium voluptatibus beatae error distinctio? Hic distinctio perspiciatis, nesciunt laudantium error rerum atque suscipit debitis illo, tenetur accusamus optio maxime molestias labore.",
        "rating": 3
      },
      {
        "product": "60c72b2f9e1d4b4c5c5c5c5c",
        "user": "60c72b2f9e1d4b4c5c5c5c6f",
        "isVerifiedPurchase": true,
        "title": "Good Value for Money",
        "comment": "Lorem ipsum dolor, sit amet consectetur adipisicing elit. Laudantium voluptatibus beatae error distinctio? Hic distinctio perspiciatis, nesciunt laudantium error rerum atque suscipit debitis illo, tenetur accusamus optio maxime molestias labore.",
        "rating": 4
      }
    ],
  },
  {
    _id: "66ec2b2abgh0e9no03f3ea6616686",
    name: 'Garlic',
    slug: toSlug('Garlic)'),
    category: ['General'],
    images: ["https://res.cloudinary.com/ahisi/image/upload/v1732540256/ahisi/1732540256046_produce-30.jpg"],
    tags: ["new-arrival"],
    isPublished: true,
    price: 7000,
    listPrice: 7000,
    brand: 'Local Farm',
    vendor: {
      id: "65a1b2c3d4e5f6g7h8i9j0r",
      shopId: "Shop8811593164",
      displayName: "Garlic Masters",
      logo: "https://res.cloudinary.com/ahisi/image/upload/v1732540256/ahisi/vendor_logos/garlic_logo.jpg"
    },
    avgRating: 4.7,
    numReviews: 8,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 1 },
      { rating: 4, count: 3 },
      { rating: 5, count: 4 },
    ],
    numSales: 12,
    countInStock: 30,
    stockStatus: 'Out of Stock',
    description: 'Garlic is a flavorful, aromatic bulb used in cooking and known for its health benefits, such as boosting immunity and supporting heart health.',
    nutritionalInfo: {
      servingsPerContainer: '1.0',
      servingSize: 'Tatasha (medium)',
      calories: 95,
      protein: 0.47,
      sodium: 1.8,
      fiber: 4.4,
      sugars: 18.91
    },
    colors: ['White'],
    options: [
      {
        name: "1kg - 22pcs",
        price: 7000,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732540256/ahisi/1732540256046_produce-30.jpg",
      },
      {
        name: "500g - 11pcs",
        price: 3500,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732540256/ahisi/1732540256046_produce-30_500g.jpg",
      },
    ],
    reviews: [],
  },
  {
    _id: "66ec2b2afdbc0e9f3ea6616686",
    name: 'Ginger',
    slug: toSlug('Ginger'),
    category: ['General'],
    images: ["https://res.cloudinary.com/ahisi/image/upload/v1732430259/ahisi/1732430259444_produce-27.jpg"],
    tags: ['todays-deal'],
    isPublished: true,
    price: 5000,
    listPrice: 6500,
    brand: 'Local Farm',
    vendor: {
      id: "65a1b2c3d4e5f6g7h8i9j0s",
      shopId: "Shop9922704175",
      displayName: "Ginger Roots",
      logo: "https://res.cloudinary.com/ahisi/image/upload/v1732430259/ahisi/vendor_logos/ginger_logo.jpg"
    },
    avgRating: 4.6,
    numReviews: 7,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 1 },
      { rating: 4, count: 2 },
      { rating: 5, count: 4 },
    ],
    numSales: 15,
    countInStock: 40,
    stockStatus: 'In Stock',
    description: 'Ginger is known for its spicy flavor and health benefits, including aiding digestion and reducing inflammation. It is used in cooking, baking and beverages.',
    colors: ['Beige'],
    options: [
      {
        name: "1kg",
        price: 5000,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732430259/ahisi/1732430259444_produce-27.jpg",
      },
      {
        name: "500g",
        price: 2500,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732430259/ahisi/1732430259444_produce-27_500g.jpg",
      },
    ],
    reviews: [],
  },
  {
    _id: "66e3267ec2b2abgh0e9f3ea6616686",
    name: 'Turmeric',
    slug: toSlug('Turmeric'),
    category: ['Spices and Condiments'],
    images: ["https://res.cloudinary.com/ahisi/image/upload/v1732430481/ahisi/1732430481369_produce-29.jpg"],
    tags: ['new-arrival'],
    isPublished: true,
    price: 3000,
    listPrice: 3000,
    brand: 'Local Farm',
    vendor: {
      id: "65a1b2c3d4e5f6g7h8i9j0t",
      shopId: "Shop1033815186",
      displayName: "Spice World",
      logo: "https://res.cloudinary.com/ahisi/image/upload/v1732430481/ahisi/vendor_logos/spice_logo.jpg"
    },
    avgRating: 4.8,
    numReviews: 9,
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 1 },
      { rating: 4, count: 3 },
      { rating: 5, count: 5 },
    ],
    numSales: 18,
    countInStock: 35,
    stockStatus: 'In Stock',
    description: 'Turmeric is a yellow spice known for its earthy flavor and active compound, curcumin. It offers potential anti-inflammatory and antioxidant benefits and is used in cooking, natural remedies, and beauty products.',
    colors: ['Yellow'],
    options: [
      {
        name: "1kg",
        price: 3000,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732430481/ahisi/1732430481369_produce-29.jpg",
      },
      {
        name: "500g",
        price: 1500,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732430481/ahisi/1732430481369_produce-29_500g.jpg",
      },
    ],
    reviews: [
      {
        "product": "60c72b2f9e1d4b4c5c5c5c5c",
        "user": "60c72b2f9e1d4b4c5c5c5c6d",
        "isVerifiedPurchase": true,
        "title": "Great Product!",
        "comment": "I absolutely love this product. The quality is amazing, and it does exactly what it promises.",
        "rating": 5
      },
      {
        "product": "60c72b2f9e1d4b4c5c5c5c5c",
        "user": "60c72b2f9e1d4b4c5c5c5c6e",
        "isVerifiedPurchase": false,
        "title": "Not what I expected",
        "comment": "The product was decent, but not as described. It didn't match the images on the website.",
        "rating": 3
      },
      {
        "product": "60c72b2f9e1d4b4c5c5c5c5c",
        "user": "60c72b2f9e1d4b4c5c5c5c6f",
        "isVerifiedPurchase": true,
        "title": "Good Value for Money",
        "comment": "For the price, it's a great deal. It has some minor issues, but nothing too major.",
        "rating": 4
      }
    ],
  },
  {
    _id: "66ed7c2b2abc0e9f3ea6616686",
    name: 'Hibiscus',
    slug: toSlug('Hibiscus'),
    category: ['Vegetables'],
    images: ["https://res.cloudinary.com/ahisi/image/upload/v1732430647/ahisi/1732430647434_produce-28.jpg"],
    tags: ['new-arrival', "best-seller"],
    isPublished: true,
    price: 2500,
    listPrice: 2500,
    brand: 'Local Farm',
    vendor: {
      id: "65a1b2c3d4e5f6g7h8i9j0u",
      shopId: "Shop1144926197",
      displayName: "Herbal Haven",
      logo: "https://res.cloudinary.com/ahisi/image/upload/v1732430647/ahisi/vendor_logos/herbal_logo.jpg"
    },
    countInStock: 11,
    avgRating: 4.9,
    numReviews: 10,
    stockStatus: 'In Stock',
    ratingDistribution: [
      { rating: 1, count: 0 },
      { rating: 2, count: 0 },
      { rating: 3, count: 1 },
      { rating: 4, count: 2 },
      { rating: 5, count: 7 },
    ],
    numSales: 20,
    description: 'Hibiscus (Zobo leaf) is a nutrient-rich plant known for its antioxidant, vitamin C, and mineral content. It is used to make a tangy herbal drink, offering health benefits like immune support, improved digestion, and reduced blood pressure.',
    colors: ['Red'],
    options: [
      {
        name: "1kg",
        price: 2500,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732430647/ahisi/1732430647434_produce-28.jpg",
      },
      {
        name: "500g",
        price: 1250,
        image: "https://res.cloudinary.com/ahisi/image/upload/v1732430647/ahisi/1732430647434_produce-28_500g.jpg",
      },
    ],
    reviews: [
      {
        "product": "60c72b2f9e1d4b4c5c5c5c5c",
        "user": "60c72b2f9e1d4b4c5c5c5c6d",
        "isVerifiedPurchase": true,
        "title": "Great Product!",
        "comment": "I absolutely love this product. The quality is amazing, and it does exactly what it promises.",
        "rating": 5,
        "helpfulCount": 12,
        "reports": []
      },
      {
        "product": "60c72b2f9e1d4b4c5c5c5c5c",
        "user": "60c72b2f9e1d4b4c5c5c5c6e",
        "isVerifiedPurchase": false,
        "title": "Not what I expected",
        "comment": "The product was decent, but not as described. It didn't match the images on the website.",
        "rating": 3,
        "helpfulCount": 14,
        "reports": []
      },
      {
        "product": "60c72b2f9e1d4b4c5c5c5c5c",
        "user": "60c72b2f9e1d4b4c5c5c5c6f",
        "isVerifiedPurchase": true,
        "title": "Good Value for Money",
        "comment": "For the price, it's a great deal. It has some minor issues, but nothing too major.",
        "rating": 4,
        "helpfulCount": 8,
        "reports": []
      }
    ],
  },
    {
      "_id": "66ed7c2b2abc0e9f3ea6616687",
      "name": "Bell Pepper",
      "slug": "bell-pepper",
      "category": ["Pepper"],
      "images": ["https://images.unsplash.com/photo-1625676982857-60e0455a419c?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1622376242797-538aa64a9d38?q=80&w=1419&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", "https://images.unsplash.com/photo-1640958904674-715dfa6a9693?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"],
      "tags": ["organic", "fresh"],
      "isPublished": true,
      "price": 1800,
      "listPrice": 2000,
      "brand": "Farm Fresh",
      "vendor": {
        "id": "65a1b2c3d4e5f6g7h8i9j0v",
        "shopId": "Shop2144926197",
        "displayName": "Pepper Paradise",
        "logo": "https://images.unsplash.com/photo-1606787366850-de6330128bfc"
      },
      "avgRating": 3.7,
      "numReviews": 15,
      ratingDistribution: [
        { rating: 1, count: 0 },
        { rating: 2, count: 3 },
        { rating: 3, count: 3 },
        { rating: 4, count: 2 },
        { rating: 5, count: 7 },
      ],
      "stockStatus": "In Stock",
      "description": "Fresh organic bell peppers packed with vitamins A and C. Perfect for salads, stir-fries, and grilling.",
      "colors": ["Red", "Yellow", "Green"],
      "options": [
        {
          "name": "1kg",
          "price": 1800,
          "image": "https://images.unsplash.com/photo-1715554408457-47b02a5ee97b?q=80&w=1503&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        },
        {
          "name": "500g",
          "price": 1000,
          "image": "https://images.unsplash.com/photo-1567229122875-bb3fbd000245?q=80&w=1375&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        }
      ]
    },
    {
      "_id": "66ed7c2b2abc0e9f3ea6616688",
      "name": "Peach",
      "slug": "peach",
      "category": ["Fruits"],
      "images": ["https://images.unsplash.com/photo-1568702846914-96b305d2aaeb"],
      "tags": ["juicy", "summer"],
      "isPublished": true,
      "price": 3500,
      "listPrice": 4000,
      "brand": "Nature's Sweet",
      "vendor": {
        "id": "65a1b2c3d4e5f6g7h8i9j0w",
        "shopId": "Shop3144926197",
        "displayName": "Fruit Haven",
        "logo": "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
      },
      "avgRating": 4.8,
      "numReviews": 20,
      countInStock: 11,
      ratingDistribution: [
        { rating: 1, count: 0 },
        { rating: 2, count: 7 },
        { rating: 3, count: 3 },
        { rating: 4, count: 2 },
        { rating: 5, count: 7 },
      ],
      "stockStatus": "In Stock",
      "description": "Sweet and juicy watermelon, perfect for hot summer days. Rich in hydration and essential nutrients.",
      "colors": ["Red"],
      "options": [
        {
          "name": "Whole",
          "price": 3500,
          "image": "https://images.unsplash.com/photo-1568702846914-96b305d2aaeb"
        },
        {
          "name": "Half",
          "price": 2000,
          "image": "https://images.unsplash.com/photo-1571575173700-afb9492e6a50"
        },
        {
          "name": "Quarter",
          "price": 1500,
          "image": "https://images.unsplash.com/photo-1531171596281-8b5d26917d8b?q=80&w=1470&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        },
        {
          "name": "Nano",
          "price": 1000,
          "image": "https://images.unsplash.com/photo-1571575173700-afb9492e6a50"
        },
      ]
    },
    {
      "_id": "66ed7c2b2abc0e9f3ea6616689",
      "name": "Carrot",
      "slug": "carrot",
      "category": ["Vegetable"],
      "images": ["https://images.unsplash.com/photo-1447175008436-054170c2e979"],
      "tags": ["crunchy", "vitamin-rich"],
      "isPublished": true,
      "price": 1200,
      "listPrice": 1500,
      "brand": "Root Harvest",
      "vendor": {
        "id": "65a1b2c3d4e5f6g7h8i9j0x",
        "shopId": "Shop4144926197",
        "displayName": "Veggie Delight",
        "logo": "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"
      },
      "avgRating": 4.5,
      "numReviews": 12,
      "stockStatus": "In Stock",
      "description": "Fresh crunchy carrots packed with beta-carotene and essential nutrients for eye health.",
      "colors": ["Orange"],
      "options": [
        {
          "name": "1kg",
          "price": 1200,
          "image": "https://images.unsplash.com/photo-1447175008436-054170c2e979"
        },
        {
          "name": "500g",
          "price": 700,
          "image": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37"
        },
        {
          "name": "250g",
          "price": 700,
          "image": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37"
        },
        {
          "name": "100g",
          "price": 700,
          "image": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37"
        }
      ]
    },
    {
      "_id": "66ed7c2b2abc0e9f3ea6616690",
      "name": "Yam",
      "slug": "yam",
      "category": ["Tuber"],
      "images": ["https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"],
      "tags": ["staple", "energy"],
      "isPublished": true,
      "price": 2800,
      "listPrice": 3000,
      "brand": "Farm Roots",
      "vendor": {
        "id": "65a1b2c3d4e5f6g7h8i9j0y",
        "shopId": "Shop5144926197",
        "displayName": "Tuber World",
        "logo": "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
      },
      "avgRating": 4.6,
      ratingDistribution: [
        { rating: 1, count: 0 },
        { rating: 2, count: 7 },
        { rating: 3, count: 3 },
        { rating: 4, count: 2 },
        { rating: 5, count: 7 },
      ],
      "numReviews": 18,
      "stockStatus": "In Stock",
      "description": "Premium quality yam, a staple food rich in carbohydrates and essential minerals.",
      "colors": ["Brown"],
      "options": [
        {
          "name": "1 tuber",
          "price": 2800,
          "image": "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"
        },
        {
          "name": "500g",
          "price": 1500,
          "image": "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
        }
      ]
    },
    {
      "_id": "66ed7c2b2abc0e9f3ea6616691",
      "name": "Chili Pepper",
      "slug": "chili-pepper",
      "category": ["Pepper"],
      "images": [
        "https://images.unsplash.com/photo-1743193143066-29d976eb6edd?q=80&w=1370&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D", 
        "https://images.unsplash.com/photo-1613884203976-facb46894ef6?q=80&w=1430&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
        "https://images.unsplash.com/photo-1583119022894-919a68a3d0e3?q=80&w=1480&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
      ],
      "tags": ["spicy", "hot"],
      "isPublished": true,
      "price": 1500,
      "listPrice": 1800,
      "brand": "Spice Masters",
      "vendor": {
        "id": "65a1b2c3d4e5f6g7h8i9j0z",
        "shopId": "Shop6144926197",
        "displayName": "Pepper Heat",
        "logo": "https://images.unsplash.com/photo-1606787366850-de6330128bfc"
      },
      "avgRating": 4.4,
      "numReviews": 14,
      "stockStatus": "In Stock",
      "description": "Hot chili peppers perfect for adding spice to your dishes. Rich in capsaicin for metabolism boost.",
      "colors": ["Red", "Green"],
      ratingDistribution: [
        { rating: 1, count: 0 },
        { rating: 2, count: 7 },
        { rating: 3, count: 3 },
        { rating: 4, count: 2 },
        { rating: 5, count: 7 },
      ],
      "options": [
        {
          "name": "200g",
          "price": 1500,
          "image": "https://images.unsplash.com/photo-1698171650767-2cfcd636c689?q=80&w=1374&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        },
        {
          "name": "100g",
          "price": 800,
          "image": "https://images.unsplash.com/photo-1599987662084-97832741bfa2?q=80&w=1404&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
        }
      ]
    },
    {
      "_id": "66ed7c2b2abc0e9f3ea6616692",
      "name": "Mango",
      "slug": "mango",
      "category": ["Fruits"],
      "images": ["https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"],
      "tags": ["sweet", "seasonal"],
      "isPublished": true,
      "price": 2500,
      "listPrice": 3000,
      "countInStock": 11,
      "brand": "Tropical Delight",
      "vendor": {
        "id": "65a1b2c3d4e5f6g7h8i9j10",
        "shopId": "Shop7144926197",
        "displayName": "Fruit Kingdom",
        "logo": "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
      },
      "avgRating": 4.9,
      "numReviews": 25,
      "stockStatus": "In Stock",
      "description": "Juicy sweet mangoes, the king of fruits. Rich in vitamins A and C with delicious tropical flavor.",
      "colors": ["Yellow", "Orange"],
      "options": [
        {
          "name": "1kg",
          "price": 2500,
          "image": "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"
        },
        {
          "name": "500g",
          "price": 1400,
          "image": "https://images.unsplash.com/photo-1571575173700-afb9492e6a50"
        }
      ]
    },
    {
      "_id": "66ed7c2b2abc0e9f3ea6616693",
      "name": "Spinach",
      "slug": "spinach",
      "category": ["Vegetable"],
      "images": ["https://images.unsplash.com/photo-1576045057995-568f588f82fb"],
      "tags": ["leafy", "iron-rich"],
      "isPublished": true,
      "price": 1000,
      "listPrice": 1200,
      "brand": "Green Leaf",
      "vendor": {
        "id": "65a1b2c3d4e5f6g7h8i9j11",
        "shopId": "Shop8144926197",
        "displayName": "Leafy Greens",
        "logo": "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"
      },
      "avgRating": 4.6,
      "numReviews": 16,
      "stockStatus": "In Stock",
      "description": "Fresh organic spinach packed with iron and essential vitamins for healthy blood and bones.",
      "colors": ["Green"],
      "options": [
        {
          "name": "Bunch",
          "price": 1000,
          "image": "https://images.unsplash.com/photo-1576045057995-568f588f82fb"
        },
        {
          "name": "500g",
          "price": 600,
          "image": "https://images.unsplash.com/photo-1598170845058-32b9d6a5da37"
        }
      ]
    },
    {
      "_id": "66ed7c2b2abc0e9f3ea6616694",
      "name": "Sweet Potato",
      "slug": "sweet-potato",
      "category": ["Tuber"],
      "images": ["https://images.unsplash.com/photo-1596124579923-4ff0425b1dd1"],
      "tags": ["nutritious", "versatile"],
      "isPublished": true,
      "price": 1800,
      "listPrice": 2000,
      "brand": "Root Goodness",
      "vendor": {
        "id": "65a1b2c3d4e5f6g7h8i9j12",
        "shopId": "Shop9144926197",
        "displayName": "Tuber Delights",
        "logo": "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
      },
      "avgRating": 4.7,
      "numReviews": 14,
      "stockStatus": "In Stock",
      "description": "Nutritious sweet potatoes rich in fiber, vitamins, and antioxidants. Perfect for roasting or mashing.",
      "colors": ["Orange"],
      "options": [
        {
          "name": "1kg",
          "price": 1800,
          "image": "https://images.unsplash.com/photo-1596124579923-4ff0425b1dd1"
        },
        {
          "name": "500g",
          "price": 1000,
          "image": "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
        }
      ]
    },
    {
      "_id": "66ed7c2b2abc0e9f3ea6616695",
      "name": "Pineapple",
      "slug": "pineapple",
      "category": ["Fruits"],
      "images": ["https://images.unsplash.com/photo-1550258987-190a2d41a8ba"],
      "tags": ["tropical", "sweet"],
      "isPublished": true,
      "price": 3000,
      "listPrice": 3500,
      "brand": "Tropical Gold",
      "vendor": {
        "id": "65a1b2c3d4e5f6g7h8i9j13",
        "shopId": "Shop10144926197",
        "displayName": "Fruit Paradise",
        "logo": "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
      },
      "avgRating": 4.8,
      "numReviews": 18,
      "stockStatus": "In Stock",
      "description": "Juicy tropical pineapple with perfect balance of sweetness and acidity. Rich in bromelain for digestion.",
      "colors": ["Yellow"],
      "options": [
        {
          "name": "Whole",
          "price": 3000,
          "image": "https://images.unsplash.com/photo-1550258987-190a2d41a8ba"
        },
        {
          "name": "Half",
          "price": 1700,
          "image": "https://images.unsplash.com/photo-1571575173700-afb9492e6a50"
        }
      ]
    },
    {
      "_id": "66ed7c2b2abc0e9f3ea6616696",
      "name": "Cassava",
      "slug": "cassava",
      "category": ["Tuber"],
      "images": ["https://images.unsplash.com/photo-1603569283847-aa295f0d016a"],
      "tags": ["staple", "gluten-free"],
      "isPublished": true,
      "price": 2200,
      "listPrice": 2500,
      "brand": "Root Essentials",
      "vendor": {
        "id": "65a1b2c3d4e5f6g7h8i9j14",
        "shopId": "Shop11144926197",
        "displayName": "Tuber Roots",
        "logo": "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
      },
      "avgRating": 4.5,
      "numReviews": 12,
      "stockStatus": "In Stock",
      "description": "Fresh cassava roots, a gluten-free staple food rich in carbohydrates and essential minerals.",
      "colors": ["Brown"],
      "options": [
        {
          "name": "1kg",
          "price": 2200,
          "image": "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
        },
        {
          "name": "500g",
          "price": 1200,
          "image": "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"
        }
      ]
    },
    {
      _id: "66ed7c2b2abc0e9f3ea6616697",
      name: "Broccoli",
      slug: "broccoli",
      category: ["Vegetables"],
      images: [
        "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"
      ],
      tags: ["fresh-vegetables", "trending"],
      isPublished: true,
      price: 1800,
      listPrice: 2000,
      brand: "Green Valley",
      vendor: {
        id: "65a1b2c3d4e5f6g7h8i9j13",
        shopId: "Shop11144926197",
        displayName: "Tuber Roots",
        logo: "https://images.unsplash.com/photo-1603569283847-aa295f0d016a"
      },
      avgRating: 4.7,
      numReviews: 10,
      stockStatus: "In Stock",
      description: "Fresh broccoli, rich in vitamins and minerals, perfect for steaming or stir-frying.",
      colors: ["Green"],
      options: [
        {
          name: "1kg",
          price: 1800,
          image: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=800&q=80"
        }
      ]
    },
    {
      _id: "66ed7c2b2abc0e9f3ea6616698",
      name: "Cucumber",
      slug: "cucumber",
      category: ["Vegetables"],
      images: [
        "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"
      ],
      tags: ["fresh-vegetables", "trending"],
      isPublished: true,
      price: 900,
      listPrice: 1000,
      brand: "Veggie Delight",
      vendor: {
        id: "65a1b2c3d4e5f6g7h8i9j0x",
        shopId: "Shop4144926197",
        displayName: "Veggie Delight",
        logo: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"
      },
      avgRating: 4.5,
      numReviews: 8,
      stockStatus: "In Stock",
      description: "Crisp and refreshing cucumbers, great for salads and hydration.",
      colors: ["Green"],
      options: [
        {
          name: "1kg",
          price: 900,
          image: "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=800&q=80"
        }
      ]
    },
    {
      _id: "66ed7c2b2abc0e9f3ea6616699",
      name: "Lettuce",
      slug: "lettuce",
      category: ["Vegetables"],
      images: [
        "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=800&q=80"
      ],
      tags: ["fresh-vegetables"],
      isPublished: true,
      price: 700,
      listPrice: 800,
      brand: "Leafy Greens",
      vendor: {
        id: "65a1b2c3d4e5f6g7h8i9j11",
        shopId: "Shop8144926197",
        displayName: "Leafy Greens",
        logo: "https://images.unsplash.com/photo-1601493700631-2b16ec4b4716"
      },
      avgRating: 4.8,
      numReviews: 12,
      stockStatus: "In Stock",
      description: "Fresh lettuce, perfect for salads and sandwiches.",
      colors: ["Green"],
      options: [
        {
          name: "Bunch",
          price: 700,
          image: "https://images.unsplash.com/photo-1502741338009-cac2772e18bc?auto=format&fit=crop&w=800&q=80"
        }
      ]
    }
  
];
export const vendor =   {
  _id: "65a1b2c3d4e5f6g7h8i9j0k",
  shopId: "Shop1103816097",
  displayName: "FarmFresh Produce",
  logo: "https://picsum.photos/200/200?random=1",
  coverImage: "https://picsum.photos/1200/400?random=101",
  description: "Fresh farm produce delivered directly from local farms. We partner with smallholder farmers across Nigeria to bring you the freshest vegetables, fruits and herbs at affordable prices.",
  rating: 4.8,
  numReviews: 24,
  numSales: 1245,
  products: ["66ec2b2abc0e9yrha6616686"],
  isVerified: true,
  joinDate: "2020-05-15T00:00:00Z",
  businessType: "Agricultural Cooperative",
  teamSize: "11-50 employees",
  responseRate: 98,
  responseTime: 2,
  fulfillmentRate: 99,
  positiveReviews: 96,
  returnPolicy: "7-day return policy for damaged goods with proof",
  shippingPolicy: "Free shipping on orders above ₦15,000. Delivery within 2-3 business days in Lagos, 3-5 days nationwide.",
  contact: {
    email: "farmfresh@example.com",
    phone: "+2348012345678",
    address: "123 Farm Road, Surulere, Lagos",
    workingHours: "Mon-Fri: 8am-6pm, Sat: 9am-4pm"
  },
  location: {
    area: "Surulere",
    city: "Lagos",
    coordinates: { lat: 6.4984, lng: 3.3565 }
  },
  socialMedia: {
    facebook: "https://facebook.com/farmfreshng",
    twitter: "https://twitter.com/farmfreshng",
    instagram: "https://instagram.com/farmfreshng"
  },
  categories: ["Vegetables", "Fruits", "Herbs"],
  numProducts: 42,
  numFollowers: 1243
}


export const vendors = [
  {
    _id: "65a1b2c3d4e5f6g7h8i9j0k",
    shopId: "Shop1103816097",
    displayName: "FarmFresh Produce",
    logo: "https://picsum.photos/200/200?random=1",
    coverImage: "https://picsum.photos/1200/400?random=101",
    description: "Fresh farm produce delivered directly from local farms. We partner with smallholder farmers across Nigeria to bring you the freshest vegetables, fruits and herbs at affordable prices.",
    rating: 4.8,
    numReviews: 24,
    numSales: 1245,
    products: ["66ec2b2abc0e9yrha6616686"],
    isVerified: true,
    joinDate: "2020-05-15T00:00:00Z",
    businessType: "Agricultural Cooperative",
    teamSize: "11-50 employees",
    responseRate: 98,
    responseTime: 2,
    fulfillmentRate: 99,
    positiveReviews: 96,
    returnPolicy: "7-day return policy for damaged goods with proof",
    shippingPolicy: "Free shipping on orders above ₦15,000. Delivery within 2-3 business days in Lagos, 3-5 days nationwide.",
    contact: {
      email: "farmfresh@example.com",
      phone: "+2348012345678",
      address: "123 Farm Road, Surulere, Lagos",
      workingHours: "Mon-Fri: 8am-6pm, Sat: 9am-4pm"
    },
    location: {
      area: "Surulere",
      city: "Lagos",
      coordinates: { lat: 6.4984, lng: 3.3565 }
    },
    socialMedia: {
      facebook: "https://facebook.com/farmfreshng",
      twitter: "https://twitter.com/farmfreshng",
      instagram: "https://instagram.com/farmfreshng"
    },
    categories: ["Vegetables", "Fruits", "Herbs"],
    numProducts: 42,
    numFollowers: 1243
  },
  {
    _id: "65a1b2c3d4e5f6g7h8i9j0l",
    shopId: "Shop2204927108",
    displayName: "Riverbite Fisheries",
    logo: "https://picsum.photos/200/200?random=2",
    coverImage: "https://picsum.photos/1200/400?random=102",
    description: "Premium quality smoked fish and seafood products sourced directly from Niger Delta fishermen. We use traditional smoking methods to preserve flavor and nutrients.",
    rating: 4.6,
    numReviews: 18,
    numSales: 876,
    products: ["66ec2b2abc0e9f3ea6616686"],
    isVerified: true,
    joinDate: "2019-11-22T00:00:00Z",
    businessType: "Family Business",
    teamSize: "5-10 employees",
    responseRate: 95,
    responseTime: 4,
    fulfillmentRate: 97,
    positiveReviews: 94,
    returnPolicy: "No returns on perishable items. Damaged goods replaced if reported within 24 hours of delivery.",
    shippingPolicy: "Express shipping available at additional cost. Standard delivery within 3-5 business days.",
    contact: {
      email: "info@riverbite.com",
      phone: "+2348023456789",
      address: "45 Fish Market Road, Lekki Phase 1, Lagos",
      workingHours: "Mon-Sat: 8am-7pm"
    },
    location: {
      area: "Lekki",
      city: "Lagos",
      coordinates: { lat: 6.4474, lng: 3.4735 }
    },
    socialMedia: {
      facebook: "https://facebook.com/riverbitefisheries",
      instagram: "https://instagram.com/riverbitefisheries"
    },
    categories: ["Seafood", "Smoked Fish", "Dried Fish"],
    numProducts: 28,
    numFollowers: 892
  },
  {
    _id: "65a1b2c3d4e5f6g7h8i9j0m",
    shopId: "Shop3306038119",
    displayName: "Orchard Direct",
    logo: "https://picsum.photos/200/200?random=3",
    coverImage: "https://picsum.photos/1200/400?random=103",
    description: "Fresh fruits sourced directly from local orchards across Southwest Nigeria. We specialize in seasonal fruits at peak ripeness for maximum flavor and nutrition.",
    rating: 4.7,
    numReviews: 32,
    numSales: 1567,
    products: ["66ec2b2abgh0e9f3ea6jtk4616686"],
    isVerified: true,
    joinDate: "2021-02-10T00:00:00Z",
    businessType: "Agribusiness",
    teamSize: "20-50 employees",
    responseRate: 99,
    responseTime: 1,
    fulfillmentRate: 98,
    positiveReviews: 97,
    returnPolicy: "10-day satisfaction guarantee. Returns accepted for damaged or spoiled products.",
    shippingPolicy: "Next-day delivery in Ibadan. Nationwide delivery within 2-4 business days.",
    contact: {
      email: "orcharddirect@example.com",
      phone: "+2348034567890",
      address: "7 Fruit Lane, Yaba, Nigeria",
      workingHours: "Mon-Fri: 7am-6pm, Sat: 8am-5pm"
    },
    location: {
      area: "Yaba",
      city: "Lagos",
      coordinates: { lat: 6.3374, lng: 3.4235 }
    },
    socialMedia: {
      facebook: "https://facebook.com/orcharddirectng",
      twitter: "https://twitter.com/orcharddirectng",
      instagram: "https://instagram.com/orcharddirectng",
      whatsapp: "+2348034567890"
    },
    categories: ["Tropical Fruits", "Seasonal Fruits", "Organic Produce"],
    numProducts: 56,
    numFollowers: 2105
  },
  {
    _id: "65a1b2c3d4e5f6g7h8i9j0n",
    shopId: "Shop4407149120",
    displayName: "Tropical Delights",
    logo: "https://picsum.photos/200/200?random=4",
    coverImage: "https://picsum.photos/1200/400?random=104",
    description: "Exotic tropical fruits from the best farms across Nigeria. We specialize in hard-to-find varieties and premium quality fruits for discerning customers.",
    rating: 4.9,
    numReviews: 28,
    numSales: 1342,
    products: ["66ec2b2abgh0e9fhrj33ea6616686"],
    isVerified: true,
    joinDate: "2020-08-05T00:00:00Z",
    businessType: "Agro-Export Company",
    teamSize: "50+ employees",
    responseRate: 97,
    responseTime: 3,
    fulfillmentRate: 99,
    positiveReviews: 98,
    returnPolicy: "14-day return policy for quality issues. Full refund or replacement.",
    shippingPolicy: "Free shipping on orders above ₦20,000. Temperature-controlled shipping available.",
    contact: {
      email: "tropical@example.com",
      phone: "+2348045678901",
      address: "22 Palm Street, Alimosho, Nigeria",
      workingHours: "Mon-Fri: 8am-5pm"
    },
    location: {
      area: "Alimosho",
      city: "Lagos",
      coordinates: { lat: 6.1434, lng: 3.4785 }
    },
    socialMedia: {
      instagram: "https://instagram.com/tropicaldelightsng",
      linkedin: "https://linkedin.com/company/tropicaldelights"
    },
    categories: ["Exotic Fruits", "Premium Produce", "Organic Fruits"],
    numProducts: 38,
    numFollowers: 2876
  },
  {
    _id: "65a1b2c3d4e5f6g7h8i9j0o",
    shopId: "Shop5508260131",
    displayName: "Citrus Valley",
    logo: "https://picsum.photos/200/200?random=5",
    coverImage: "https://picsum.photos/1200/400?random=105",
    description: "Premium citrus fruits from the valley farms of Benue State. Known for our sweet oranges, tangerines and grapefruits with high vitamin C content.",
    rating: 4.5,
    numReviews: 15,
    numSales: 654,
    products: ["66ec2ngjrkb2abgh0e9f3ea6616686"],
    isVerified: true,
    joinDate: "2022-01-18T00:00:00Z",
    businessType: "Farm Cooperative",
    teamSize: "10-20 employees",
    responseRate: 96,
    responseTime: 5,
    fulfillmentRate: 95,
    positiveReviews: 93,
    returnPolicy: "5-day return window for damaged products. Replacement only.",
    shippingPolicy: "Standard shipping nationwide. Delivery within 3-7 business days.",
    contact: {
      email: "citrusvalley@example.com",
      phone: "+2348056789012",
      address: "10 Orange Grove, Ikorodu, Nigeria",
      workingHours: "Mon-Sat: 7:30am-6pm"
    },
    location: {
      area: "Ikorodu",
      city: "Lagos",
      coordinates: { lat: 5.7474, lng: 3.4935 }
    },
    socialMedia: {
      facebook: "https://facebook.com/citrusvalleyng"
    },
    categories: ["Oranges", "Tangerines", "Grapefruits"],
    numProducts: 22,
    numFollowers: 743
  },
  {
    _id: "65a1b2c3d4e5f6g7h8i9j0p",
    shopId: "Shop6609371142",
    displayName: "Summer Harvest",
    logo: "https://picsum.photos/200/200?random=6",
    coverImage: "https://picsum.photos/1200/400?random=106",
    description: "Seasonal fruits and vegetables at their peak freshness. We follow natural growing cycles to deliver produce when it's most flavorful and nutritious.",
    rating: 4.8,
    numReviews: 21,
    numSales: 987,
    products: ["66ec2bbfd2abgh0e9f3ea6616686"],
    isVerified: true,
    joinDate: "2021-06-30T00:00:00Z",
    businessType: "Sustainable Farm",
    teamSize: "15-30 employees",
    responseRate: 99,
    responseTime: 2,
    fulfillmentRate: 98,
    positiveReviews: 97,
    returnPolicy: "Quality guarantee. Full refund if not satisfied with product quality.",
    shippingPolicy: "Free shipping in Abuja for orders above ₦10,000. Nationwide delivery available.",
    contact: {
      email: "summerharvest@example.com",
      phone: "+2348067890123",
      address: "33 Sunshine Avenue, Ikoyi, Nigeria",
      workingHours: "Mon-Fri: 8:30am-5:30pm"
    },
    location: {
      area: "Ikoyi",
      city: "Lagos",
      coordinates: { lat: 6.2674, lng: 3.4835 }
    },
    socialMedia: {
      twitter: "https://twitter.com/summerharvestng",
      instagram: "https://instagram.com/summerharvestng"
    },
    categories: ["Seasonal Vegetables", "Organic Fruits", "Farm Fresh"],
    numProducts: 47,
    numFollowers: 1562
  },
  {
    _id: "65a1b2c3d4e5f6g7h8i9j0q",
    shopId: "Shop7710482153",
    displayName: "Potato King",
    logo: "https://picsum.photos/200/200?random=7",
    coverImage: "https://picsum.photos/1200/400?random=107",
    description: "Specializing in premium quality potatoes from the fertile plains of Jos Plateau. We offer multiple varieties including Irish, sweet and baby potatoes.",
    rating: 4.4,
    numReviews: 19,
    numSales: 765,
    products: ["66ec2b2abgh0e9f3ea6616686"],
    isVerified: true,
    joinDate: "2020-09-14T00:00:00Z",
    businessType: "Specialty Farm",
    teamSize: "5-15 employees",
    responseRate: 94,
    responseTime: 6,
    fulfillmentRate: 96,
    positiveReviews: 92,
    returnPolicy: "Returns accepted within 3 days for damaged goods. Replacement preferred over refund.",
    shippingPolicy: "Bulk discounts available. Shipping costs vary by weight and destination.",
    contact: {
      email: "potatoking@example.com",
      phone: "+2348078901234",
      address: "5 Tuber Road, Magodo, Nigeria",
      workingHours: "Mon-Sat: 7am-7pm"
    },
    location: {
      area: "Magodo",
      city: "Lagos",
      coordinates: { lat: 6.4574, lng: 3.6035 }
    },
    socialMedia: {
      whatsapp: "+2348078901234"
    },
    categories: ["Potatoes", "Root Vegetables", "Farm Fresh"],
    numProducts: 18,
    numFollowers: 832
  },
  {
    _id: "65a1b2c3d4e5f6g7h8i9j0r",
    shopId: "Shop8811593164",
    displayName: "Garlic Masters",
    logo: "https://picsum.photos/200/200?random=8",
    coverImage: "https://picsum.photos/1200/400?random=108",
    description: "Premium quality garlic with maximum health benefits. Grown in the perfect climate of Kano State, our garlic is known for its strong flavor and medicinal properties.",
    rating: 4.7,
    numReviews: 16,
    numSales: 543,
    products: ["66ec2b2abgh0e9no03f3ea6616686"],
    isVerified: true,
    joinDate: "2021-04-22T00:00:00Z",
    businessType: "Specialty Producer",
    teamSize: "8-12 employees",
    responseRate: 98,
    responseTime: 3,
    fulfillmentRate: 97,
    positiveReviews: 96,
    returnPolicy: "Quality guarantee. Replacements for any unsatisfactory products.",
    shippingPolicy: "Flat rate shipping nationwide. Orders processed within 1-2 business days.",
    contact: {
      email: "garlicmasters@example.com",
      phone: "+2348089012345",
      address: "8 Bulb Street, Badagry, Nigeria",
      workingHours: "Mon-Fri: 9am-5pm"
    },
    location: {
      area: "Badagry",
      city: "Lagos",
      coordinates: { lat: 6.4174, lng: 3.6335 }
    },
    socialMedia: {
      facebook: "https://facebook.com/garlicmastersng",
      instagram: "https://instagram.com/garlicmastersng"
    },
    categories: ["Garlic", "Medicinal Plants", "Spices"],
    numProducts: 14,
    numFollowers: 921
  },
  {
    _id: "65a1b2c3d4e5f6g7h8i9j0s",
    shopId: "Shop9922704175",
    displayName: "Ginger Roots",
    logo: "https://picsum.photos/200/200?random=9",
    coverImage: "https://picsum.photos/1200/400?random=109",
    description: "Premium ginger with strong flavor and health benefits. Our ginger is sun-dried naturally to preserve its essential oils and medicinal properties.",
    rating: 4.6,
    numReviews: 14,
    numSales: 432,
    products: ["66ec2b2afdbc0e9f3ea6616686"],
    isVerified: true,
    joinDate: "2022-03-08T00:00:00Z",
    businessType: "Family Farm",
    teamSize: "5-8 employees",
    responseRate: 97,
    responseTime: 4,
    fulfillmentRate: 96,
    positiveReviews: 95,
    returnPolicy: "7-day return policy. Refund or replacement at customer's choice.",
    shippingPolicy: "Free shipping on orders above ₦8,000. Standard shipping available.",
    contact: {
      email: "gingerroots@example.com",
      phone: "+2348090123456",
      address: "12 Spice Lane, Ojo, Nigeria",
      workingHours: "Mon-Sat: 8am-6pm"
    },
    location: {
      area: "Ojo",
      city: "Lagos",
      coordinates: { lat: 6.4174, lng: 3.6335 }
    },
    socialMedia: {
      instagram: "https://instagram.com/gingerrootsng"
    },
    categories: ["Ginger", "Medicinal Roots", "Spices"],
    numProducts: 12,
    numFollowers: 678
  },
  {
    _id: "65a1b2c3d4e5f6g7h8i9j0t",
    shopId: "Shop1033815186",
    displayName: "Spice World",
    logo: "https://picsum.photos/200/200?random=10",
    coverImage: "https://picsum.photos/1200/400?random=110",
    description: "Premium quality spices and condiments sourced directly from farmers across Nigeria. We offer the freshest, most aromatic spices for your kitchen.",
    rating: 4.9,
    numReviews: 27,
    numSales: 1123,
    products: ["66e3267ec2b2abgh0e9f3ea6616686"],
    isVerified: true,
    joinDate: "2019-12-15T00:00:00Z",
    businessType: "Specialty Food Retailer",
    teamSize: "15-25 employees",
    responseRate: 99,
    responseTime: 1,
    fulfillmentRate: 99,
    positiveReviews: 98,
    returnPolicy: "30-day satisfaction guarantee. Full refund if not completely satisfied.",
    shippingPolicy: "Free nationwide shipping on all orders above ₦10,000.",
    contact: {
      email: "spiceworld@example.com",
      phone: "+2348101234567",
      address: "15 Seasoning Avenue, Epe, Nigeria",
      workingHours: "Mon-Fri: 8:30am-5:30pm, Sat: 9am-3pm"
    },
    location: {
      area: "Epe",
      city: "Lagos",
      coordinates: { lat: 6.4774, lng: 3.6045 }
    },
    socialMedia: {
      facebook: "https://facebook.com/spiceworldng",
      twitter: "https://twitter.com/spiceworldng",
      instagram: "https://instagram.com/spiceworldng",
      pinterest: "https://pinterest.com/spiceworldng"
    },
    categories: ["Spices", "Seasonings", "Culinary Herbs"],
    numProducts: 63,
    numFollowers: 3245
  },
  {
    _id: "65a1b2c3d4e5f6g7h8h45j0u",
    shopId: "Shop1144926127",
    displayName: "Herbal Haven",
    logo: "https://picsum.photos/200/200?random=11",
    coverImage: "https://picsum.photos/1200/400?random=111",
    description: "Premium herbal products for health and wellness. We specialize in traditional Nigerian herbs with modern quality control for maximum benefits.",
    rating: 4.8,
    numReviews: 23,
    numSales: 876,
    products: ["66ed7c2b2abc0e9f3ea6616686"],
    isVerified: true,
    joinDate: "2020-07-19T00:00:00Z",
    businessType: "Wellness Company",
    teamSize: "10-15 employees",
    responseRate: 98,
    responseTime: 2,
    fulfillmentRate: 98,
    positiveReviews: 97,
    returnPolicy: "14-day return policy for unopened products. Herbal consultations available.",
    shippingPolicy: "Discreet packaging. Free shipping on wellness packages above ₦25,000.",
    contact: {
      email: "herbalhaven@example.com",
      phone: "+2348112345678",
      address: "20 Leafy Greens, Ojo, Nigeria",
      workingHours: "Mon-Fri: 9am-5pm"
    },
    location: {
      area: "Ojo",
      city: "Lagos",
      coordinates: { lat: 6.4574, lng: 3.6035 }
    },
    socialMedia: {
      facebook: "https://facebook.com/herbalhavenng",
      youtube: "https://youtube.com/herbalhavenng"
    },
    categories: ["Medicinal Herbs", "Wellness Products", "Traditional Remedies"],
    numProducts: 37,
    numFollowers: 1897
  },
  {
    _id: "65a1b2c3d4e5f6g7h8i9j0u",
    shopId: "Shop1144926197",
    displayName: "Herbal Haven",
    logo: "https://picsum.photos/200/200?random=11",
    coverImage: "https://picsum.photos/1200/400?random=111",
    description: "Premium herbal products for health and wellness. We specialize in traditional Nigerian herbs with modern quality control for maximum benefits.",
    rating: 4.8,
    numReviews: 23,
    numSales: 876,
    products: ["66ed7c2b2abc0e9f3ea6616686"],
    isVerified: true,
    joinDate: "2020-07-19T00:00:00Z",
    businessType: "Wellness Company",
    teamSize: "10-15 employees",
    responseRate: 98,
    responseTime: 2,
    fulfillmentRate: 98,
    positiveReviews: 97,
    returnPolicy: "14-day return policy for unopened products. Herbal consultations available.",
    shippingPolicy: "Discreet packaging. Free shipping on wellness packages above ₦25,000.",
    contact: {
      email: "herbalhaven@example.com",
      phone: "+2348112345678",
      address: "20 Leafy Greens, Ojo, Nigeria",
      workingHours: "Mon-Fri: 9am-5pm"
    },
    location: {
      area: "Ojo",
      city: "Lagos",
      coordinates: { lat: 6.4574, lng: 3.6035 }
    },
    socialMedia: {
      facebook: "https://facebook.com/herbalhavenng",
      youtube: "https://youtube.com/herbalhavenng"
    },
    categories: ["Medicinal Herbs", "Wellness Products", "Traditional Remedies"],
    numProducts: 37,
    numFollowers: 1897
  },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0v",
      "shopId": "Shop2144926197",
      "displayName": "Pepper Paradise",
      "logo": "https://picsum.photos/200/200?random=12",
      "coverImage": "https://picsum.photos/1200/400?random=112",
      "description": "Specialists in premium peppers from across Nigeria. We source directly from farms in Ogun, Oyo and Lagos states.",
      "rating": 4.6,
      "numReviews": 18,
      "numSales": 654,
      "products": [
        "66ed7c2b2abc0e9f3ea6616687", // Bell Pepper
        "66ed7c2b2abc0e9f3ea6616691"  // Chili Pepper
      ],
      "isVerified": true,
      "joinDate": "2021-03-15T00:00:00Z",
      "businessType": "Agricultural Produce",
      "teamSize": "5-10 employees",
      "responseRate": 95,
      "responseTime": 4,
      "fulfillmentRate": 96,
      "positiveReviews": 95,
      "returnPolicy": "7-day return policy for damaged products",
      "shippingPolicy": "Free shipping on orders above ₦15,000 within Lagos",
      "contact": {
        "email": "pepperparadise@example.com",
        "phone": "+2348023456789",
        "address": "15 Spicy Lane, Yaba, Lagos",
        "workingHours": "Mon-Sat: 8am-6pm"
      },
      "location": {
        "area": "Yaba",
        "city": "Lagos",
        "coordinates": { "lat": 6.4989, "lng": 3.3819 }
      },
      "socialMedia": {
        "instagram": "https://instagram.com/pepperparadiseng",
        "twitter": "https://twitter.com/pepperparadiseng"
      },
      "categories": ["Peppers", "Farm Produce"],
      "numProducts": 22,
      "numFollowers": 1245
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0w",
      "shopId": "Shop3144926197",
      "displayName": "Fruit Haven",
      "logo": "https://picsum.photos/200/200?random=13",
      "coverImage": "https://picsum.photos/1200/400?random=113",
      "description": "Premium tropical fruits sourced directly from farms across Nigeria. We bring you the freshest seasonal fruits.",
      "rating": 4.7,
      "numReviews": 32,
      "numSales": 1023,
      "products": [
        "66ed7c2b2abc0e9f3ea6616688", // Watermelon
        "66ed7c2b2abc0e9f3ea6616692"  // Mango
      ],
      "isVerified": true,
      "joinDate": "2020-11-22T00:00:00Z",
      "businessType": "Fruit Distributor",
      "teamSize": "8-12 employees",
      "responseRate": 97,
      "responseTime": 3,
      "fulfillmentRate": 97,
      "positiveReviews": 96,
      "returnPolicy": "24-hour return for damaged fruits",
      "shippingPolicy": "Same-day delivery within Surulere",
      "contact": {
        "email": "fruithaven@example.com",
        "phone": "+2348034567890",
        "address": "8 Juicy Road, Surulere, Lagos",
        "workingHours": "Mon-Sun: 7am-8pm"
      },
      "location": {
        "area": "Surulere",
        "city": "Lagos",
        "coordinates": { "lat": 6.4924, "lng": 3.3557 }
      },
      "socialMedia": {
        "facebook": "https://facebook.com/fruithavenng",
        "instagram": "https://instagram.com/fruithavenng"
      },
      "categories": ["Tropical Fruits", "Seasonal Produce"],
      "numProducts": 28,
      "numFollowers": 2156
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0x",
      "shopId": "Shop4144926197",
      "displayName": "Veggie Delight",
      "logo": "https://picsum.photos/200/200?random=14",
      "coverImage": "https://picsum.photos/1200/400?random=114",
      "description": "Organic vegetable specialists providing farm-fresh produce to Lagos households since 2019.",
      "rating": 4.5,
      "numReviews": 27,
      "numSales": 789,
      "products": [
        "66ed7c2b2abc0e9f3ea6616689", // Carrot
        "66ed7c2b2abc0e9f3ea6616693"  // Spinach
      ],
      "isVerified": true,
      "joinDate": "2019-08-10T00:00:00Z",
      "businessType": "Organic Farm",
      "teamSize": "6-8 employees",
      "responseRate": 96,
      "responseTime": 5,
      "fulfillmentRate": 95,
      "positiveReviews": 94,
      "returnPolicy": "No returns on fresh vegetables",
      "shippingPolicy": "Next-day delivery within Lagos",
      "contact": {
        "email": "veggiedelight@example.com",
        "phone": "+2348045678901",
        "address": "12 Green Street, Ikeja, Lagos",
        "workingHours": "Mon-Fri: 9am-5pm"
      },
      "location": {
        "area": "Ikeja",
        "city": "Lagos",
        "coordinates": { "lat": 6.6018, "lng": 3.3515 }
      },
      "socialMedia": {
        "twitter": "https://twitter.com/veggiedelightng",
        "youtube": "https://youtube.com/veggiedelightng"
      },
      "categories": ["Organic Vegetables", "Leafy Greens"],
      "numProducts": 19,
      "numFollowers": 1678
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0y",
      "shopId": "Shop5144926197",
      "displayName": "Tuber World",
      "logo": "https://picsum.photos/200/200?random=15",
      "coverImage": "https://picsum.photos/1200/400?random=115",
      "description": "Your one-stop shop for premium Nigerian tubers. We source directly from farms in Osun, Oyo and Benue states.",
      "rating": 4.4,
      "numReviews": 21,
      "numSales": 567,
      "products": [
        "66ed7c2b2abc0e9f3ea6616690", // Yam
        "66ed7c2b2abc0e9f3ea6616694"  // Sweet Potato
      ],
      "isVerified": true,
      "joinDate": "2021-01-05T00:00:00Z",
      "businessType": "Tuber Distributor",
      "teamSize": "7-10 employees",
      "responseRate": 94,
      "responseTime": 6,
      "fulfillmentRate": 93,
      "positiveReviews": 92,
      "returnPolicy": "3-day return for damaged tubers",
      "shippingPolicy": "Free delivery within Victoria Island on orders above ₦20,000",
      "contact": {
        "email": "tuberworld@example.com",
        "phone": "+2348056789012",
        "address": "5 Root Avenue, Victoria Island, Lagos",
        "workingHours": "Mon-Sat: 8am-7pm"
      },
      "location": {
        "area": "Victoria Island",
        "city": "Lagos",
        "coordinates": { "lat": 6.4281, "lng": 3.4219 }
      },
      "socialMedia": {
        "instagram": "https://instagram.com/tuberworldng",
        "facebook": "https://facebook.com/tuberworldng"
      },
      "categories": ["Yams", "Root Crops"],
      "numProducts": 15,
      "numFollowers": 1432
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j0z",
      "shopId": "Shop6144926197",
      "displayName": "Pepper Heat",
      "logo": "https://picsum.photos/200/200?random=16",
      "coverImage": "https://picsum.photos/1200/400?random=116",
      "description": "Specialists in hot peppers and spices from across West Africa. We bring the heat to your kitchen!",
      "rating": 4.3,
      "numReviews": 19,
      "numSales": 432,
      "products": [
        "66ed7c2b2abc0e9f3ea6616691" // Chili Pepper
      ],
      "isVerified": false,
      "joinDate": "2022-02-18T00:00:00Z",
      "businessType": "Spice Merchant",
      "teamSize": "3-5 employees",
      "responseRate": 93,
      "responseTime": 8,
      "fulfillmentRate": 92,
      "positiveReviews": 91,
      "returnPolicy": "No returns on spicy products",
      "shippingPolicy": "Next-day delivery within Lekki",
      "contact": {
        "email": "pepperheat@example.com",
        "phone": "+2348067890123",
        "address": "7 Hot Corner, Lekki Phase 1, Lagos",
        "workingHours": "Mon-Fri: 10am-6pm"
      },
      "location": {
        "area": "Lekki",
        "city": "Lagos",
        "coordinates": { "lat": 6.4396, "lng": 3.4544 }
      },
      "socialMedia": {
        "twitter": "https://twitter.com/pepperheatng",
        "tiktok": "https://tiktok.com/@pepperheatng"
      },
      "categories": ["Hot Peppers", "Spices"],
      "numProducts": 12,
      "numFollowers": 987
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j10",
      "shopId": "Shop7144926197",
      "displayName": "Fruit Kingdom",
      "logo": "https://picsum.photos/200/200?random=17",
      "coverImage": "https://picsum.photos/1200/400?random=117",
      "description": "Royal treatment for your fruit needs. We supply the freshest seasonal fruits to Lagos homes.",
      "rating": 4.9,
      "numReviews": 45,
      "numSales": 1567,
      "products": [
        "66ed7c2b2abc0e9f3ea6616692", // Mango
        "66ed7c2b2abc0e9f3ea6616695"  // Pineapple
      ],
      "isVerified": true,
      "joinDate": "2020-05-30T00:00:00Z",
      "businessType": "Fruit Distributor",
      "teamSize": "12-15 employees",
      "responseRate": 98,
      "responseTime": 2,
      "fulfillmentRate": 98,
      "positiveReviews": 97,
      "returnPolicy": "12-hour return for damaged fruits",
      "shippingPolicy": "Same-day delivery within Ajah",
      "contact": {
        "email": "fruitkingdom@example.com",
        "phone": "+2348078901234",
        "address": "22 Orchard Road, Ajah, Lagos",
        "workingHours": "Mon-Sun: 7am-9pm"
      },
      "location": {
        "area": "Ajah",
        "city": "Lagos",
        "coordinates": { "lat": 6.4698, "lng": 3.5852 }
      },
      "socialMedia": {
        "instagram": "https://instagram.com/fruitkingdomng",
        "facebook": "https://facebook.com/fruitkingdomng",
        "youtube": "https://youtube.com/fruitkingdomng"
      },
      "categories": ["Tropical Fruits", "Seasonal Produce"],
      "numProducts": 31,
      "numFollowers": 2876
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j11",
      "shopId": "Shop8144926197",
      "displayName": "Leafy Greens",
      "logo": "https://picsum.photos/200/200?random=18",
      "coverImage": "https://picsum.photos/1200/400?random=118",
      "description": "Specialists in fresh, organic leafy vegetables grown with sustainable farming practices.",
      "rating": 4.6,
      "numReviews": 24,
      "numSales": 678,
      "products": [
        "66ed7c2b2abc0e9f3ea6616693" // Spinach
      ],
      "isVerified": true,
      "joinDate": "2021-07-14T00:00:00Z",
      "businessType": "Organic Farm",
      "teamSize": "5-7 employees",
      "responseRate": 96,
      "responseTime": 4,
      "fulfillmentRate": 95,
      "positiveReviews": 94,
      "returnPolicy": "No returns on fresh greens",
      "shippingPolicy": "Next-day delivery within Mainland Lagos",
      "contact": {
        "email": "leafygreens@example.com",
        "phone": "+2348089012345",
        "address": "14 Garden Close, Maryland, Lagos",
        "workingHours": "Mon-Fri: 8am-5pm"
      },
      "location": {
        "area": "Maryland",
        "city": "Lagos",
        "coordinates": { "lat": 6.5627, "lng": 3.3578 }
      },
      "socialMedia": {
        "twitter": "https://twitter.com/leafygreensng",
        "instagram": "https://instagram.com/leafygreensng"
      },
      "categories": ["Leafy Vegetables", "Organic Produce"],
      "numProducts": 17,
      "numFollowers": 1543
    },
    {
      "_id": "65a1b2c3d4e5f6g7h8i9j12",
      "shopId": "Shop9144926197",
      "displayName": "Tuber Delights",
      "logo": "https://picsum.photos/200/200?random=19",
      "coverImage": "https://picsum.photos/1200/400?random=119",
      "description": "Your trusted source for quality tubers and root vegetables. We deliver farm-fresh products across Lagos.",
      "rating": 4.7,
      "numReviews": 29,
      "numSales": 732,
      "products": [
        "66ed7c2b2abc0e9f3ea6616694", // Sweet Potato
        "66ed7c2b2abc0e9f3ea6616696"  // Cassava
      ],
      "isVerified": true,
      "joinDate": "2020-09-25T00:00:00Z",
      "businessType": "Tuber Distributor",
      "teamSize": "8-10 employees",
      "responseRate": 97,
      "responseTime": 3,
      "fulfillmentRate": 96,
      "positiveReviews": 95,
      "returnPolicy": "2-day return for damaged products",
      "shippingPolicy": "Free delivery within Apapa on orders above ₦18,000",
      "contact": {
        "email": "tuberdelights@example.com",
        "phone": "+2348090123456",
        "address": "9 Root Street, Apapa, Lagos",
        "workingHours": "Mon-Sat: 8am-6pm"
      },
      "location": {
        "area": "Apapa",
        "city": "Lagos",
        "coordinates": { "lat": 6.4489, "lng": 3.3597 }
      },
      "socialMedia": {
        "facebook": "https://facebook.com/tuberdelightsng",
        "instagram": "https://instagram.com/tuberdelightsng"
      },
      "categories": ["Root Vegetables", "Staple Foods"],
      "numProducts": 21,
      "numFollowers": 1876
    }
  
];

export const categories = [
    {
      "thumbnail": {
        "url": "https://res.cloudinary.com/ahisi/image/upload/v1734976806/ahisi/1734976793066_fruit.png",
        "public_id": "ahisi/1734976793066_fruit"
      },
      "_id": "6769a527015abc57a03ec870",
      "title": "Fruits",
      "description": "Fruits",
      "keynotes": ["Fruits"],
      "tags": ["fruits"],
      "createdAt": "2024-12-23T18:00:07.504Z",
      "updatedAt": "2025-03-11T10:43:03.352Z",
      "__v": 0
    },
    {
      "thumbnail": {
        "url": "https://res.cloudinary.com/ahisi/image/upload/v1734977737/ahisi/1734977735158_tubers.png",
        "public_id": "ahisi/1734977735158_tubers"
      },
      "_id": "6769a8ca015abc57a03ec8a5",
      "title": "Tubers",
      "description": "Tubers",
      "keynotes": ["Tubers"],
      "tags": ["tubers"],
      "createdAt": "2024-12-23T18:15:38.180Z",
      "updatedAt": "2024-12-23T18:15:38.180Z",
      "__v": 0
    },
    {
      "thumbnail": {
        "url": "https://res.cloudinary.com/ahisi/image/upload/v1734977790/ahisi/1734977785892_vegetable-oil.png",
        "public_id": "ahisi/1734977785892_vegetable-oil"
      },
      "_id": "6769a8fe015abc57a03ec8a9",
      "title": "Oil & Sauces",
      "description": "Oil & Sauces",
      "keynotes": ["Oil & Sauces"],
      "tags": ["oil-& sauces"],
      "createdAt": "2024-12-23T18:16:30.950Z",
      "updatedAt": "2025-03-03T16:18:11.402Z",
      "__v": 0
    },
    {
      "thumbnail": {
        "url": "https://res.cloudinary.com/ahisi/image/upload/v1734977840/ahisi/1734977836137_spices.png",
        "public_id": "ahisi/1734977836137_spices"
      },
      "_id": "6769a931015abc57a03ec8ad",
      "title": "Spices & Condiments",
      "description": "Spices & Condiments",
      "keynotes": ["Spices & Condiments"],
      "tags": ["spices-& condiments"],
      "createdAt": "2024-12-23T18:17:21.435Z",
      "updatedAt": "2024-12-23T18:17:21.435Z",
      "__v": 0
    },
    {
      "thumbnail": {
        "url": "https://res.cloudinary.com/ahisi/image/upload/v1734977873/ahisi/1734977869118_vegetables.png",
        "public_id": "ahisi/1734977869118_vegetables"
      },
      "_id": "6769a952015abc57a03ec8b1",
      "title": "Vegetables",
      "description": "Vegetables",
      "keynotes": ["Vegetables"],
      "tags": ["vegetables"],
      "createdAt": "2024-12-23T18:17:54.600Z",
      "updatedAt": "2025-02-11T14:30:21.900Z",
      "__v": 0
    },
    {
      "thumbnail": {
        "url": "https://res.cloudinary.com/ahisi/image/upload/v1734977912/ahisi/1734977907653_general.png",
        "public_id": "ahisi/1734977907653_general"
      },
      "_id": "6769a979015abc57a03ec8b5",
      "title": "General",
      "description": "General",
      "keynotes": ["General"],
      "tags": ["general"],
      "createdAt": "2024-12-23T18:18:33.603Z",
      "updatedAt": "2025-03-03T16:07:49.242Z",
      "__v": 0
    },
    {
      "thumbnail": {
        "url": "https://res.cloudinary.com/ahisi/image/upload/v1741007109/Seedspike_1_bs13fo.png",
        "public_id": "ahisi/1734977907653_general"
      },
      "_id": "67c57837f10910b0c27eed7c",
      "title": "Ramadan Special",
      "description": "Ramadan Special",
      "keynotes": ["General"],
      "tags": ["general"],
      "createdAt": "2024-12-23T18:18:33.603Z",
      "updatedAt": "2025-03-05T13:53:54.840Z",
      "__v": 0
    }
  ]