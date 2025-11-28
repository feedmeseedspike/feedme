"use client";

import { useState } from "react";
import { Database } from "src/utils/database.types";
import Image from "next/image";
import { Button } from "@components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
import { Input } from "@components/ui/input";
import { Label } from "@components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@components/ui/dialog";
import { Textarea } from "@components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@components/ui/select";
import { useToast } from "src/hooks/useToast";
import {
  useCreateBlackFridayItemMutation,
  useDeleteBlackFridayItemMutation,
  useUpdateBlackFridayItemMutation,
} from "src/queries/black-friday";
import { useProductSearchQuery } from "src/queries/promotions";
import { Loader2, Plus, Trash2, Pencil } from "lucide-react";
import clsx from "clsx";

type BlackFridayItem = Database["public"]["Tables"]["black_friday_items"]["Row"] & {
  products?: Database["public"]["Tables"]["products"]["Row"] | null;
};

const statusOptions = ["draft", "scheduled", "active", "sold_out", "archived"];

const defaultFormState = {
  product_id: "",
  title: "",
  subtitle: "",
  badge_text: "Black Friday",
  description: "",
  image_url: "",
  old_price: "",
  new_price: "",
  available_slots: "",
  max_quantity_per_user: "",
  quantity_limit: "",
  start_at: "",
  end_at: "",
  status: "draft",
};

type FormState = typeof defaultFormState;

