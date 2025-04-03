"use client";

import React, { useEffect, useState, useRef, useMemo } from "react";
import { Search, SearchX } from "lucide-react"; 
import Filter from "@components/icons/filter.svg";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { getAllProducts } from "../../../lib/actions/product.actions";
import { toast } from "sonner";
import { debounce } from "lodash";
import { IProductInput } from "src/types";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "../../ui/popover";


const SearchFilter = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [isOpen, setIsOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [products, setProducts] = useState<IProductInput[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const searchRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {

        const response = await getAllProducts({ query: "", page: 1, limit: 50 });
        setProducts(response.products);
        
        // Extract unique categories from products
        const uniqueCategories = Array.from(
          new Set(response.products.flatMap(product => 
            Array.isArray(product.category) ? product.category : [product.category]
          ))
        );
        setCategories(uniqueCategories);
      } catch (error) {
        toast.error("Failed to fetch products");
      }
    };

    fetchProducts();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Debounced search function
  const debouncedSearch = useMemo(
    () =>
      debounce((value: string) => {
        setSearchTerm(value.toLowerCase());
        setIsOpen(!!value);
      }, 300), 
    []
  );

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };





  const filteredProducts = useMemo(() => {
    return products.filter(product => {
      const nameMatch = product.name.toLowerCase().includes(searchTerm);
      const categoryMatch = selectedCategory === "all" || 
        (Array.isArray(product.category) 
          ? product.category.includes(selectedCategory)
          : product.category === selectedCategory);
      
      return nameMatch && categoryMatch;
    });
  }, [searchTerm, selectedCategory, products]);








  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm) {
      const url = getFilterUrl({
        category: selectedCategory !== "all" ? selectedCategory : undefined,
        params: { q: searchTerm }
      });
      router.push(url);
      setIsOpen(false);
      setIsFilterOpen(false);
    }
  };

  // Helper function to generate filter URL based on the utils.ts implementation
  const getFilterUrl = ({
    category,
    params,
  }: {
    category?: string;
    params: any;
  }) => {
    const { q = "all" } = params;
    
    // Create a new URLSearchParams object
    const searchParams = new URLSearchParams();
    
    // For category pages
    if (category && category !== "all") {
      const categorySlug = category.toLowerCase().replace(/ /g, "-");
      searchParams.set("category", categorySlug);
    }
    
    // For search term
    if (q && q !== "all") searchParams.set("q", q);
    
    return `/search?${searchParams.toString()}`;
  };

  return (

    <form onSubmit={handleSubmit} className="relative w-full" ref={searchRef}>
      <span className="absolute inset-y-0 left-3 flex items-center">
        <Search className="text-gray-500 w-5 h-5" />
      </span>



      
      <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
        <PopoverTrigger asChild>
          <span className="absolute inset-y-0 right-3 flex items-center">
            <Filter className="text-gray-500 w-5 h-5 cursor-pointer" />
          </span>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-4">
          <div className="space-y-4">
            <h3 className="font-medium">Filter Options</h3>
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select 
                value={selectedCategory} 
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      
      <input
        name="q"
        type="search"
        autoComplete="off"
        spellCheck="false"
        aria-autocomplete="none"

        className="w-full py-2 pl-10 pr-10 text-gray-700 bg-white border rounded-md"
        placeholder="Search for products..."
        onChange={handleSearch}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && searchTerm && (
        <div className="absolute top-full left-0 w-full bg-white mt-2 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {filteredProducts.length > 0 ? (











            <>
              {selectedCategory !== "all" && (
                <div className="p-2 bg-gray-100 text-sm">
                  Filtering by: <span className="font-medium">{selectedCategory}</span>
                </div>
              )}
              {filteredProducts.map((product) => (
                <div
                  key={product._id}
                  className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                  onClick={() => {
                    router.push(`/product/${product.slug}`);
                    setIsOpen(false);
                  }}
                >
                  <Image src={product.images[0]} alt={product.name} width={40} height={40} className="rounded object-cover" />
                  <div className="flex flex-col">
                    <span>{product.name}</span>
                    <span className="text-xs text-gray-500">
                      {Array.isArray(product.category) 
                        ? product.category.join(', ') 
                        : product.category}
                    </span>
                  </div>
                </div>
              ))}
              <div className="p-2 border-t text-center">
                <button 
                  type="submit" 
                  className="text-blue-600 hover:underline"
                >
                  See all results for &quot;{searchTerm}&quot;
                </button>
              </div>

            </>
          ) : (
            <div className="flex items-center gap-2 p-4 text-center text-gray-500">
              <SearchX className="w-5 h-5" />
              No products found
            </div>
          )}
        </div>
      )}
    </form>
  );
};

export default SearchFilter;
