// app/upload/page.tsx
"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import UploadExcel from "@/app/(dashboard)/admin/upload/upload";

interface Option {
  name: string;
  price: number;
}

interface Product {
  name: string;
  price: number;
  options: Option[];
}

export default function Page() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products/update");
      const data = await res.json();
      setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 py-12">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-green-800">
            FeedMe Price Updater
          </h1>
          <p className="text-green-600 mt-2">Upload → See live below</p>
        </div>

        {/* UPLOAD BOX */}
        <UploadExcel
          onSuccess={(total) => {
            setUploadSuccess(true);
            setTimeout(() => setUploadSuccess(false), 3000);
            fetchProducts();
          }}
        />

        {/* SUCCESS BANNER */}
        {uploadSuccess && (
          <div className="mt-6 p-4 bg-green-100 rounded-xl border border-green-300 text-center animate-pulse">
            <p className="text-green-800 font-semibold">
              Success! Products updated.
            </p>
          </div>
        )}

        {/* TABLE */}
        <div className="mt-10 bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="p-4 bg-green-100 flex justify-between items-center">
            <h2 className="text-lg font-bold text-green-800">
              Live Products ({products.length})
            </h2>
            <button
              onClick={fetchProducts}
              className="text-green-700 hover:text-green-900 flex items-center gap-1 text-sm font-medium">
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              Refresh
            </button>
          </div>

          {loading ? (
            <div className="p-12 text-center text-gray-500">Loading...</div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              No products. Upload an Excel file.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-3 text-left text-sm font-bold text-green-800">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-green-800">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-green-800">
                      Options
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p, i) => (
                    <tr key={i} className="hover:bg-green-50">
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {p.name}
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        ₦{p.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex flex-wrap gap-1">
                          {p.options.map((opt, j) => (
                            <span
                              key={j}
                              className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              {opt.name}: ₦{opt.price.toLocaleString()}
                            </span>
                          ))}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="text-center text-gray-500 mt-6 text-sm">
          Table updates after upload.
        </p>
      </div>
    </div>
  );
}
