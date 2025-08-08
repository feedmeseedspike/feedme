"use client";

import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
// import ProductSlider from '../components/product/product-slider'
import { RootState } from "src/store";
import { cn } from "src/lib/utils";
import Container from "@components/shared/Container";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
// HeaderTags is now in the layout
import CustomBreadcrumb from "@components/shared/breadcrumb";
import ProductCardSkeleton from "@components/shared/product/product-skeleton";

export default function BrowsingHistoryPage() {
  const products = useSelector(
    (state: RootState) => state.browsingHistory.products
  );
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(
          `/api/products/browsing-history?type=history&ids=${products
            .map((product) => product.id)
            .join(",")}`
        );
        const result = await res.json();
        // console.log(products.map((product) => product.id).join(","));
        setData(result);
      } catch (error) {
        console.error("Failed to fetch browsing history:", error);
        setData([]);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProducts();
  }, [products]);

  // // console.log(data);

  return (
    <main>
      <div className="bg-white py-4">
        <Container className="">
          <CustomBreadcrumb />
        </Container>
      </div>
      <div className="py-2 md:border-b shadow-sm">
        <Container>
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <h1 className="text-[#1B6013] text-2xl md:text-3xl font-bold">
                Your Browsing History
              </h1>
            </div>
          </div>
        </Container>
      </div>
      <Container className="py-8">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {isLoading ? (
              Array.from({ length: 10 }).map((_, index) => (
                <ProductCardSkeleton key={index} />
              ))
            ) : data.length === 0 ? (
              <div className="text-2xl font-semibold">No products found</div>
            ) : (
              data?.map((product: any) => (
                <ProductdetailsCard key={product._id} product={product} />
              ))
            )}
          </div>
          {/* {data.totalPages > 1 && (
        <Pagination page={page} totalPages={data.totalPages} />
      )} */}
        </div>
      </Container>
    </main>
  );
}
