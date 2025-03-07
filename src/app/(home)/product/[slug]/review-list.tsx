"use client";

import Rating from "@components/shared/product/rating";
import RatingSummary from "@components/shared/product/rating-summary";
import { Button } from "@components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { Textarea } from "@components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { StarIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { Product, ReviewInputSchema } from "src/lib/validator";
import { IReviewInput } from "src/types";
import { z } from "zod";
import ReviewActions from "./ReviewActions";

type ReviewListProps = {
  avgRating?: number;
  product: any;
  userId: string | undefined;
};

const reviewFormDefaultValues = {
  title: "",
  comment: "",
  rating: 0,
};

const ReviewList = ({ product, userId, avgRating = 0 }: ReviewListProps) => {
  const [reviews, setReviews] = useState<IReviewInput[]>([]);
  console.log(userId);

  useEffect(() => {
    if (product.reviews) {
      setReviews(product.reviews);
    }
  }, [product.reviews]);

  type CustomerReview = z.infer<typeof ReviewInputSchema>;
  const form = useForm<CustomerReview>({
    resolver: zodResolver(ReviewInputSchema),
    defaultValues: reviewFormDefaultValues,
  });
  const [open, setOpen] = useState(false);
  // const { toast } = useToast()
  const onSubmit: SubmitHandler<CustomerReview> = async (values) => {
    console.log(values)
    // const res = await createUpdateReview({
    //   data: { ...values, product: product._id },
    //   path: `/product/${product.slug}`,
    // })
    // if (!res.success)
    //   return toast({
    //     variant: 'destructive',
    //     description: res.message,
    //   })
    // setOpen(false)
    // toast({
    //   description: res.message,
    // })
  };

  const handleOpenForm = async () => {
    form.setValue("product", product._id);
    form.setValue("user", userId!);
    form.setValue("isVerifiedPurchase", true);
    setOpen(true)
  };

  console.log(reviews);

  return (
    <div className="space-y-2">
      {/* {reviews.length === 0 && <div>No reviews yet</div>} */}
      <div className=" grid grid-cols-1 md:grid-cols-7 gap-4 ">
        {reviews.length !== 0 && (
          <>
            <div className="p-8 flex flex-col gap-y-3 bg-[#F2F4F7] col-span-3 rounded-[8px]">
              <h1 className="font-bold text-6xl">
                {product.avgRating.toFixed(1)}
              </h1>
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
          </>
        )}
      </div>
      <div className="">
        <div className="md:grid grid-cols-9 gap-4">
          <div className="col-span-3">
            <h3 className="font-semibold text-xl">Review this product</h3>
            <p className="pt-3 h4-light"> Share your feedback and help create a better shopping experience for everyone</p>
            {userId ? (
              <Dialog open={open} onOpenChange={setOpen}>
                <Button
                  onClick={handleOpenForm}
                  variant="outline"
                  className="rounded-full w-fit px-10 py-3 mt-4"
                >
                  Write a customer review
                </Button>

                <DialogContent className="sm:max-w-[425px] lg:max-w-[560px]">
                  <Form {...form}>
                    <form method="post" onSubmit={form.handleSubmit(onSubmit)}>
                      <DialogHeader>
                        <DialogTitle>Write a customer review</DialogTitle>
                        <DialogDescription>
                          Share your thoughts with other customers
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="flex flex-col gap-5">
                          <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Title</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter title" {...field} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                              <FormItem className="w-full">
                                <FormLabel>Comment</FormLabel>
                                <FormControl>
                                  <Textarea
                                    placeholder="Enter comment"
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                        <div>
                          <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Rating</FormLabel>
                                <Select
                                  onValueChange={field.onChange}
                                  value={field.value.toString()}
                                >
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select a rating" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    {Array.from({ length: 5 }).map(
                                      (_, index) => (
                                        <SelectItem
                                          key={index}
                                          value={(index + 1).toString()}
                                        >
                                          <div className="flex items-center gap-1">
                                            {index + 1}{" "}
                                            <StarIcon className="h-4 w-4" />
                                          </div>
                                        </SelectItem>
                                      )
                                    )}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <DialogFooter>
                        <Button
                          type="submit"
                          size="lg"
                          disabled={form.formState.isSubmitting}
                          className="bg-[#1B6013] hover:bg-[#1b6013f3] transition-all"
                        >
                          {form.formState.isSubmitting
                            ? "Submitting..."
                            : "Submit"}
                        </Button>
                      </DialogFooter>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            ) : (
              <div>
                Please{" "}
                <Link
                  href={`/sign-in?callbackUrl=/product/${product.slug}`}
                  className="highlight-link"
                >
                  sign in
                </Link>{" "}
                to write a review
              </div>
            )}
          </div>
          <div className="col-span-6">
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
            {(!reviews || reviews.length === 0) && <div>No reviews yet</div>}
            {reviews.map((review) => (
              <div className="py-4 md:pt-0" key={review.user}>
                <div className="flex gap-2 items-center">
                  <Image
                    width={34}
                    height={34}
                    src="/images/default.png"
                    alt=""
                  />
                  <p className="text-[13px]">Jeremiah Oyedele</p>
                </div>
                <div className="flex gap-2 items-center max-w-full">
                  <Rating rating={product.avgRating} />
                  <p className="h5-light !text-black ">{review.title}</p>
                </div>
                <p className="h5-light">
                  Reviewed in the United States on November 15, 2024
                </p>
                <p className="!text-[#12B76A] h6-light !font-bold">
                  Verified Purchase
                </p>
                <p className="text-[14px] leading-[20px] text-black max-w-full">
                  {review.comment}
                </p>
                <div className="flex  items-center gap-4 pt-3">
                  <ReviewActions />
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
