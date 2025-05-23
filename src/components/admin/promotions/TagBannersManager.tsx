"use client";

import { Button } from "@components/ui/button";
import { Card, CardContent } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import { useState } from "react";
import Image from "next/image";
import { Trash2, Plus, Upload } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";

const initialTagBanners = [
  {
    id: 1,
    tag: "black-friday",
    title: "Black Friday Mega Sale!",
    subtitle: "Up to 70% OFF - Limited Time",
    imageUrl: "/images/fruits.png",
    bgColor: "#000000",
  },
  {
    id: 2,
    tag: "todays-deal",
    title: "Today's Hot Deals",
    subtitle: "Fresh discounts updated daily",
    imageUrl: "/images/riverbite.png",
    bgColor: "#1B6013",
  },
  {
    id: 3,
    tag: "fresh-fruits",
    title: "100% Fresh Fruits",
    subtitle: "Summer Special: 64% OFF",
    imageUrl: "/images/fruits-banner.jpg",
    bgColor: "#F0800F",
  },
];

export default function TagBannersManager() {
  const [tagBanners, setTagBanners] = useState(initialTagBanners);
  const [editingBanner, setEditingBanner] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
 
  const handleSave = async () => {
    alert("Changes saved!");
  };

  const openDialog = (banner: any = {}) => {
    setEditingBanner(banner);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Tag Page Banners</h2>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add New Tag Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tagBanners.map((banner) => (
          <Card key={banner.id} className="overflow-hidden">
            <div 
              className="h-40 relative" 
              style={{ backgroundColor: banner.bgColor }}
            >
              <Image
                src={banner.imageUrl}
                alt={banner.title}
                fill
                className="object-contain"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg">{banner.title}</h3>
              <p className="text-sm text-gray-500">{banner.subtitle}</p>
              <p className="text-sm">Tag: {banner.tag}</p>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => openDialog(banner)}>
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setTagBanners(tagBanners.filter(b => b.id !== banner.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingBanner?.id ? "Edit Tag Banner" : "Add New Tag Banner"}
            </DialogTitle>
            <DialogDescription>
              Make changes to the tag page banner here
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tag">Tag (URL path)</Label>
              <Input id="tag" defaultValue={editingBanner?.tag || ""} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" defaultValue={editingBanner?.title || ""} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="subtitle">Subtitle</Label>
              <Input id="subtitle" defaultValue={editingBanner?.subtitle || ""} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bgColor">Background Color</Label>
              <Input 
                id="bgColor" 
                type="color" 
                defaultValue={editingBanner?.bgColor || "#1B6013"} 
                className="h-10 w-full cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Banner Image</Label>
              <div className="border-2 border-dashed border-gray-300 p-4 text-center rounded-lg">
                {editingBanner?.imageUrl ? (
                  <div className="relative h-40">
                    <Image
                      src={editingBanner.imageUrl}
                      alt="Banner image"
                      fill
                      className="object-contain"
                    />
                  </div>
                ) : (
                  <div className="py-4">
                    <Upload className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500">Click to upload or drag and drop</p>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className="flex justify-end">
        <Button onClick={handleSave}>Save All Changes</Button>
      </div>
    </div>
  );
}