export default function BlackFridayManagerClient({
  items,
}: {
  items: BlackFridayItem[];
}) {
  const { showToast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [formState, setFormState] = useState<FormState>(defaultFormState);
  const [editingItem, setEditingItem] = useState<BlackFridayItem | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productPreview, setProductPreview] = useState<
    Database["public"]["Tables"]["products"]["Row"] | null
  >(null);
  const [itemPendingDelete, setItemPendingDelete] = useState<BlackFridayItem | null>(null);

  const { data: searchResults } = useProductSearchQuery(productSearch);

  const {
    mutateAsync: createItem,
    isPending: isCreating,
  } = useCreateBlackFridayItemMutation();
  const {
    mutateAsync: updateItem,
    isPending: isUpdating,
  } = useUpdateBlackFridayItemMutation();
  const {
    mutateAsync: deleteItem,
    isPending: isDeleting,
  } = useDeleteBlackFridayItemMutation();

  const resetForm = () => {
    setFormState(defaultFormState);
    setEditingItem(null);
    setProductPreview(null);
    setProductSearch("");
  };

  const openDialog = (item?: BlackFridayItem) => {
    if (item) {
      setFormState({
        product_id: item.product_id ?? "",
        title: item.title ?? "",
        subtitle: item.subtitle ?? "",
        badge_text: item.badge_text ?? "Black Friday",
        description: item.description ?? "",
        image_url: item.image_url ?? "",
        old_price: item.old_price?.toString() ?? "",
        new_price: item.new_price?.toString() ?? "",
        available_slots: item.available_slots?.toString() ?? "",
        max_quantity_per_user: item.max_quantity_per_user?.toString() ?? "",
        quantity_limit: item.quantity_limit?.toString() ?? "",
        start_at: item.start_at ?? "",
        end_at: item.end_at ?? "",
        status: item.status ?? "draft",
      });
      setProductPreview(item.products ?? null);
      setEditingItem(item);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectProduct = (product: Database["public"]["Tables"]["products"]["Row"]) => {
    setFormState((prev) => ({
      ...prev,
      product_id: product.id,
      title: prev.title || product.name || "",
      image_url: prev.image_url || (product.images?.[0] ?? ""),
    }));
    setProductPreview(product);
  };

  const parseNumber = (value: string) => {
    if (value === "" || value === null || value === undefined) return null;
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  };

  const handleSave = async () => {
    if (!formState.product_id) {
      showToast("Please select a product.", "error");
      return;
    }
    if (!formState.new_price) {
      showToast("Please provide a Black Friday price.", "error");
      return;
    }

    const payload: Database["public"]["Tables"]["black_friday_items"]["Insert"] = {
      product_id: formState.product_id,
      title: formState.title,
      subtitle: formState.subtitle || null,
      badge_text: formState.badge_text || null,
      description: formState.description || null,
      image_url: formState.image_url || null,
      old_price: parseNumber(formState.old_price),
      new_price: Number(formState.new_price),
      available_slots: parseNumber(formState.available_slots),
      max_quantity_per_user: parseNumber(formState.max_quantity_per_user),
      quantity_limit: parseNumber(formState.quantity_limit),
      start_at: formState.start_at || null,
      end_at: formState.end_at || null,
      status: formState.status as any,
    };

    try {
      if (editingItem) {
        await updateItem({ ...payload, id: editingItem.id });
        showToast("Black Friday item updated!", "success");
      } else {
        await createItem(payload);
        showToast("Black Friday item created!", "success");
      }
      closeDialog();
    } catch (error: any) {
      showToast(error.message || "Failed to save item.", "error");
    }
  };

  const handleDelete = async () => {
    if (!itemPendingDelete) return;
    try {
      await deleteItem(itemPendingDelete.id);
      showToast("Black Friday item deleted.", "success");
      setItemPendingDelete(null);
      setIsDeleteDialogOpen(false);
    } catch (error: any) {
      showToast(error.message || "Failed to delete item.", "error");
    }
  };

  const busy = isCreating || isUpdating;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold">Black Friday Offers</h2>
          <p className="text-sm text-muted-foreground">
            Manage products that appear on the /black-friday landing page.
          </p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="mr-2 size-4" />
          Add Black Friday Item
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {items.map((item) => (
          <Card
            key={item.id}
            className={clsx(
              "border",
              item.status !== "active" && "opacity-80 border-dashed"
            )}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">{item.title}</CardTitle>
              <span
                className={clsx(
                  "text-xs px-2 py-1 rounded-full capitalize",
                  item.status === "active"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-gray-100 text-gray-600"
                )}
              >
                {item.status}
              </span>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="relative h-40 w-full rounded-lg overflow-hidden bg-muted">
                {item.image_url ? (
                  <Image
                    src={item.image_url}
                    alt={item.title}
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Product: {item.products?.name ?? "Unknown"}
                </p>
                <p className="text-lg font-semibold text-green-700">
                  ₦{item.new_price.toLocaleString()}
                </p>
                {item.old_price && (
                  <p className="text-sm text-muted-foreground line-through">
                    ₦{item.old_price.toLocaleString()}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => openDialog(item)}
                >
                  <Pencil className="mr-1 size-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setItemPendingDelete(item);
                    setIsDeleteDialogOpen(true);
                  }}
                >
                  <Trash2 className="mr-1 size-4" />
                  Delete
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {items.length === 0 && (
          <div className="col-span-full rounded-lg border border-dashed p-8 text-center text-muted-foreground">
            No Black Friday items yet. Click “Add Black Friday Item” to create one.
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? "Edit Black Friday Item" : "Add Black Friday Item"}
            </DialogTitle>
            <DialogDescription>
              Configure pricing, availability, and scheduling for this promotion.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="product-search">Link Product</Label>
              <Input
                id="product-search"
                placeholder="Search products..."
                value={productSearch}
                onChange={(event) => setProductSearch(event.target.value)}
              />
              {productSearch && (
                <div className="max-h-40 overflow-y-auto rounded-md border">
                  {(searchResults ?? []).map((product) => (
                    <button
                      type="button"
                      key={product.id}
                      className={clsx(
                        "flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-muted",
                        formState.product_id === product.id && "bg-muted"
                      )}
                      onClick={() =>
                        handleSelectProduct(product as any)
                      }
                    >
                      <span>{product.name}</span>
                      <span className="text-xs text-muted-foreground">
                        ₦{product.price?.toLocaleString()}
                      </span>
                    </button>
                  ))}
                  {searchResults?.length === 0 && (
                    <p className="p-3 text-sm text-muted-foreground">
                      No products found.
                    </p>
                  )}
                </div>
              )}
              {productPreview && (
                <p className="text-xs text-muted-foreground">
                  Selected: {productPreview.name}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  name="title"
                  value={formState.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="subtitle">Subtitle</Label>
                <Input
                  id="subtitle"
                  name="subtitle"
                  value={formState.subtitle}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="badge_text">Badge Text</Label>
                <Input
                  id="badge_text"
                  name="badge_text"
                  value={formState.badge_text}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  name="image_url"
                  value={formState.image_url}
                  onChange={handleInputChange}
                  placeholder="https://..."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="old_price">Market Price</Label>
                <Input
                  id="old_price"
                  name="old_price"
                  type="number"
                  min="0"
                  value={formState.old_price}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new_price">Black Friday Price</Label>
                <Input
                  id="new_price"
                  name="new_price"
                  type="number"
                  min="0"
                  value={formState.new_price}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="available_slots">Available Units</Label>
                <Input
                  id="available_slots"
                  name="available_slots"
                  type="number"
                  min="0"
                  value={formState.available_slots}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="quantity_limit">Global Limit</Label>
                <Input
                  id="quantity_limit"
                  name="quantity_limit"
                  type="number"
                  min="0"
                  value={formState.quantity_limit}
                  onChange={handleInputChange}
                  placeholder="Optional overall cap"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max_quantity_per_user">Per User Limit</Label>
                <Input
                  id="max_quantity_per_user"
                  name="max_quantity_per_user"
                  type="number"
                  min="0"
                  value={formState.max_quantity_per_user}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_at">Start Time</Label>
                <Input
                  id="start_at"
                  name="start_at"
                  type="datetime-local"
                  value={formState.start_at ?? ""}
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_at">End Time</Label>
                <Input
                  id="end_at"
                  name="end_at"
                  type="datetime-local"
                  value={formState.end_at ?? ""}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                value={formState.description}
                onChange={handleInputChange}
                placeholder="Short note about this offer..."
              />
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={formState.status}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose status" />
                </SelectTrigger>
                <SelectContent>
                  {statusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={busy}>
              {busy ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Saving...
                </>
              ) : editingItem ? (
                "Save Changes"
              ) : (
                "Create"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Black Friday Item</DialogTitle>
            <DialogDescription>
              This action cannot be undone. The selected offer will be removed from the Black Friday page.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}



