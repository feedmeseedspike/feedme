"use client";

import { useState, useEffect, useMemo } from "react";
import { SpinPrizeRow, createSpinPrize, updateSpinPrize, deleteSpinPrize } from "@/lib/actions/prize.actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Trash2, Edit, Plus, Link as LinkIcon, AlertCircle, Search } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PrizesClient({ initialPrizes, productsList }: { initialPrizes: SpinPrizeRow[], productsList: any[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<SpinPrizeRow | null>(null);
  const router = useRouter();

  const [formData, setFormData] = useState<Partial<SpinPrizeRow>>({});
  const [productSearch, setProductSearch] = useState("");
  const [quantity, setQuantity] = useState(1);
  
  const filteredProducts = useMemo(() => {
     if (!productSearch) return productsList;
     return productsList.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  }, [productsList, productSearch]);

  const selectedProduct = useMemo(() => {
      return productsList.find(p => p.id === formData.product_id);
  }, [productsList, formData.product_id]);

  const unitPrice = useMemo(() => {
      if (!selectedProduct) return 0;
      if (formData.sub_label && selectedProduct.options) {
          const opt = selectedProduct.options.find((o: any) => o.name === formData.sub_label);
          return opt ? opt.price : selectedProduct.price;
      }
      return selectedProduct.price;
  }, [selectedProduct, formData.sub_label, formData.product_id]);

  useEffect(() => {
      if (editingPrize) {
          // Attempt to deduce quantity? Hard without storing it. Default 1.
          setQuantity(1);
      }
  }, [editingPrize]);

  const handleEdit = (prize: SpinPrizeRow) => {
      setEditingPrize(prize);
      setFormData(prize);
      setProductSearch(""); 
      setQuantity(1); // Reset
      setIsOpen(true);
  };

  const handleAddNew = () => {
      setEditingPrize(null);
      setFormData({ 
          type: 'item', 
          color_bg: '#FFFFFF', 
          color_text: '#000000',
          probability: 0.05,
          value: 0
      });
      setProductSearch(""); 
      setQuantity(1);
      setIsOpen(true);
  };

  const handleDelete = async (id: string) => {
      if(!confirm("Delete this prize?")) return;
      await deleteSpinPrize(id);
      router.refresh();
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
          if (editingPrize) {
              await updateSpinPrize(editingPrize.id, formData);
          } else {
              await createSpinPrize(formData);
          }
          setIsOpen(false);
          router.refresh();
      } catch (err) {
          alert("Error saving prize");
          console.error(err);
      }
  };

  // Helper to update label/value based on quantity and product
  const updateFromProduct = (prod: any, qty: number, optionName?: string) => {
      let price = prod.price;
      let label = prod.name;
      let img = Array.isArray(prod.images) ? prod.images[0] : prod.images;

      if (optionName && prod.options) {
          const opt = prod.options.find((o: any) => o.name === optionName);
          if (opt) {
              price = opt.price;
              if (opt.image) img = opt.image;
              // Sub label holds option name, Label holds Product Name (or we can combine?)
              // Current logic: Label = Product, Sub = Option
          }
      }

      setFormData(prev => ({
          ...prev,
          product_id: prod.id,
          label: (qty > 1 ? `${qty}x ` : '') + label,
          sub_label: optionName || prev.sub_label,
          value: price * qty,
          image_url: img,
          type: 'item'
      }));
  };

  const handleProductSelect = (productId: string) => {
      if (!productId) {
          setFormData({ ...formData, product_id: undefined });
          return;
      }
      
      const product = productsList.find(p => p.id === productId);
      if (product) {
          setQuantity(1);
          setFormData(prev => ({
              ...prev,
              product_id: productId,
              sub_label: '', // Reset option
          }));
          // Trigger update with new product, qty 1, no option
          // But I can't call updateFromProduct easily due to closure / state sync issues with setFormData?
          // I'll set it directly.
          const img = Array.isArray(product.images) ? product.images[0] : product.images;
          setFormData(prev => ({
              ...prev,
              product_id: productId,
              label: product.name,
              value: product.price,
              sub_label: '',
              type: 'item',
              image_url: img
          }));
      }
  };
  
  const handleOptionSelect = (optionName: string) => {
      if (!selectedProduct) return;
      // Just update sub_label, let effect or explicit call handle price?
      // I'll explicit call logic
      const opt = selectedProduct.options?.find((o: any) => o.name === optionName);
      if (opt) {
          const price = opt.price;
          const img = opt.image || (Array.isArray(selectedProduct.images) ? selectedProduct.images[0] : selectedProduct.images);
          setFormData(prev => ({
              ...prev,
              sub_label: optionName,
              value: price * quantity,
              image_url: img
          }));
      }
  };

  const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const q = parseInt(e.target.value) || 1;
      setQuantity(q);
      
      if (selectedProduct) {
          // Recalculate value
          const price = unitPrice || selectedProduct.price; // fallback
          setFormData(prev => ({
              ...prev,
              value: price * q,
              label: (q > 1 ? `${q}x ` : '') + selectedProduct.name
          }));
      }
  };

  return (
      <div>
          <div className="flex justify-end mb-4">
              <Button onClick={handleAddNew}><Plus className="w-4 h-4 mr-2"/> Add Prize</Button>
          </div>

          <div className="border rounded-md">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Label / Product</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Value</TableHead>
                        <TableHead>Prob</TableHead>
                        <TableHead>New User?</TableHead>
                        <TableHead>Code</TableHead>
                        <TableHead>Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {initialPrizes.map((prize) => (
                        <TableRow key={prize.id}>
                            <TableCell>
                                <div className="font-medium">
                                    {prize.product ? (
                                        <span className="flex items-center gap-1 text-blue-600">
                                            <LinkIcon className="w-3 h-3"/> {prize.product.name}
                                        </span>
                                    ) : (
                                        prize.label
                                    )}
                                </div>
                                <span className="text-xs text-muted-foreground">{prize.sub_label || prize.product?.options ? "Option?" : ""}</span>
                            </TableCell>
                            <TableCell>{prize.type}</TableCell>
                            <TableCell>
                                {prize.product ? (
                                    <span title={`Live Price: ${prize.product.price}`}>
                                        {prize.product.price} <span className="text-xs text-muted-foreground">(Live)</span>
                                    </span>
                                ) : prize.value}
                            </TableCell>
                            <TableCell>{prize.probability}</TableCell>
                            <TableCell>
                                {prize.for_new_users_only ? (
                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-[10px] font-bold uppercase">YES</span>
                                ) : '-'}
                            </TableCell>
                            <TableCell>{prize.code || '-'}</TableCell>
                            <TableCell>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="ghost" onClick={() => handleEdit(prize)}><Edit className="w-4 h-4"/></Button>
                                    <Button size="icon" variant="destructive" onClick={() => handleDelete(prize.id)}><Trash2 className="w-4 h-4"/></Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
          </div>

          <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetContent className="overflow-y-auto w-[400px] sm:w-[540px]">
                  <SheetHeader>
                      <SheetTitle>{editingPrize ? 'Edit Prize' : 'New Prize'}</SheetTitle>
                  </SheetHeader>
                  <form onSubmit={handleSubmit} className="space-y-4 mt-4 pb-10">
                      
                      <div className="p-3 bg-slate-50 border rounded-md">
                          <Label className="mb-2 block font-semibold text-blue-800">1. Link to Product (Optional)</Label>
                          
                          <div className="relative mb-2">
                             <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                             <Input 
                                placeholder="Search product name..." 
                                className="pl-8" 
                                value={productSearch}
                                onChange={(e) => setProductSearch(e.target.value)}
                             />
                          </div>
                          
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.product_id || ''}
                            onChange={(e) => handleProductSelect(e.target.value)}
                          >
                              <option value="">-- Select Product --</option>
                              {filteredProducts.map(p => (
                                  <option key={p.id} value={p.id}>
                                      {p.name} (₦{p.price})
                                  </option>
                              ))}
                          </select>

                          <div className="flex gap-2 mt-2">
                              {selectedProduct && selectedProduct.options && selectedProduct.options.length > 0 && (
                                  <div className="flex-1">
                                      <Label className="text-xs text-blue-600 mb-1">Option (Variant)</Label>
                                      <select 
                                        className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs"
                                        onChange={(e) => handleOptionSelect(e.target.value)}
                                        value={formData.sub_label || ''}
                                      >
                                          <option value="">-- Base Product --</option>
                                          {selectedProduct.options.map((opt: any, i: number) => (
                                              <option key={i} value={opt.name}>
                                                  {opt.name} - ₦{opt.price}
                                              </option>
                                          ))}
                                      </select>
                                  </div>
                              )}
                              
                              {selectedProduct && (
                                  <div className="w-20">
                                      <Label className="text-xs text-blue-600 mb-1">Qty</Label>
                                      <Input 
                                        className="h-9 text-xs" 
                                        type="number" 
                                        min="1" 
                                        value={quantity} 
                                        onChange={handleQuantityChange} 
                                      />
                                  </div>
                              )}
                          </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Label</Label>
                            <Input value={formData.label || ''} onChange={e => setFormData({...formData, label: e.target.value})} required />
                        </div>
                        <div>
                            <Label>Sub Label</Label>
                            <Input value={formData.sub_label || ''} onChange={e => setFormData({...formData, sub_label: e.target.value})} />
                        </div>
                      </div>

                      <div>
                          <Label>Type</Label>
                          <select 
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            value={formData.type || 'item'}
                            onChange={e => setFormData({...formData, type: e.target.value as any})}
                          >
                              <option value="item">Item (Product)</option>
                              <option value="wallet_cash">Wallet Cash</option>
                              <option value="voucher_percent">Voucher %</option>
                              <option value="none">No Prize</option>
                          </select>
                      </div>

                      <div>
                          <Label>Value</Label>
                          <Input type="number" value={formData.value || 0} onChange={e => setFormData({...formData, value: Number(e.target.value)})} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label>Probability</Label>
                          <Input type="number" step="0.001" value={formData.probability || 0} onChange={e => setFormData({...formData, probability: Number(e.target.value)})} />
                        </div>
                        <div>
                             <Label>Slug</Label>
                             <Input value={formData.slug || ''} onChange={e => setFormData({...formData, slug: e.target.value})} placeholder="Auto-generated" />
                        </div>
                      </div>

                      <div>
                          <Label>Code</Label>
                          <Input value={formData.code || ''} placeholder="Auto-generated if empty" onChange={e => setFormData({...formData, code: e.target.value})} />
                      </div>

                      <div>
                          <Label className="flex items-center gap-2 cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={formData.for_new_users_only || false} 
                                onChange={e => setFormData({...formData, for_new_users_only: e.target.checked})} 
                                className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                              />
                              <span className="font-semibold text-sm">For New Users Only (100% Probability for 0-order users)</span>
                          </Label>
                      </div>

                      <div>
                          <Label>Image URL (Optional Override)</Label>
                          <Input value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} />
                      </div>
                      
                      <Button type="submit" className="w-full">{editingPrize ? 'Update' : 'Create'}</Button>
                  </form>
              </SheetContent>
          </Sheet>
      </div>
  );
}
