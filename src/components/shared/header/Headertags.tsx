import Container from "@components/shared/Container";
import Link from "next/link";
import React from "react";
import { headerMenus } from "src/lib/data";
import HeaderTagsClient from "./HeaderTagsClient";
import HeaderTagsWrapper from "./HeaderTagsWrapper";
import { createClient } from "src/utils/supabase/server";
import {
  TiSocialTwitter,
  TiSocialFacebook,
  TiSocialLinkedin,
} from "react-icons/ti";
import { SlSocialInstagram } from "react-icons/sl";
import { FaGooglePlay } from "react-icons/fa";

type CategoryListItem = {
  id: string;
  title: string;
  thumbnail: any; 
};

type Product = {
  id: string;
  name: string;
};

export default async function Headertags() {
  const supabase = await createClient();
  let categories: CategoryListItem[] = [];
  let productsByCategory: Record<string, Product[]> = {};
  let error: string | null = null;
  
  try {
    // Direct Supabase query, no React Query
    const { data, error: fetchError } = await supabase
      .from("categories")
      .select("*")
      .order("created_at", { ascending: false });
      
    if (fetchError) throw fetchError;
    categories = (data || []) as CategoryListItem[];
    // Filter out Spin Wheel category IF it exists (as per user request)
    categories = categories.filter(c => 
        !c.title.toLowerCase().includes("spin") && 
        !c.title.toLowerCase().includes("wheel")
    );
    // console.log("HeaderTags categories:", categories);

    // Fetch products for each category (limit to 2 per category)
    const productsPromises = categories.map(async (cat) => {
      try {
        const { data: productsData, error: productsError } = await supabase
          .from("products")
          .select("id, name")
          .contains("category_ids", [cat.id])
          .limit(2);
          
        if (productsError) {
          console.error(
            `Error fetching products for category ${cat.id}:`,
            productsError
          );
          return { categoryId: cat.id, products: [] };
        }
        
        return { 
          categoryId: cat.id, 
          products: (productsData || []).map((p: any) => ({
            id: p.id,
            name: p.name,
          })),
        };
      } catch (error) {
        console.error(`Error fetching products for category ${cat.id}:`, error);
        return { categoryId: cat.id, products: [] };
      }
    });

    const productsResults = await Promise.all(productsPromises);
    productsResults.forEach(({ categoryId, products }) => {
      productsByCategory[categoryId] = products;
    });
    
    // console.log("HeaderTags products by category:", productsByCategory);
  } catch (err: any) {
    console.error("HeaderTags error:", err);
    error = err.message || "Failed to fetch categories";
  }

  return (
    <HeaderTagsWrapper>
        <Container>
          <div className="py-2 flex items-center gap-x-2 whitespace-nowrap scrollbar-hide w-full">
            <HeaderTagsClient
              categories={categories}
              productsByCategory={productsByCategory}
              error={error}
            />
            <div className="border-l h-7 rounded" />
            <div className="flex items-center text-[14px] gap-3 overflow-x-auto whitespace-nowrap scrollbar-hide w-full overflow-visible">
              {headerMenus.map((menu) => (
                <Link
                  href={menu.href}
                  key={menu.href}
                  className="relative inline-block after:content-[''] after:absolute after:bottom-0 after:left-0 after:h-[2px] after:w-full after:origin-bottom-right after:scale-x-0 after:bg-[#1B6013] after:transition-transform after:duration-300 after:ease-[cubic-bezier(0.65,0.05,0.36,1)] hover:after:origin-bottom-left hover:after:scale-x-100"
                >
                  {menu.name}
                </Link>
              ))}
            </div>
            
            <div className="ml-auto flex items-center gap-2.5 sm:gap-4 pl-2 sm:pl-4 border-l border-gray-200">
               <a href="https://play.google.com/store/apps/details?id=com.feedmemobile" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#3BCCFF] transition-colors" title="Download on Play Store">
                  <FaGooglePlay className="w-4 h-4" />
               </a>
               <a href="https://x.com/Seedspike15427" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#1DA1F2] transition-colors">
                  <TiSocialTwitter className="w-5 h-5" />
               </a>
               <a href="https://www.facebook.com/profile.php?id=100093243737297&mibextid=ZbWKwL" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#1877F2] transition-colors">
                  <TiSocialFacebook className="w-5 h-5" />
               </a>
               <a href="https://www.linkedin.com/company/seedspike/" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#0A66C2] transition-colors">
                  <TiSocialLinkedin className="w-5 h-5" />
               </a>
               <a href="https://www.instagram.com/seedspikeafrica/profilecard/?igsh=MTE4OW5zY2RjYnprYQ==" target="_blank" rel="noopener noreferrer" className="text-gray-600 hover:text-[#E4405F] transition-colors">
                  <SlSocialInstagram className="w-4 h-4" />
               </a>
            </div>
          </div>
        </Container>
    </HeaderTagsWrapper>
  );
}
