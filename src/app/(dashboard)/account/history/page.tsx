"use client";

import ProductSlider from "@components/shared/product/product-slider";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "src/store";

export default function BrowsingHistoryPage() {
  const products = useSelector(
    (state: RootState) => state.browsingHistory.products
  );
  const [historyData, setHistoryData] = useState([]);

  useEffect(() => {
    const fetchBrowsingHistory = async () => {
      if (products.length === 0) return;

      try {
        const res = await fetch(
          `/api/products/browsing-history?type=history&ids=${products
            .map((p) => p.id)
            .join(",")}`
        );
        const data = await res.json();
        setHistoryData(data);
        // // console.log(data)
        // // console.log(historyData)
      } catch (error) {
        console.error("Failed to fetch browsing history:", error);
      }
    };

    fetchBrowsingHistory();
  }, [products]);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Recently Viewed Products</h1>
      {historyData.length > 0 ? (
        <ProductSlider
          title="Previously Viewed Items"
          products={historyData}
          hideDetails={false}
        />
      ) : (
        <p className="text-gray-500">
          You haven&apos;t viewed any products yet.
        </p>
      )}
    </div>
  );
}
