
import Stroke from "@components/home/Stroke";
import Container from "../shared/Container";
import Image from "next/image";
import React, { useRef, useState, useEffect, useMemo } from "react";
import { IoIosArrowForward } from "react-icons/io";
// import {
//   useDeleteCategoryMutation,
//   useGetCategoriesQuery,
// } from "@/services/category/categoryApi";
// import { toast } from "react-hot-toast";
// import { useDispatch } from "react-redux";
// import { useRouter } from "next/navigation";
import { Category } from "src/types/category";
import Link from "next/link";
// import { setCategories, setCategory } from "@/features/category/categorySlice";
type Props = {
  categories: Category[];
};

const TopCategories = ({ categories }: Props) => {
  // console.log(categories)

  // const {
  //   data: categoriesData,
  //   error: categoriesError,
  //   isLoading: categoriesLoading,
  // } = useGetCategoriesQuery();
  // const categories = useMemo(
  //   () => categoriesData?.data || [],
  //   [categoriesData]
  // );
  // const dispatch = useDispatch();

  // const router = useRouter();

  // useEffect(() => {
  //   if (categoriesLoading) {
  //     toast.loading("Fetching Categories...", { id: "categoriesData" });
  //   }

  //   if (categoriesData) {
  //     toast.success(categoriesData?.description, { id: "categoriesData" });
  //   }

  //   if (categoriesError) {
  //     toast.error(categoriesError?.data?.description, { id: "categoriesData" });
  //   }

  //   dispatch(setCategories(categories));
  // }, [
  //   categoriesError,
  //   categoriesData,
  //   categoriesLoading,
  //   dispatch,
  //   categories,
  // ]);


  return (
    <section className="">
      <Container>
        <Stroke />
        <div className="flex gap-3 md:gap-6 pt-6 cursor-pointer overflow-x-scroll whitespace-nowrap scrollbar-hide">
          {categories.map((category) => {
            return (
              <Link href={`/category/?category_id=${category?._id}`}
                className="flex flex-col gap-2 justify-center items-center min-w-[150px] flex-shrink-0"
                key={category._id}
              >
                <div
                  className="h-32 w-32 bg-[#F2F4F7] rounded-[100%]  p-3 flex justify-center items-center">
                  <Image
                    src={category.thumbnail.url}
                    width={150}
                    height={150}
                    alt={category.title}
                    className="hover:scale-110 hover:transition-transform hover:ease-in-out hover:duration-500 object-contain"
                  />
                </div>
                <p className="text-[22px] md:text-lg text-black hover:underline hover:underline-offset-2">
                  {category.title}
                </p>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
};
export default TopCategories;
