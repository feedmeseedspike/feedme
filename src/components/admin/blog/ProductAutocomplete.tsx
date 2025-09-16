"use client";

import { useState, useEffect, useRef } from "react";
import { Search, Package, Layers, Tag, X } from "lucide-react";

interface ProductResult {
  id: string;
  name: string;
  slug: string;
  type: "product" | "bundle" | "offer";
  image: string | null;
  price?: number;
  description?: string;
}

interface ProductAutocompleteProps {
  onSelect: (slug: string, name: string, customText?: string) => void;
  onClose: () => void;
  position: { top: number; left: number };
  initialQuery?: string;
}

const getTypeIcon = (type: string) => {
  switch (type) {
    case "product":
      return <Package size={16} className="text-blue-600" />;
    case "bundle":
      return <Layers size={16} className="text-green-600" />;
    case "offer":
      return <Tag size={16} className="text-orange-600" />;
    default:
      return <Package size={16} className="text-gray-600" />;
  }
};

const getTypeColor = (type: string) => {
  switch (type) {
    case "product":
      return "bg-blue-50 text-blue-700";
    case "bundle":
      return "bg-green-50 text-green-700";
    case "offer":
      return "bg-orange-50 text-orange-700";
    default:
      return "bg-gray-50 text-gray-700";
  }
};

export default function ProductAutocomplete({
  onSelect,
  onClose,
  position,
  initialQuery = "",
}: ProductAutocompleteProps) {
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<ProductResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState<ProductResult | null>(
    null
  );
  const [customText, setCustomText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const customTextRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const searchProducts = async () => {
      // Allow empty queries to show recent/popular products
      if (query.length < 2 && query.length > 0) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await fetch(
          `/api/admin/products/search?q=${encodeURIComponent(query)}&limit=8`
        );
        const data = await response.json();

        if (data.success) {
          setResults(data.results);
          setSelectedIndex(0);
        } else {
          setResults([]);
        }
      } catch (error) {
        setResults([]);
      } finally {
        setLoading(false);
      }
    };

    const debounceTimer = setTimeout(searchProducts, 300);
    return () => clearTimeout(debounceTimer);
  }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) => Math.min(prev + 1, results.length - 1));
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => Math.max(prev - 1, 0));
        break;
      case "Enter":
        e.preventDefault();
        if (results[selectedIndex]) {
          handleSelect(results[selectedIndex]);
        }
        break;
      case "Escape":
        e.preventDefault();
        onClose();
        break;
    }
  };

  const handleSelect = (product: ProductResult, customText?: string) => {
    onSelect(product.slug, product.name, customText);
    onClose();
  };

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      className="fixed z-[9999] bg-white border border-gray-200 rounded-lg shadow-xl min-w-96 max-w-md"
      style={{
        top: position.top,
        left: position.left,
        maxHeight: "400px",
        zIndex: 9999,
      }}
    >
      {/* Header */}
      <div className="flex items-center gap-2 p-3 border-b border-gray-100 bg-gray-50 rounded-t-lg">
        <Search size={16} className="text-gray-500" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Search products, bundles, offers..."
          className="flex-1 text-sm bg-transparent border-none outline-none placeholder-gray-500"
        />
        <button
          onClick={onClose}
          className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={14} />
        </button>
      </div>

      {/* Results */}
      <div className="max-h-80 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center text-gray-500 text-sm">
            Searching...
          </div>
        )}

        {!loading && query.length >= 2 && results.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            No products found for &quot;{query}&quot;
          </div>
        )}

        {!loading && query.length >= 1 && query.length < 2 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            Type at least 2 characters to search
          </div>
        )}

        {!loading && query.length === 0 && results.length === 0 && (
          <div className="p-4 text-center text-gray-500 text-sm">
            Recent products will appear here
          </div>
        )}

        {!loading &&
          results.map((product, index) => (
            <div
              key={product.id}
              onClick={() => {
                if (selectedProduct?.id === product.id) {
                  // If clicking the same product, finalize selection
                  handleSelect(product, customText);
                } else {
                  // Select this product for customization
                  setSelectedProduct(product);
                  setCustomText("");
                  setTimeout(() => customTextRef.current?.focus(), 100);
                }
              }}
              className={`flex items-center gap-3 p-3 cursor-pointer transition-colors ${
                index === selectedIndex || selectedProduct?.id === product.id
                  ? "bg-blue-50 border-l-2 border-blue-500"
                  : "hover:bg-gray-50"
              }`}
            >
              {/* Product Image */}
              <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  getTypeIcon(product.type)
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="text-sm font-medium text-gray-900 truncate">
                    {product.name}
                  </h4>
                  <span
                    className={`px-2 py-0.5 text-xs font-medium rounded-full ${getTypeColor(product.type)}`}
                  >
                    {product.type}
                  </span>
                </div>

                <p className="text-xs text-gray-500 truncate">
                  {product.description}
                </p>

                <p className="text-xs text-gray-400 mt-1 font-mono">
                  [[{product.slug}]]
                </p>
              </div>
            </div>
          ))}
      </div>

      {/* Custom Text Input */}
      {selectedProduct && (
        <div className="border-t border-gray-100 bg-blue-50 p-3">
          <div className="mb-2">
            <p className="text-xs font-medium text-blue-800">
              Selected: {selectedProduct.name}
            </p>
            <p className="text-xs text-blue-600">
              Enter custom display text (optional):
            </p>
          </div>
          <div className="flex gap-2">
            <input
              ref={customTextRef}
              type="text"
              value={customText}
              onChange={(e) => setCustomText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSelect(selectedProduct, customText);
                } else if (e.key === "Escape") {
                  setSelectedProduct(null);
                  setCustomText("");
                  inputRef.current?.focus();
                }
              }}
              placeholder="e.g., 'garri' instead of full name"
              className="flex-1 px-2 py-1 text-sm border border-blue-200 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={() => handleSelect(selectedProduct, customText)}
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Insert
            </button>
          </div>
          <p className="text-xs text-blue-600 mt-1">
            Will insert: [[{selectedProduct.slug}
            {customText ? `|${customText}` : ""}]]
          </p>
        </div>
      )}

      {/* Footer */}
      {results.length > 0 && !selectedProduct && (
        <div className="p-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
          <p className="text-xs text-gray-500 text-center">
            Click a product to customize display text, or use ↑↓ to navigate,
            Enter to select
          </p>
        </div>
      )}
    </div>
  );
}
