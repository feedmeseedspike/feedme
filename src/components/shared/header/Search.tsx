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


const SearchFilter = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [products, setProducts] = useState<IProductInput[]>([]);
  const searchRef = useRef<HTMLFormElement | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = getAllProducts({ query: "", page: 1, limit: 50 });
        setProducts(response.products);
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

  const filteredProducts = useMemo(
    () => products.filter(({ name }) => name.toLowerCase().includes(searchTerm)),
    [searchTerm, products]
  );

  // const handleSearchClick = () => {
  //   if (searchTerm && filteredProducts.length) {
  //     const matchingProduct = filteredProducts[0];
  //     router.push(`/search?q=${product.name.replace(/ /g, "-").toLowerCase()}`)
  //     setIsOpen(false);
  //   }
  // };

  return (
    <form action="/search" method="GET" className="relative w-full" ref={searchRef}>
      <span className="absolute inset-y-0 left-3 flex items-center">
        <Search className="text-gray-500 w-5 h-5" />
      </span>
      <span className="absolute inset-y-0 right-3 flex items-center">
        <Filter className="text-gray-500 w-5 h-5 cursor-pointer" />
      </span>
      <input
        name="q"
        type="search"
        className="w-full py-2 pl-10 pr-4 text-gray-700 bg-white border rounded-md focus:border-blue-400 focus:outline-none focus:ring focus:ring-opacity-40 focus:ring-blue-300"
        placeholder="Search for products..."
        onChange={handleSearch}
        onFocus={() => setIsOpen(true)}
      />

      {isOpen && searchTerm && (
        <div className="absolute top-full left-0 w-full bg-white mt-2 rounded-lg shadow-lg max-h-96 overflow-y-auto z-50">
          {filteredProducts.length > 0 ? (
            filteredProducts.map((product) => (
              <div
                key={product._id}
                className="p-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                onClick={() => {
                  router.push(`/search?q=${product.name.replace(/ /g, "-").toLowerCase()}`);
                  setIsOpen(false);
                }}
              >
                <Image src={product.images[0]} alt={product.name} width={40} height={40} className="rounded object-cover" />
                <span>{product.name}</span>
              </div>
            ))
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
