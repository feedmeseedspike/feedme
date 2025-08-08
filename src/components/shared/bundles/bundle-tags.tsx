"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { formatNaira, toSlug } from "src/lib/utils";
import { Tables } from "src/utils/database.types";
import { useQuery } from "@tanstack/react-query";
import { fetchBundles } from "src/queries/bundles";
import { Separator } from "@components/ui/separator";
import { ChevronRight } from "lucide-react";

interface BundleTagsProps {
  title?: string;
  href?: string;
  limit?: number;
  bundles?: Tables<"bundles">[] | null;
}

export default function BundleTags({
  title = "Popular Bundles",
  href = "/bundles", 
  limit = 10,
  bundles,
}: BundleTagsProps) {
  const {
    data: fetchedBundles,
    isLoading,
    error: fetchedError,
  } = useQuery({
    queryKey: ["bundles", { limit }],
    queryFn: () =>
      fetchBundles({
        itemsPerPage: limit,
        publishedStatus: ["published"],
      }),
    enabled: !bundles,
  });

  if (isLoading && !bundles) {
    return (
      <section className="bg-white rounded-[8px] p-2 md:p-4">
        <div className="h-6 bg-gray-200 rounded mb-4"></div>
        <div className="h-1 bg-gray-200 rounded mb-4"></div>
        <div className="flex gap-3 md:gap-6 pt-6 overflow-x-auto">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="flex-shrink-0 flex flex-col gap-2 justify-center items-center"
            >
              <div className="size-[6rem] md:size-[8rem] bg-gray-200 rounded-full"></div>
              <div className="h-4 w-16 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if ((fetchedError || !fetchedBundles?.data) && !bundles) {
    return null;
  }

  const bundlesToRender = bundles || fetchedBundles?.data;

  if (!bundlesToRender || bundlesToRender.length === 0) {
    return null;
  }

  return (
    <section className="bg-white rounded-[8px] p-2 md:p-4 w-full">
      <div className="flex items-center justify-between text-[14px]">
        {href ? (
          <Link href={href} className="h2-bold truncate">
            {title}
          </Link>
        ) : (
          <h2 className="h2-bold">{title}</h2>
        )}
        {href && (
          <Link
            href={href}
            className="flex md:gap-1 items-center text-[#F0800F] whitespace-nowrap"
          >
            <p>See More</p>
            <ChevronRight className="size-[14px]" />
          </Link>
        )}
      </div>
      <Separator className="my-4" />
      
      <div className="flex gap-3 md:gap-6 pt-6 cursor-pointer overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide w-full">
        {bundlesToRender.map((bundle: Tables<"bundles">, index) => {
          const bundleSlug = toSlug(bundle.name || "bundle");
          
          return (
            <motion.div
              key={bundle.id!}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ 
                duration: 0.4,
                delay: index * 0.05,
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
              whileHover={{ 
                y: -5,
                transition: { duration: 0.2, type: "spring", stiffness: 400 }
              }}
              className="group"
            >
              <Link
                href={`/bundles/${bundleSlug}`}
                className="flex flex-col gap-2 justify-center items-center flex-shrink-0"
              >
                <motion.div 
                  className="size-[6rem] md:size-[8rem] bg-[#F2F4F7] rounded-[100%] p-3 flex justify-center items-center relative overflow-hidden"
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.3, type: "spring", stiffness: 400 }
                  }}
                >
                  {/* Shimmer effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 opacity-0 group-hover:opacity-100"
                    initial={{ x: "-100%" }}
                    whileHover={{
                      x: "100%",
                      transition: { duration: 0.6, ease: "easeInOut" }
                    }}
                  />
                  
                  {/* Glow effect */}
                  <motion.div
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-green-400/10 to-blue-400/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    initial={false}
                  />

                  {/* Discount badge */}
                  {(bundle as any).discount_percentage && (bundle as any).discount_percentage > 0 && (
                    <div className="absolute -top-1 -right-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs font-medium z-20">
                      -{(bundle as any).discount_percentage}%
                    </div>
                  )}
                  
                  {bundle.thumbnail_url && (
                    <motion.div
                      whileHover={{ 
                        scale: 1.1,
                        rotate: [0, -2, 2, 0],
                        transition: { 
                          scale: { duration: 0.3 },
                          rotate: { duration: 0.5, ease: "easeInOut" }
                        }
                      }}
                      className="relative z-10"
                    >
                      <Image
                        src={bundle.thumbnail_url}
                        width={150}
                        height={150}
                        alt={bundle.name || "Bundle"}
                        className="hover:scale-110 hover:transition-transform hover:ease-in-out hover:duration-500 object-contain"
                      />
                    </motion.div>
                  )}
                </motion.div>
                
                <div className="text-center">
                  <motion.p 
                    className="text-[12px] md:text-[16px] text-black transition-colors duration-300 group-hover:text-gray-800 font-medium line-clamp-2"
                    whileHover={{ 
                      scale: 1.05,
                      transition: { duration: 0.2, type: "spring", stiffness: 400 }
                    }}
                  >
                    {bundle.name}
                  </motion.p>
                  <p className="text-[10px] md:text-[14px] text-[#F0800F] font-bold">
                    {formatNaira(bundle.price || 0)}
                  </p>
                </div>
              </Link>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}