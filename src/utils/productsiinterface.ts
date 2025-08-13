export interface ProductOptionInterface {
  name: string;
  image: string;
  price: number;
  stockStatus: string;
}

export interface ProductInterface {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  list_price: number;
  brand: string | null;
  avg_rating: number;
  num_reviews: number;
  num_sales: number;
  count_in_stock: number | null;
  stock_status: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  vendor_id: string | null;
  category_ids: string[];
  tags: string[];
  images: string[];
  options: ProductOptionInterface[];
  rating_distribution: Record<string, any>; // Empty object in JSON, using Record for flexibility
  in_season: boolean | null;
}