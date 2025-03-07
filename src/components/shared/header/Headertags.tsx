import Container from '@components/shared/Container'
import Link from 'next/link'
import React from 'react'
import { headerMenus } from 'src/lib/data'
import Sidebar from "./Sidebar"
import { CategoryResponse } from "src/types/category";


const fetchCategories = async (): Promise<CategoryResponse> => {
  const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/category/get-categories`, {
    cache: 'no-store',
  });
  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }
  return response.json();
};

const Headertags = async () => {
  const categoriesResponse = await fetchCategories();

  return (
    <div className="bg-white">
      <Container>
        <div className="py-2 flex items-center gap-x-2 whitespace-nowrap scrollbar-hide w-full">
          <Sidebar
            categories={categoriesResponse.data}
          />
          <div className="border-l h-7 rounded" />
          <div className="flex items-center text-[14px] gap-3 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide w-full">
            {headerMenus.map((menu) => (
              <Link
                href={menu.href}
                key={menu.href}
                className='header-button !p-2 '
              >
                {menu.name}
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </div>
  )
}

export default Headertags