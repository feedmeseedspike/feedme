// types/category.ts
export type Product = {
  thumbnail: {
    url: string;
    public_id: string;
  };
  variations: {
    colors: string[];
    sizes: string[];
  };
};

export type Category = {
  thumbnail: {
    url: string;
    public_id: string;
  };
  _id: string;
  title: string;
  description: string;
  keynotes: string[];
  tags: string[];
  products: Product[];
};

export type CategoryResponse = {
  acknowledgement: boolean;
  message: string;
  description: string;
  data: Category[];
};
