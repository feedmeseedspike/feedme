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

const initialBanners = [
  {
    id: 1,
    imageUrl: "/banners/banner3.png",
    link: "#",
    active: true,
  },
  {
    id: 2,
    imageUrl: "/banners/banner4.png",
    link: "#",
    active: true,
  },
];

export default function HomeBannersManager() {
  const [banners, setBanners] = useState(initialBanners);
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
        <h2 className="text-2xl font-semibold">Home Page Banners</h2>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add New Banner
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {banners.map((banner) => (
          <Card key={banner.id} className="overflow-hidden">
            <div className="h-40 relative">
              <Image
                src={banner.imageUrl}
                alt="Banner"
                fill
                className="object-cover"
              />
            </div>
            <CardContent className="p-4">
              <p className="text-sm">Link: {banner.link || "None"}</p>
              <p className="text-sm">Status: {banner.active ? "Active" : "Inactive"}</p>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => openDialog(banner)}>
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setBanners(banners.filter(b => b.id !== banner.id))}
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
              {editingBanner?.id ? "Edit Banner" : "Add New Banner"}
            </DialogTitle>
            <DialogDescription>
              Make changes to the home page banner here
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link">Link URL (optional)</Label>
              <Input id="link" defaultValue={editingBanner?.link || ""} />
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
