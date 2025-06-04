"use client";

import Container from '@components/shared/Container';
import Link from 'next/link';
import React, { useState } from 'react';
import { headerMenus } from 'src/lib/data';
import { motion } from "framer-motion";

const Headertags = () => {
  return (
    <div className="bg-white">
      <Container>
        <div className="py-2 flex items-center gap-x-2 whitespace-nowrap scrollbar-hide w-full">
          <div className="border-l h-7 rounded" />
          <div className="flex items-center text-[14px] gap-3 overflow-x-auto overflow-y-hidden whitespace-nowrap scrollbar-hide w-full">
            {headerMenus.map((menu) => (
              <Link
                href={menu.href}
                key={menu.href}
                className="header-button !p-2 relative group"
              >
                {menu.name}
                <motion.span
                  initial={{ scaleX: 0 }}
                  whileHover={{ scaleX: 1 }}
                  className="absolute -bottom-1 left-0 right-0 h-0.5 origin-left bg-red-900"
                  style={{ transformOrigin: 'left center' }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                />
              </Link>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
};

export default Headertags;