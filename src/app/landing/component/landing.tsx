"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";

export default function ProductCarousel() {
  const carouselRef = useRef(null);

  useEffect(() => {
    const carousel: any = carouselRef.current;
    if (!carousel) return;

    const scrollWidth = carousel.scrollWidth;
    const clientWidth = carousel.clientWidth;
    let scrollPosition = 0;

    const scroll = () => {
      scrollPosition += clientWidth / 4; // Scroll by half a card width for smooth effect
      if (scrollPosition >= scrollWidth - clientWidth) {
        scrollPosition = 0; // Reset to start for infinite loop
      }
      carousel.scrollTo({ left: scrollPosition, behavior: "smooth" });
    };

    const interval = setInterval(scroll, 3000); // Auto-scroll every 3 seconds

    // Pause on hover
    carousel.addEventListener("mouseenter", () => clearInterval(interval));
    carousel.addEventListener("mouseleave", () => {
      setInterval(scroll, 3000);
    });

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4 py-9">
        <h2 className="text-3xl font-bold text-center text-black mb-8">
          Our Fresh Produce
        </h2>
        <div
          ref={carouselRef}
          className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide"
          style={{ scrollBehavior: "smooth" }}>
          {[
            {
              name: "Onions",
              img: "https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8b25pb258ZW58MHx8MHx8fDA%3D",
              alt: "Fresh onions for sale in Nigerian markets",
              description: "Crisp, juicy onions for your dishes.",
            },
            {
              name: "Tomatoes",
              img: "https://images.pexels.com/photos/533280/pexels-photo-533280.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2",
              alt: "Fresh tomatoes for restaurants in Nigeria",
              description: "Vibrant tomatoes for rich flavors.",
            },
            {
              name: "Pepper",
              img: "https://images.unsplash.com/photo-1606170034765-13ccb20615b5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8dmVnZXRhYmxlfGVufDB8fDB8fHww",
              alt: "Fresh peppers for Nigerian cuisine",
              description: "Spicy peppers to add zest.",
            },
            {
              name: "Tatashe",
              img: "https://images.unsplash.com/photo-1725031209965-3f4de753e0a4?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGJhbGwlMjBwZXBwZXJ8ZW58MHx8MHx8fDA%3D",
              alt: "Fresh tatashe for Nigerian stews",
              description: "Sweet tatashe for authentic stews.",
            },
            {
              name: "Plantains",
              img: "https://images.unsplash.com/photo-1603833665858-e61d17a86224?q=80&w=627&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
              alt: "Fresh green plantains for catering in Nigeria",
              description: "Ripe or green plantains for versatility.",
            },
            {
              name: "Pineapples",
              img: "https://images.pexels.com/photos/947879/pexels-photo-947879.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2",
              alt: "Fresh pineapples for sale in Nigeria",
              description: "Juicy pineapples for desserts.",
            },
            {
              name: "Watermelon",
              img: "https://images.unsplash.com/photo-1708982553355-794739c6693e?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8d2F0ZXJtZWxvbnxlbnwwfHwwfHx8MA%3D%3D",
              alt: "Fresh watermelons in Nigerian markets",
              description: "Refreshing watermelons for events.",
            },
            {
              name: "Mango",
              img: "https://images.pexels.com/photos/2294471/pexels-photo-2294471.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2",
              alt: "Fresh mangoes for Nigerian businesses",
              description: "Sweet mangoes for snacks.",
            },
            {
              name: "Beef",
              img: "https://images.unsplash.com/photo-1695683948382-868cd8d516fe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YmVlZnxlbnwwfHwwfHx8MA%3D%3D",
              alt: "Fresh beef for restaurants in Nigeria",
              description: "Premium beef for hearty meals.",
            },
            {
              name: "Chicken",
              img: "https://images.pexels.com/photos/616354/pexels-photo-616354.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2",
              alt: "Fresh chicken for catering in Nigeria",
              description: "Tender chicken for all dishes.",
            },
            {
              name: "Goat Meat",
              img: "https://images.unsplash.com/photo-1695683948382-868cd8d516fe?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YmVlZnxlbnwwfHwwfHx8MA%3D%3D",
              alt: "Fresh goat meat for Eid Adha in Nigeria",
              description: "Fresh goat meat for festive occasions.",
            },
            {
              name: "Carrot",
              img: "https://images.pexels.com/photos/143133/pexels-photo-143133.jpeg?auto=compress&cs=tinysrgb&w=300&h=200&dpr=2",
              alt: "Fresh carrots for Nigerian markets",
              description: "Crunchy carrots for salads.",
            },
            {
              name: "Spring Onion",
              img: "https://images.unsplash.com/photo-1602769515559-e15133a7e992?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8c3ByaW5nJTIwb25pb258ZW58MHx8MHx8fDA%3D",
              alt: "Fresh spring onions for Nigerian cuisine",
              description: "Flavorful spring onions for garnishing.",
            },
            {
              name: "Leafy Vegetables",
              img: "https://images.unsplash.com/photo-1574316071802-0d684efa7bf5?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTZ8fHZlZ2V0YWJsZXxlbnwwfHwwfHx8MA%3D%3D",
              alt: "Fresh leafy vegetables for Nigerian stews",
              description: "Nutritious greens for healthy meals.",
            },
            {
              name: "Potatoes",
              img: "https://images.unsplash.com/photo-1635774855536-9728f2610245?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8cG90YXRvZXN8ZW58MHx8MHx8fDA%3D",
              alt: "Fresh potatoes for restaurants in Nigeria",
              description: "Versatile potatoes for any dish.",
            },
          ].map((product) => (
            <div
              key={product.name}
              className="flex-none w-96 snap-center bg-gray-100 rounded-lg shadow-md p-2 mx-2 transform hover:scale-105 transition-transform duration-300">
              <Image
                src={product.img}
                alt={product.alt}
                width={600}
                height={200}
                className="w-full h-48 object-cover rounded-md mb-4"
                loading="lazy"
              />
              <h3 className="text-xl font-semibold text-black">
                {product.name}
              </h3>
              <p className="text-black">{product.description}</p>
            </div>
          ))}
        </div>
      </div>
      {/* Hide Scrollbar CSS */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </section>
  );
}
