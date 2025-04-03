"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "src/store";
import { cn } from "src/lib/utils";
import Container from "@components/shared/Container";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
import Headertags from "@components/shared/header/Headertags";

export default function RecommendedProductsPage() {
  const products = useSelector(
    (state: RootState) => state.browsingHistory.products
  );
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchRecommendedProducts = async () => {
      setIsLoading(true);
      try {
        if (products.length > 0) {
          const res = await fetch(
            `/api/products/browsing-history?type=related&categories=${products
              .map((product) => product.category)
              .join(",")}&ids=${products.map((product) => product.id).join(",")}`
          );
          const result = await res.json();
          setData(result);
        }
      } catch (error) {
        console.error("Failed to fetch recommended products:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRecommendedProducts();
  }, [products]);

  return (
    <main>
      <Headertags />
      <div className="py-2 md:border-b shadow-sm">
        <Container>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-[#1B6013] text-2xl md:text-3xl font-bold">
                Recommended For You
              </h1>
            </div>
          </div>
        </Container>
      </div>
      <Container className="py-8">
        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center py-8">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
              <p className="mt-2">Loading recommendations...</p>
            </div>
          ) : (
            <>
              {products.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-lg">Browse some products to get personalized recommendations</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4">
                  {data.length === 0 ? (
                    <div className="col-span-full text-center py-8">
                      <p className="text-lg">No recommendations found based on your browsing history</p>
                    </div>
                  ) : (
                    data.map((product: any) => (
                      <ProductdetailsCard key={product._id} product={product} />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </Container>
    </main>
  );
}
