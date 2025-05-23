"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Button } from "@components/ui/button";
import { Input } from "@components/ui/input";
import { Pencil, MapPin, Phone, Mail, Clock, ShoppingBag, CheckCircle, Star, Truck, RefreshCw, Shield } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { formatDate } from "src/lib/utils";

interface VendorProfileProps {
  vendor: {
    _id: string;
    displayName: string;
    logo: string;
    coverImage: string;
    description: string;
    rating: number;
    numReviews: number;
    numSales: number;
    isVerified: boolean;
    joinDate: string;
    businessType: string;
    teamSize: string;
    responseRate: number;
    responseTime: number;
    fulfillmentRate: number;
    positiveReviews: number;
    returnPolicy: string;
    shippingPolicy: string;
    contact: {
      email: string;
      phone: string;
      address: string;
      workingHours: string;
    };
    location: {
      area: string;
      city: string;
      coordinates: { lat: number; lng: number };
    };
    socialMedia: {
      facebook?: string;
      twitter?: string;
      instagram?: string;
      whatsapp?: string;
    };
    categories: string[];
    numProducts: number;
    numFollowers: number;
  };
}

const VendorProfile = ({ vendor }: VendorProfileProps) => {
  const [editableVendor, setEditableVendor] = useState(vendor);
  const [isEditing, setIsEditing] = useState(false);
  const [logo, setLogo] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const handleLogoPreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogo(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditProfile = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // TODO: Add update vendor logic here
    setIsEditing(false);
  };

  return (
    <main className="bg-gray-50 min-h-screen">
      {/* Cover Image */}
      <div className="relative h-48 md:h-64 w-full bg-gray-200">
        <Image
          src={vendor?.coverImage}
          alt="Cover photo"
          fill
          className="object-cover"
        />
        {isEditing && (
          <div className="absolute bottom-4 right-4">
            <Button variant="outline" className="bg-white/90 backdrop-blur-sm">
              <Pencil className="h-4 w-4 mr-2" />
              Change Cover
            </Button>
          </div>
        )}
      </div>

      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        {/* Vendor Header */}
        <div className="flex flex-col md:flex-row gap-6 md:gap-8 -mt-12 relative z-10">
          {/* Logo/Avatar */}
          <div className="relative">
            <Avatar className="w-24 h-24 md:w-32 md:h-32 border-4 border-white bg-white shadow-lg">
              <AvatarImage
                src={logoPreview || vendor.logo}
                alt="Vendor logo"
                className="object-cover"
              />
              <AvatarFallback className="text-2xl">
                {vendor.displayName[0]}
              </AvatarFallback>
            </Avatar>
            
            {isEditing && (
              <label
                htmlFor="logo"
                className="absolute -bottom-2 -right-2 bg-green-600 rounded-full p-2 text-white border-2 border-white cursor-pointer hover:bg-green-700 transition-colors"
              >
                <Pencil className="h-4 w-4" />
                <input
                  type="file"
                  id="logo"
                  className="hidden"
                  accept=".jpg,.jpeg,.png"
                  onChange={handleLogoPreview}
                />
              </label>
            )}
          </div>

          {/* Vendor Info */}
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
                  {editableVendor.displayName}
                  {vendor.isVerified && (
                    <span className="text-green-600 flex items-center gap-1 text-sm">
                      <CheckCircle className="h-5 w-5" />
                      Verified
                    </span>
                  )}
                </h1>
                <div className="flex items-center gap-2 text-gray-600 mt-1">
                  <MapPin className="h-4 w-4" />
                  <span>{vendor.location.area}, {vendor.location.city}</span>
                </div>
              </div>

              <div className="flex gap-2">
                {!isEditing ? (
                  <Button onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit Profile
                  </Button>
                ) : (
                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setIsEditing(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" form="vendor-form">
                      Save Changes
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4 mt-4">
              <div className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-full">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>{vendor.rating} ({vendor.numReviews} reviews)</span>
              </div>
              <div className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-full">
                <ShoppingBag className="h-4 w-4 text-green-600" />
                <span>{vendor.numProducts} products</span>
              </div>
              <div className="flex items-center gap-1 text-sm bg-gray-100 px-3 py-1 rounded-full">
                <span>Member since {formatDate(vendor.joinDate)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About Section */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-600" />
                About This Vendor
              </h2>
              {isEditing ? (
                <textarea
                  value={editableVendor.description}
                  onChange={(e) =>
                    setEditableVendor({ ...editableVendor, description: e.target.value })
                  }
                  className="w-full min-h-[120px] border rounded-lg p-3"
                />
              ) : (
                <p className="text-gray-700">{vendor.description}</p>
              )}
            </div>

            {/* Business Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Business Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-gray-500" />
                    Location
                  </h3>
                  {isEditing ? (
                    <Input
                      value={editableVendor.contact.address}
                      onChange={(e) =>
                        setEditableVendor({
                          ...editableVendor,
                          contact: {
                            ...editableVendor.contact,
                            address: e.target.value,
                          },
                        })
                      }
                    />
                  ) : (
                    <p className="text-gray-600">{vendor.contact.address}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <span className="text-gray-500">🏢</span>
                    Business Type
                  </h3>
                  {isEditing ? (
                    <Input
                      value={editableVendor.businessType}
                      onChange={(e) =>
                        setEditableVendor({
                          ...editableVendor,
                          businessType: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-gray-600">{vendor.businessType}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <span className="text-gray-500">🕒</span>
                    Working Hours
                  </h3>
                  {isEditing ? (
                    <Input
                      value={editableVendor.contact.workingHours}
                      onChange={(e) =>
                        setEditableVendor({
                          ...editableVendor,
                          contact: {
                            ...editableVendor.contact,
                            workingHours: e.target.value,
                          },
                        })
                      }
                    />
                  ) : (
                    <p className="text-gray-600">{vendor.contact.workingHours}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <h3 className="font-medium flex items-center gap-2">
                    <span className="text-gray-500">👥</span>
                    Team Size
                  </h3>
                  {isEditing ? (
                    <Input
                      value={editableVendor.teamSize}
                      onChange={(e) =>
                        setEditableVendor({
                          ...editableVendor,
                          teamSize: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-gray-600">{vendor.teamSize}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Contact Information */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-gray-500" />
                  {isEditing ? (
                    <Input
                      value={editableVendor.contact.email}
                      onChange={(e) =>
                        setEditableVendor({
                          ...editableVendor,
                          contact: {
                            ...editableVendor.contact,
                            email: e.target.value,
                          },
                        })
                      }
                    />
                  ) : (
                    <span>{vendor.contact.email}</span>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-gray-500" />
                  {isEditing ? (
                    <Input
                      value={editableVendor.contact.phone}
                      onChange={(e) =>
                        setEditableVendor({
                          ...editableVendor,
                          contact: {
                            ...editableVendor.contact,
                            phone: e.target.value,
                          },
                        })
                      }
                    />
                  ) : (
                    <span>{vendor.contact.phone}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Vendor Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Vendor Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Rate</span>
                  <span className="font-medium">{vendor.responseRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time</span>
                  <span className="font-medium">{vendor.responseTime} hours</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Order Fulfillment</span>
                  <span className="font-medium">{vendor.fulfillmentRate}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Positive Reviews</span>
                  <span className="font-medium">{vendor.positiveReviews}%</span>
                </div>
              </div>
            </div>

            {/* Policies */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-4">Policies</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium flex items-center gap-2 mb-1">
                    <Truck className="h-5 w-5 text-gray-500" />
                    Shipping Policy
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={editableVendor.shippingPolicy}
                      onChange={(e) =>
                        setEditableVendor({
                          ...editableVendor,
                          shippingPolicy: e.target.value,
                        })
                      }
                      className="w-full min-h-[80px] border rounded-lg p-2 text-sm"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">{vendor.shippingPolicy}</p>
                  )}
                </div>
                <div>
                  <h3 className="font-medium flex items-center gap-2 mb-1">
                    <RefreshCw className="h-5 w-5 text-gray-500" />
                    Return Policy
                  </h3>
                  {isEditing ? (
                    <textarea
                      value={editableVendor.returnPolicy}
                      onChange={(e) =>
                        setEditableVendor({
                          ...editableVendor,
                          returnPolicy: e.target.value,
                        })
                      }
                      className="w-full min-h-[80px] border rounded-lg p-2 text-sm"
                    />
                  ) : (
                    <p className="text-gray-600 text-sm">{vendor.returnPolicy}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default VendorProfile;