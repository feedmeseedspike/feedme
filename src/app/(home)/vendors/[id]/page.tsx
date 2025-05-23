"use client";
import Container from "@components/shared/Container";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Input } from "../../../../components/ui/input";
import {
  CheckBadgeIcon,
  ChevronDoubleRightIcon,
  ClipboardDocumentIcon,
  FunnelIcon,
  MagnifyingGlassIcon,
  PhoneIcon,
  EnvelopeIcon,
  MapPinIcon,
  ShoppingBagIcon,
  StarIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/solid";
import Image from "next/image";
import Link from "next/link";
import ProductdetailsCard from "@components/shared/product/productDetails-card";
import { notFound } from "next/navigation";
import { products, vendors } from "src/lib/data";
import CustomBreadcrumb from "@components/shared/breadcrumb";
import { toast } from "sonner";
import ChatModal from "@components/vendor/ChatModal";
import { useState } from "react";

export default function VendorPage({ params }: { params: { id: string } }) {
  const vendor = vendors.find((v) => v._id === params.id);

  const [isChatOpen, setIsChatOpen] = useState(false);

  if (!vendor) {
    return notFound();
  }

  const vendorProducts = products.filter((product) =>
    vendor.products.includes(product._id)
  );

  const bestSellingProducts = vendorProducts
    .sort((a, b) => (b.numSales || 0) - (a.numSales || 0))
    .slice(0, 4);

  const copyToClipboard = (text: string, message: string) => {
    navigator.clipboard.writeText(text);
    toast.success(message);
  };

  return (
    <>
      <div className="bg-white border-b">
        <Container className="py-4">
          <CustomBreadcrumb />
        </Container>
      </div>

      <Container className="space-y-8 pb-8 pt-6">
        {/* Vendor Header Section */}
        <section className="space-y-6">
          <div className="relative aspect-[3] sm:aspect-[4] w-full rounded-xl bg-gray-100 shadow-sm overflow-hidden">
            <Image
              src={vendor.coverImage || "/images/default-cover.jpg"}
              fill
              priority
              quality={100}
              alt="Vendor cover"
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />

            <div className="absolute bottom-4 left-4 z-10 flex items-end gap-4">
              <div className=" md:size-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden">
                <Image
                  src={vendor.logo || "/images/default-avatar.jpg"}
                  alt="Vendor avatar"
                  width={96}
                  height={96}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="mb-2 text-white">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl font-bold">{vendor.displayName}</h1>
                  {vendor.isVerified && (
                    <Badge className="flex items-center gap-1 bg-green-600 hover:bg-green-600/90 text-white">
                      <CheckBadgeIcon className="h-4 w-4" />
                      Verified
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <div className="flex items-center gap-1">
                    <StarIcon className="h-4 w-4 text-yellow-400" />
                    <span>{vendor.rating || "N/A"}</span>
                    <span className="text-gray-300">
                      ({vendor.numReviews || 0})
                    </span>
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <ShoppingBagIcon className="h-4 w-4" />
                    <span>{vendor.products.length} products</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Vendor Actions */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg bg-white p-4 shadow-sm border">
            <div className="flex-col sm:flex-row flex sm:items-center gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() =>
                  copyToClipboard(
                    vendor.contact?.phone || "",
                    "Phone number copied!"
                  )
                }
              >
                <PhoneIcon className="h-5 w-5" />
                {vendor.contact?.phone || "Not provided"}
                <ClipboardDocumentIcon className="h-4 w-4 text-gray-500" />
              </Button>

              <Button
                variant="outline"
                className="gap-2"
                onClick={() =>
                  copyToClipboard(vendor.contact?.email || "", "Email copied!")
                }
              >
                <EnvelopeIcon className="h-5 w-5" />
                {vendor.contact?.email || "Not provided"}
                <ClipboardDocumentIcon className="h-4 w-4 text-gray-500" />
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <Button
                onClick={() => setIsChatOpen(true)}
                className="bg-green-700 hover:bg-green-700/90 gap-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
                </svg>
                Message Vendor
              </Button>
              <ChatModal
        vendorId={params.id}
        vendorName={vendor.displayName}
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
      />
            </div>
          </div>
        </section>

        {/* Vendor Details Section */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="rounded-lg bg-white p-6 shadow-sm border">
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <ShieldCheckIcon className="h-5 w-5 text-green-600" />
                About This Vendor
              </h3>
              <p className="text-gray-700 leading-relaxed">
                {vendor.description ||
                  "No description provided by this vendor."}
              </p>
            </div>

            {/* Business Information */}
            <div className="rounded-lg bg-white p-6 shadow-sm border">
              <h3 className="text-xl font-semibold mb-4">
                Business Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <MapPinIcon className="h-5 w-5 text-gray-500" />
                    Location
                  </h4>
                  <p className="text-gray-600">
                    {vendor.contact?.address || "Not specified"}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
                    </svg>
                    Business Type
                  </h4>
                  <p className="text-gray-600">
                    {vendor.businessType || "Not specified"}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <rect
                        x="3"
                        y="4"
                        width="18"
                        height="18"
                        rx="2"
                        ry="2"
                      ></rect>
                      <line x1="16" y1="2" x2="16" y2="6"></line>
                      <line x1="8" y1="2" x2="8" y2="6"></line>
                      <line x1="3" y1="10" x2="21" y2="10"></line>
                    </svg>
                    Member Since
                  </h4>
                  <p className="text-gray-600">
                    {new Date(
                      vendor.joinDate || Date.now()
                    ).toLocaleDateString()}
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium text-gray-900 flex items-center gap-2">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-gray-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                      <circle cx="12" cy="7" r="4"></circle>
                    </svg>
                    Team Size
                  </h4>
                  <p className="text-gray-600">
                    {vendor.teamSize || "Not specified"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <div className="rounded-lg bg-white p-6 shadow-sm border">
              <h3 className="text-xl font-semibold mb-4">Vendor Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium">
                    {vendor.responseRate || "N/A"}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-medium">
                    {vendor.responseTime || "N/A"} hours
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Order Fulfillment</span>
                  <span className="font-medium">
                    {vendor.fulfillmentRate || "N/A"}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Positive Reviews</span>
                  <span className="font-medium">
                    {vendor.positiveReviews || "N/A"}%
                  </span>
                </div>
              </div>
            </div>

            {/* Policies */}
            <div className="rounded-lg bg-white p-6 shadow-sm border">
              <h3 className="text-xl font-semibold mb-4">Policies</h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900">Return Policy</h4>
                  <p className="text-gray-600 text-sm">
                    {vendor.returnPolicy || "Not specified"}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">Shipping Policy</h4>
                  <p className="text-gray-600 text-sm">
                    {vendor.shippingPolicy || "Not specified"}
                  </p>
                </div>
              </div>
            </div>

            {/* Social Media */}
            {/* {vendor.socialMedia && (
              <div className="rounded-lg bg-white p-6 shadow-sm border">
                <h3 className="text-xl font-semibold mb-4">Follow Us</h3>
                <div className="flex items-center gap-3">
                  {vendor.socialMedia.facebook && (
                    <Link href={vendor.socialMedia.facebook} target="_blank" className="text-gray-700 hover:text-blue-600">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                      </svg>
                    </Link>
                  )}
                  {vendor.socialMedia.twitter && (
                    <Link href={vendor.socialMedia.twitter} target="_blank" className="text-gray-700 hover:text-blue-400">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                      </svg>
                    </Link>
                  )}
                  {vendor.socialMedia.instagram && (
                    <Link href={vendor.socialMedia.instagram} target="_blank" className="text-gray-700 hover:text-pink-600">
                      <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </Link>
                  )}
                </div>
              </div>
            )} */}
          </div>
        </section>

        {/* Products Section */}
        <section className="space-y-8">
          {/* Best Selling Products */}
          {bestSellingProducts.length > 0 && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-6 w-6 text-green-600"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="8.5" cy="7" r="4"></circle>
                    <polyline points="17 11 19 13 23 9"></polyline>
                  </svg>
                  Best Sellers
                </h2>
                {vendorProducts.length > 4 && (
                  <Link
                    href="#"
                    className="text-green-700 hover:text-green-800 font-medium flex items-center gap-1"
                  >
                    View all products
                    <ChevronDoubleRightIcon className="h-4 w-4" />
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
                {bestSellingProducts.map((product) => (
                  <ProductdetailsCard
                    key={product._id}
                    product={product}
                    // showSalesCount
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Products */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold flex items-center gap-2">
                <ShoppingBagIcon className="h-6 w-6 text-green-600" />
                All Products
              </h2>
              <div className="flex items-center gap-2">
                <div className="relative max-w-xs">
                  <Input
                    placeholder="Search products..."
                    className="pl-10 pr-4 py-2 rounded-full border-gray-300 focus:ring-green-500 focus:border-green-500"
                  />
                  <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                </div>
                <Button variant="outline" className="rounded-full">
                  <FunnelIcon className="h-5 w-5 mr-2" />
                  Filter
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {vendorProducts.map((product) => (
                <ProductdetailsCard
                  key={product._id}
                  product={product}
                  // showQuickView
                />
              ))}
            </div>

            {vendorProducts.length > 12 && (
              <div className="flex justify-center">
                <Button variant="outline" className="rounded-full px-6">
                  Load More Products
                </Button>
              </div>
            )}
          </div>
        </section>
      </Container>
    </>
  );
}
