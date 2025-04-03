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

const initialPromos = [
  {
    id: 1,
    title: "Riverbite Discount",
    discount: "10% OFF",
    oldPrice: 6425,
    newPrice: 5850,
    bgColor: "#1B6013",
    imageUrl: "/images/riverbite.png",
    tag: "todays-deal",
  },
  {
    id: 2,
    title: "FeedMe Black Friday",
    discount: "BEST DEALS",
    bgColor: "#000000",
    imageUrl: "/images/fruits.png",
    countdown: 3 * 24 * 60 * 60,
    tag: "black-friday",
  },
  {
    id: 3,
    title: "100% Fresh Fruit",
    discount: "SUMMER SALE",
    extraDiscount: "64% OFF",
    bgColor: "#F0800F",
    imageUrl: "/images/lemon.png",
    tag: "fresh-fruits",
  },
];

export default function PromoCardsManager() {
  const [promos, setPromos] = useState(initialPromos);
  const [editingPromo, setEditingPromo] = useState<any>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSave = async () => {
    alert("Changes saved!");
  };

  const openDialog = (promo: any = {}) => {
    setEditingPromo(promo);
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setEditingPromo(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Promotional Cards</h2>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 h-4 w-4" /> Add New Promo
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {promos.map((promo) => (
          <Card key={promo.id} className="overflow-hidden">
            <div 
              className="h-40 relative" 
              style={{ backgroundColor: promo.bgColor }}
            >
              <Image
                src={promo.imageUrl}
                alt={promo.title}
                fill
                className="object-contain"
              />
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold text-lg">{promo.title}</h3>
              <p className="text-sm text-gray-500">{promo.discount}</p>
              {promo.oldPrice && (
                <p className="text-sm">
                  Price: <span className="line-through">${promo.oldPrice}</span> ${promo.newPrice}
                </p>
              )}
              {promo.extraDiscount && (
                <p className="text-sm">Extra discount: {promo.extraDiscount}</p>
              )}
              {promo.countdown !== undefined && (
                <p className="text-sm">Has countdown timer</p>
              )}
              <p className="text-sm">Tag: {promo.tag}</p>
              
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => openDialog(promo)}>
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  onClick={() => setPromos(promos.filter(p => p.id !== promo.id))}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md lg:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingPromo?.id ? "Edit Promo" : "Add New Promo"}
            </DialogTitle>
            <DialogDescription>
              Make changes to the promotional card here
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-2 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" defaultValue={editingPromo?.title || ""} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="discount">Discount Text</Label>
              <Input id="discount" defaultValue={editingPromo?.discount || ""} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="tag">Tag (URL path)</Label>
              <Input id="tag" defaultValue={editingPromo?.tag || ""} />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="bgColor">Background Color</Label>
              <Input 
                id="bgColor" 
                type="color" 
                defaultValue={editingPromo?.bgColor || "#1B6013"} 
                className="h-10 w-full cursor-pointer"
              />
            </div>
            
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="border-2 border-dashed border-gray-300 p-4 text-center rounded-lg">
                {editingPromo?.imageUrl ? (
                  <div className="relative h-40">
                    <Image
                      src={editingPromo.imageUrl}
                      alt="Promo image"
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
