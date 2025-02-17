"use client";

import Rating from "@components/shared/product/rating";
import RatingSummary from "@components/shared/product/rating-summary";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import Image from "next/image";
import React, { useState, useEffect } from "react";
import { Product } from "src/lib/validator";
import { IReviewInput } from "src/types";

type ReviewListProps = {
  avgRating?: number;
  product: any;
};

const ReviewList = ({ product, avgRating = 0 }: ReviewListProps) => {
  const [reviews, setReviews] = useState<IReviewInput[]>([]);

  useEffect(() => {
    if (product.reviews) {
      setReviews(product.reviews); // Set the reviews only when product.reviews is available
    }
  }, [product.reviews]); // Dependency array ensures it runs when product.reviews changes

  console.log(reviews);


  return (
    <div>
      <div className=" grid grid-cols-1 md:grid-cols-7 gap-4 ">
        {/* {reviews.length !== 0 && (
            <RatingSummary
              avgRating={product.avgRating}
              numReviews={product.numReviews}
              ratingDistribution={product.ratingDistribution}
            />
        )} */}
        <div className="p-8 flex flex-col gap-y-3 bg-[#F2F4F7] col-span-3 rounded-[8px]">
          <h1 className="font-bold text-6xl">{product.avgRating.toFixed(1)}</h1>
          <Rating rating={product.avgRating} />
          <p className="text-[#12B76A] text-[15.25px]">
            All from verified purchases
          </p>
        </div>
        <div className="bg-[#F2F4F7] col-span-4 rounded-[8px] p-8">
          <RatingSummary
            avgRating={product.avgRating}
            numReviews={product.numReviews}
            ratingDistribution={product.ratingDistribution}
            hideSummaryText
          />
        </div>
      </div>
        <div className="">
          <div className="py-4">
            <Select>
              <SelectTrigger className="text-[11px] px-2  w-[133px] bg-[#F0F2F2] border-[#D5D9D9] border rounded-[7px]">
                <SelectValue placeholder="Top reviews" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Fruits</SelectLabel>
                  <SelectItem value="apple">Apple</SelectItem>
                  <SelectItem value="banana">Banana</SelectItem>
                  <SelectItem value="blueberry">Blueberry</SelectItem>
                  <SelectItem value="grapes">Grapes</SelectItem>
                  <SelectItem value="pineapple">Pineapple</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div className="">
            <div className="">
              {reviews.map(review => (
                <div className="py-4" key={review.user}>
                  <div className="flex gap-2 items-center">
                    <Image width={34} height={34} src="/images/default.png" alt="" />
                    <p className="text-[13px]">Jeremiah Oyedele</p>
                  </div>
                  <div className="flex gap-2 items-center max-w-full">
                    <Rating rating={product.avgRating}/>
                    <p className="h5-light !text-black ">{review.title}</p>
                  </div>
                  <p className="h5-light">Reviewed in the United States on November 15, 2024</p>
                  <p className="!text-[#12B76A] h6-light !font-bold">Verified Purchase</p>
                  <p className="text-[14px] leading-[20px] text-black max-w-full">{review.comment}</p>
                  <div className="flex  items-center gap-4 pt-3">
                    <button className="border border-[#188C8C] rounded-[100px] px-8 py-[6px] text-[13px] hover:bg-[#12B76A] hover:text-white ease-in-out duration-300 transition-colors">
                      Helpful
                    </button>
                    <div className="h5-light cursor-pointer">Report</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
    </div>
  );
};

export default ReviewList;
