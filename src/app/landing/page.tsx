/* eslint-disable react/no-unescaped-entities */
"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import axios from "axios";
import Image from "next/image";
import ProductCarousel from "./component/landing";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();
  // Form state
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
  });
  const [formStatus, setFormStatus] = useState({ message: "", success: false });

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axios.post(
        `${process.env.NEXT_PUBLIC_SITE_URL!}/api/landing`,
        formData
      ); // Replace with your Formspree ID
      setFormStatus({
        message: "Successfully joined the list!",
        success: true,
      });
      setFormData({ name: "", phone: "", email: "" });
    } catch (error: any) {
      setFormStatus({
        message: "Error submitting form. Try again: " + error.message,
        success: false,
      });
    }
  };

  // Animation variants
  const fadeIn = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <motion.section
        initial="hidden"
        animate="visible"
        variants={fadeIn}
        className="bg-gradient-to-r from-green-600 to-green-400 text-white pb-5 text-center">
        <div className="container mx-auto px-4">
          <div className="bg-white w-full justify-center items-center flex rounded-b-[220px] mb-8">
            <Image
              src={"/logos/logo.png"} // Replace with your logo path
              alt={"logo"}
              width={200}
              height={0}
              className="object-cover rounded-md"
              loading="lazy"
            />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Shop Fresh, Affordable Food — Delivered Fast Anywhere in Lagos
          </h1>
          <p className="text-xl mb-8">
            From grains and oils to meat and vegetables — FeedMe brings the
            market to your doorstep.
          </p>
          <a
            href="#join"
            className="inline-block bg-white text-green-600 font-semibold py-3 px-6 rounded-lg shadow-lg hover:bg-gray-100 transition">
            Join Our List
          </a>
        </div>
      </motion.section>

      {/* What is FeedMe? */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-black font-bold text-center mb-8">
            What is FeedMe?
          </h2>
          <p className="text-lg text-black max-w-2xl mx-auto text-center">
            FeedMe is your online food store for quality food items at
            unbeatable prices. Whether you’re buying in small or bulk
            quantities, we deliver fast, fresh, and directly to your home or
            office in Lagos. No stress. No overpriced groceries. Just real food,
            real fast.
          </p>
        </div>
      </motion.section>

      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-black font-bold text-center mb-8">
            See Our Offers
          </h2>
          <div>
            <Image
              src={
                "https://fyldgskqxrfmrhyluxmw.supabase.co/storage/v1/object/public/product-images/1754484881194.jpg"
              }
              alt={"pr"}
              width={600}
              height={600}
              className="w-full h-full object-cover rounded-xl mb-4"
              loading="lazy"
            />
          </div>
          <button
            onClick={() => router.push("/offers")}
            className="w-full bg-green-600 h-[50px] text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition">
            View All Offers
          </button>
        </div>
      </motion.section>

      {/* Product Showcase */}
      <ProductCarousel />

      {/* Why Choose FeedMe? */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-black font-bold text-center mb-8">
            Why Choose FeedMe?
          </h2>
          <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              "Affordable prices — from as low as ₦2,000",
              "Fast delivery within Lagos",
              "Bulk and personal orders welcome",
              "Clean, quality food items always",
              "Shop on WhatsApp or Website",
            ].map((item, index) => (
              <li key={index} className="flex items-start">
                <span className="text-green-600 text-2xl mr-2">✅</span>
                <span className="text-lg text-black">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </motion.section>

      {/* Testimonials Section */}
      <motion.section className="py-12 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-black font-bold text-center mb-8">
            What Our Customers Say
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                name: "Ronke Adewale",
                business: "Ros Caterers",
                quote:
                  "FeedMe Africa delivers fresh produce that keeps my catering business thriving in Nigeria!",
              },
              {
                name: "Flora Odekunle",
                quote:
                  "Reliable, fresh, and perfect for my restaurant’s needs in Lagos.",
              },
            ].map((testimonial) => (
              <div
                key={testimonial.name}
                className="bg-gray-100 rounded-lg shadow-md p-6">
                <p className="text-black italic mb-4">"{testimonial.quote}"</p>
                <p className="font-semibold text-black">
                  {testimonial.name}
                  {testimonial.business ? `, ${testimonial.business}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
      </motion.section>

      {/* Join Our List */}
      <motion.section
        id="join"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-black font-bold text-center mb-8">
            Join Our List & Never Miss a Deal
          </h2>
          <p className="text-lg text-black max-w-2xl mx-auto text-center mb-8">
            Want first access to promos, special offers, and updates? Leave your
            contact info below and we’ll keep you in the loop!
          </p>
          <form onSubmit={handleSubmit} className="max-w-md mx-auto">
            <div className="mb-4">
              <label
                htmlFor="name"
                className="block text-black font-semibold mb-2">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter your name"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="phone"
                className="block text-black font-semibold mb-2">
                Phone Number / WhatsApp
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter your phone number"
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="email"
                className="block text-black font-semibold mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-600"
                placeholder="Enter your email"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition">
              Join the List
            </button>
            {formStatus.message && (
              <p
                className={`mt-4 text-center ${
                  formStatus.success ? "text-green-600" : "text-red-600"
                }`}>
                {formStatus.message}
              </p>
            )}
          </form>
        </div>
      </motion.section>

      {/* Trusted Section */}
      <motion.section
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        variants={fadeIn}
        className="py-16 bg-gray-100">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl text-black font-bold text-center mb-8">
            Trusted by Lagos Families & Businesses
          </h2>
          <ul className="text-lg text-black max-w-2xl mx-auto">
            <li className="flex items-start mb-4">
              <span className="text-green-600 text-2xl mr-2">✔️</span>
              <span>1000+ deliveries completed</span>
            </li>
            <li className="flex items-start mb-4">
              <span className="text-green-600 text-2xl mr-2">✔️</span>
              <span>Excellent customer service</span>
            </li>
            <li className="flex items-start">
              <span className="text-green-600 text-2xl mr-2">✔️</span>
              <span>Reliable for households, restaurants, and bulk buyers</span>
            </li>
          </ul>
        </div>
      </motion.section>

      {/* Footer */}
      <footer className="bg-green-600 text-white py-8 text-center">
        <div className="container mx-auto px-4">
          <p>© 2025 FeedMe. All rights reserved.</p>
          <p className="mt-2">
            Contact us:{" "}
            <a href="tel:+2348088282487" className="underline">
              +234 808 828 2487
            </a>{" "}
            |{" "}
            <a
              href="mailto:orders.feedmeafrica@gmail.com"
              className="underline">
              support@feedme.com
            </a>
          </p>
        </div>
      </footer>

      {/* JSON-LD Schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "LocalBusiness",
            name: "FeedMe",
            description:
              "Online food store delivering fresh, affordable food in Lagos.",
            url: "https://www.shopfeedme.com",
            address: {
              "@type": "PostalAddress",
              addressLocality: "Lagos",
              addressCountry: "NG",
            },
            telephone: "+234-808-828-2487",
          }),
        }}
      />
    </div>
  );
}
