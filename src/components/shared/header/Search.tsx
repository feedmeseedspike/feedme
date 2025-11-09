"use client";

import React, {
  useEffect,
  useState,
  useRef,
  useMemo,
  useCallback,
  FormEvent,
} from "react";
import { Search, SearchX } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { debounce } from "lodash";
import { FixedSizeList as List } from "react-window";
import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";

const SearchFilter = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<
    { id: string; slug: string; name: string; image?: string | null }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const placeholders = [
    "Search for products...",
    "Find your favorite items...",
    "What are you looking for?",
    "Discover amazing products...",
  ];
  const SList:any = List

  // Placeholder animation logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [placeholders.length]);

  // Debounced fetch to API
  const fetchProducts = useMemo(
    () =>
      debounce(async (query: string) => {
        if (!query) {
          setProducts([]);
          setIsOpen(false);
          setIsLoading(false);
          return;
        }
        setIsLoading(true);
        try {
          const res = await fetch(
            `/api/products/search?query=${encodeURIComponent(query)}`
          );
          const data = await res.json();
          setProducts(data.products || []);
          setIsOpen(true);
        } catch (error) {
          toast.error("Failed to fetch products");
        } finally {
          setIsLoading(false);
        }
      }, 300),
    []
  );

  const handleSearch = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSearchTerm(value);
      fetchProducts(value);
    },
    [fetchProducts]
  );

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

  const handleProductClick = useCallback(
    (product: { slug: string; name: string }) => {
      setIsOpen(false);
      setSearchTerm("");
      router.push(`/product/${product.slug}`);
    },
    [router]
  );

  const handleSearchSubmit = useCallback(
    (event: FormEvent) => {
      event.preventDefault();
      if (searchTerm) {
        router.push(`/search?q=${encodeURIComponent(searchTerm)}`);
        setIsOpen(false);
      }
    },
    [router, searchTerm]
  );

  const SearchResultItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const product = products[index];
      return (
        <div
          style={style}
          onClick={() => handleProductClick(product)}
          className="flex items-center gap-3 px-2 py-1 hover:bg-gray-100 cursor-pointer"
        >
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              width={36}
              height={36}
              className="rounded object-cover bg-gray-100"
            />
          ) : (
            <div className="w-9 h-9 rounded bg-gray-200 flex-shrink-0" />
          )}
          <span className="truncate">{product.name}</span>
        </div>
      );
    },
    [products, handleProductClick]
  );

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative">
        <form
          onSubmit={handleSearchSubmit}
          className="relative w-full mx-auto bg-white h-10 rounded-full md:rounded-lg overflow-hidden shadow-[0px_2px_3px_-1px_rgba(0,0,0,0.1),_0px_1px_0px_0px_rgba(25,28,33,0.02),_0px_0px_0px_1px_rgba(25,28,33,0.08)] transition duration-200"
        >
          <input
            type="text"
            value={searchTerm}
            onChange={handleSearch}
            className="w-full relative z-50 border-none bg-transparent text-black h-full rounded-full focus:outline-none focus:ring-0 pl-12 pr-4"
          />
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <div className="absolute inset-0 flex items-center rounded-full pointer-events-none">
            <AnimatePresence mode="wait">
              {!searchTerm && (
                <motion.p
                  initial={{ y: 5, opacity: 0 }}
                  key={`current-placeholder-${currentPlaceholder}`}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -15, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "linear" }}
                  className="text-sm font-normal text-neutral-500 pl-12 text-left w-[calc(100%-2rem)] truncate"
                >
                  {placeholders[currentPlaceholder]}
                </motion.p>
              )}
            </AnimatePresence>
          </div>
        </form>
      </div>
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border rounded-lg shadow-lg max-h-[400px] overflow-hidden">
          {isLoading ? (
            <div className="p-4 text-center">Loading...</div>
          ) : products.length > 0 ? (
            <SList
              height={Math.min(products.length * 48, 400)}
              itemCount={products.length}
              itemSize={48}
              width="100%"
            >
              {SearchResultItem}
            </SList>
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
