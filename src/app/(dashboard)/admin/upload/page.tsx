// app/upload/page.tsx
"use client";

import { useState, useEffect } from "react";
import { RefreshCw } from "lucide-react";
import UploadExcel from "@/app/(dashboard)/admin/upload/upload";
import Image from "next/image";

interface Option {
  name: string;
  price: number;
}

interface Product {
  name: string;
  price: number;
  description: string;
  images: string[];
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
            setTimeout(() => setUploadSuccess(false), 60000);
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
            <div className="items-center gap-4 flex">
              <button
                onClick={fetchProducts}
                className="text-green-700 hover:text-green-900 flex items-center gap-1 text-sm font-medium">
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </button>
              <button
                onClick={() => {
                  const thas = products.filter(
                    (it) =>
                      it.images[0] ===
                      "https://fyldgskqxrfmrhyluxmw.supabase.co/storage/v1/object/public/product-images/default-food.jpg"
                  );
                  console.log(thas);
                  setProducts(thas);
                }}
                className="text-green-700 hover:text-green-900 flex items-center gap-1 text-sm font-medium">
                Fecth empty images
              </button>
            </div>
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
                      Image
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-green-800">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-green-800">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-sm font-bold text-green-800">
                      Description
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {products.map((p, i) => (
                    <tr key={i} className="hover:bg-green-50">
                      <td className="px-6 py-3 font-medium text-gray-800">
                        <div className="w-[60px] h-[60px] relative rounded-md overflow-hidden">
                          <Image
                            src={p.images[0]}
                            alt={p.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-800">
                        {p.name}
                      </td>
                      <td className="px-6 py-3 text-gray-700">
                        ₦{p.price.toLocaleString()}
                      </td>
                      <td className="px-6 py-3 font-medium text-gray-700">
                        {p.description}
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
