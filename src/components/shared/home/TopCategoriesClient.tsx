"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { toSlug } from "src/lib/utils";
import { Tables } from "../../../utils/database.types";

type Category = Tables<"categories">;

interface TopCategoriesClientProps {
  categories: Category[];
}

const TopCategoriesClient = ({ categories }: TopCategoriesClientProps) => {
  return (
    <div className="flex gap-3 md:gap-6 pt-6 cursor-pointer overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide w-full">
      {categories
        .filter((category) => !!category.id)
        .map((category: Category, index) => {
          return (
            <motion.div
              key={category.id!}
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
                href={`/category/${toSlug(category?.title)}`}
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
                  
                  {category.thumbnail && (
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
                        src={(category.thumbnail as { url: string }).url}
                        width={150}
                        height={150}
                        alt={category.title}
                        className="hover:scale-110 hover:transition-transform hover:ease-in-out hover:duration-500 object-contain"
                      />
                    </motion.div>
                  )}
                </motion.div>
                
                <motion.p 
                  className="text-[14px] md:text-[22px] md:text-lg text-black transition-colors duration-300 group-hover:text-gray-800"
                  whileHover={{ 
                    scale: 1.05,
                    transition: { duration: 0.2, type: "spring", stiffness: 400 }
                  }}
                >
                  {category.title}
                </motion.p>
              </Link>
            </motion.div>
          );
        })}
    </div>
  );
};

export default TopCategoriesClient;