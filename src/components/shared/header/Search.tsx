"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
} from "react";
import { Search, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { getAllProducts } from "../../../lib/actions/product.actions";
import { toast } from "sonner";
import { debounce } from "lodash";
import { IProductInput } from "src/types";
import { FixedSizeList as List } from "react-window";

const SearchFilter = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<IProductInput[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const fetchProducts = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await getAllProducts({
        query: "",
        page: 1,
        limit: 50,
      });
      setProducts(response.products);
    } catch (error) {
      toast.error("Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchTerm(value.toLowerCase());
        setIsOpen(!!value);
      }, 300),
    []
  );

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      debouncedSearch(event.target.value);
    },
    [debouncedSearch]
  );

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return [];
    return products.filter((product) =>
      product.name.toLowerCase().includes(searchTerm)
    );
  }, [products, searchTerm]);

  const handleProductClick = useCallback(
    (product: IProductInput) => {
      router.push(`/product/${product.slug}`);
      setIsOpen(false);
      setSearchTerm("");
    },
    [router]
  );

  const SearchResultItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const product = filteredProducts[index];
      return (
        <div
          style={style}
          onClick={() => handleProductClick(product)}
          className="px-2 py-1 hover:bg-gray-100 cursor-pointer"
        >
          {product.name}
        </div>
      );
    },
    [filteredProducts, handleProductClick]
  );

  return (
    <div ref={searchRef} className="relative w-full max-w-[600p">
      <div className="relative">
        <input
          type="text"
          placeholder="Search products..."
          value={searchTerm}
          onChange={handleSearch}
          className="w-full px-4 py-2 pl-10 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
        />
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
      </div>

      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-[400px] overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : filteredProducts.length > 0 ? (
            <List
              height={Math.min(filteredProducts.length * 40, 400)}
              itemCount={filteredProducts.length}
              itemSize={40}
              width="100%"
            >
              {SearchResultItem}
            </List>
          ) : (
            <div className="p-4 text-center text-gray-500">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchFilter);
