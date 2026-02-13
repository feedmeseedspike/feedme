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
import { Skeleton } from "@components/ui/skeleton";
import { toSlug, cn } from "@/lib/utils";

const SearchFilter = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<
    { id: string; slug: string; name: string; image?: string | null }[]
  >([]);
  const [categories, setCategories] = useState<
    { id: string; title: string, thumbnail?: any }[]
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
  const SList: any = List;

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
          setCategories([]);
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
          setCategories(data.categories || []);
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

  const handleCategoryClick = useCallback(
    (category: { id: string; title: string }) => {
      setIsOpen(false);
      setSearchTerm("");
      const slug = toSlug(category.title);
      router.push(`/category/${slug}`);
    },
    [router]
  );

  const SearchResultItem = useCallback(
    ({ index, style }: { index: number; style: React.CSSProperties }) => {
      const product = products[index];
      return (
        <div
          style={style}
          onClick={() => handleProductClick(product)}
          className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer group transition-colors"
        >
          {product.image ? (
            <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
              <Image
                src={product.image}
                alt={product.name}
                fill
                className="object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          ) : (
            <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-400 font-bold text-xs">
              {product.name.charAt(0)}
            </div>
          )}
          <span className="truncate flex-1 font-semibold text-sm text-gray-700">{product.name}</span>
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
        <div className="absolute z-50 w-full mt-2 bg-white border rounded-xl shadow-2xl max-h-[550px] overflow-hidden flex flex-col">
          {isLoading ? (
            <div className="p-3 space-y-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-2">
                  <Skeleton className="w-10 h-10 rounded-lg flex-shrink-0" />
                  <Skeleton className="h-4 w-full rounded" />
                </div>
              ))}
            </div>
          ) : products.length > 0 || categories.length > 0 ? (
            <div className="flex flex-col overflow-y-auto py-2 custom-scrollbar">
              {categories.length > 0 && (
                <div className={cn("pb-2 mb-2", products.length > 0 && "border-b")}>
                  <div className="space-y-1">
                    {categories.map((cat) => (
                      <div
                        key={cat.id}
                        onClick={() => handleCategoryClick(cat)}
                        className="flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50 cursor-pointer group transition-colors"
                      >
                        {cat.thumbnail?.url ? (
                          <div className="relative w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
                            <Image
                              src={cat.thumbnail.url}
                              alt={cat.title}
                              fill
                              className="object-cover group-hover:scale-110 transition-transform duration-300"
                            />
                          </div>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-green-50 flex items-center justify-center flex-shrink-0 text-green-700 font-bold text-sm">
                            {cat.title.charAt(0)}
                          </div>
                        )}
                        <span className="font-bold text-base text-gray-800">{cat.title}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {products.length > 0 && (
                <div className="flex-1">
                  <SList
                    height={Math.min(products.length * 56, 400)}
                    itemCount={products.length}
                    itemSize={56}
                    width="100%"
                    className="custom-scrollbar"
                  >
                    {SearchResultItem}
                  </SList>
                </div>
              )}
              
            </div>
          ) : (
            <div className="p-8 text-center flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center mb-1">
                <SearchX className="w-6 h-6 text-gray-300" />
              </div>
              <p className="text-gray-500 font-medium">No results found for &quot;{searchTerm}&quot;</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(SearchFilter);
