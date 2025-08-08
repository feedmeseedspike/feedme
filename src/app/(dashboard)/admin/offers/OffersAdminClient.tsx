'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Plus, Edit, Trash2, Eye, Users, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { getAllCategories } from 'src/lib/actions/product.actions';
import ReactSelect from 'react-select';
import { uploadProductImageAction } from '../products/add-new/actions';
import { toSlug } from 'src/lib/utils';

interface Offer {
  id: string;
  title: string;
  description: string;
  image_url: string;
  price_per_slot: number;
  total_slots: number;
  available_slots: number;
  weight_per_slot: string;
  start_date: string;
  end_date: string;
  category_id: string;
  categories?: { id: string; title: string };
  status: 'active' | 'inactive' | 'expired' | 'sold_out';
  created_at: string;
}

interface OfferFormData {
  title: string;
  description: string;
  image: File | null;
  price_per_slot: string;
  total_slots: string;
  weight_per_slot: string;
  end_date: string;
  category: { label: string; value: string } | null;
}

const fetchOffers = async (): Promise<{ offers: Offer[] }> => {
  const response = await fetch('/api/offers');
  if (!response.ok) {
    throw new Error('Failed to fetch offers');
  }
  return response.json();
};

const createOffer = async (offerData: OfferFormData) => {
  // 1. Upload image if provided
  let imageUrl = '';
  if (offerData.image) {
    try {
      // Upload using the same approach as products
      const formData = new FormData();
      formData.append('file', offerData.image);
      formData.append('bucketName', 'product-images'); // Use existing product-images bucket for now
      
      // Call the existing product image upload action that we know works
      imageUrl = await uploadProductImageAction(formData);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to upload offer image');
    }
  }

  // 2. Prepare offer data for DB using API instead of server action
  const cleanOfferData = {
    title: offerData.title,
    description: offerData.description,
    image_url: imageUrl,
    price_per_slot: parseFloat(offerData.price_per_slot),
    total_slots: parseInt(offerData.total_slots),
    available_slots: parseInt(offerData.total_slots), // Initially all slots are available
    weight_per_slot: offerData.weight_per_slot,
    end_date: offerData.end_date || null,
    category_id: offerData.category?.value || null,
  };

  // Use API endpoint instead of server action
  const response = await fetch('/api/offers', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cleanOfferData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to create offer');
  }
  
  return response.json();
};

const updateOffer = async ({ id, ...offerData }: { id: string } & Partial<OfferFormData>) => {
  // 1. Upload image if a new one is provided
  let imageUrl = undefined;
  if (offerData.image) {
    try {
      // Upload using the same approach as products
      const formData = new FormData();
      formData.append('file', offerData.image);
      formData.append('bucketName', 'product-images'); // Use existing product-images bucket for now
      
      imageUrl = await uploadProductImageAction(formData);
    } catch (err: any) {
      throw new Error(err.message || 'Failed to upload offer image');
    }
  }

  // 2. Prepare offer data for DB
  const cleanOfferData: any = {
    title: offerData.title,
    description: offerData.description,
    price_per_slot: offerData.price_per_slot ? parseFloat(offerData.price_per_slot) : undefined,
    total_slots: offerData.total_slots ? parseInt(offerData.total_slots) : undefined,
    weight_per_slot: offerData.weight_per_slot,
    end_date: offerData.end_date || null,
    category_id: offerData.category?.value || null,
  };

  // Only include image_url if a new image was uploaded
  if (imageUrl) {
    cleanOfferData.image_url = imageUrl;
  }

  // Remove undefined values
  Object.keys(cleanOfferData).forEach(key => {
    if (cleanOfferData[key] === undefined) {
      delete cleanOfferData[key];
    }
  });

  // Use API endpoint instead of server action
  const response = await fetch(`/api/offers/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cleanOfferData),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to update offer');
  }
  
  return response.json();
};

const deleteOffer = async (id: string) => {
  const response = await fetch(`/api/offers/${id}`, {
    method: 'DELETE',
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Failed to delete offer');
  }
  
  return response.json();
};


export default function OffersAdminClient() {
  const queryClient = useQueryClient();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingOffer, setEditingOffer] = useState<Offer | null>(null);
  const [categories, setCategories] = useState<{ label: string; value: string }[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState<OfferFormData>({
    title: '',
    description: '',
    image: null,
    price_per_slot: '',
    total_slots: '',
    weight_per_slot: '',
    end_date: '',
    category: null,
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-offers'],
    queryFn: fetchOffers,
  });

  // Fetch categories on component mount
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const allCategories = await getAllCategories();
        setCategories(
          (allCategories || []).map((cat: any) => ({
            label: cat.title,
            value: cat.id,
          }))
        );
      } catch (error) {
        console.error("Error loading categories:", error);
        toast.error("Failed to load categories");
      } finally {
        setLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  const createMutation = useMutation({
    mutationFn: createOffer,
    onSuccess: () => {
      toast.success('Offer created successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      setShowCreateForm(false);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: updateOffer,
    onSuccess: () => {
      toast.success('Offer updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
      setEditingOffer(null);
      resetForm();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteOffer,
    onSuccess: () => {
      toast.success('Offer deleted successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-offers'] });
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const offers = data?.offers || [];

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      image: null,
      price_per_slot: '',
      total_slots: '',
      weight_per_slot: '',
      end_date: '',
      category: null,
    });
    setImagePreview(null);
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.price_per_slot || !formData.total_slots) {
      toast.error('Please fill in all required fields');
      return;
    }

    if (editingOffer) {
      updateMutation.mutate({ id: editingOffer.id, ...formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (offer: Offer) => {
    setEditingOffer(offer);
    setFormData({
      title: offer.title,
      description: offer.description || '',
      image: null, // Don't set existing image as File
      price_per_slot: offer.price_per_slot.toString(),
      total_slots: offer.total_slots.toString(),
      weight_per_slot: offer.weight_per_slot || '',
      end_date: offer.end_date ? offer.end_date.split('T')[0] : '',
      category: offer.category_id ? categories.find(cat => cat.value === offer.category_id) || null : offer.categories ? categories.find(cat => cat.value === offer.categories?.id) || null : null,
    });
    setImagePreview(offer.image_url || null);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type.startsWith("image/") && file.size <= 5 * 1024 * 1024) {
      setFormData({ ...formData, image: file });
      setImagePreview(URL.createObjectURL(file));
    } else if (file) {
      toast.error("Please select a valid image file (max 5MB)");
    }
  };

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to delete this offer?')) {
      deleteMutation.mutate(id);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'sold_out':
        return 'bg-red-100 text-red-800';
      case 'expired':
        return 'bg-gray-100 text-gray-800';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Manage Offers</h1>
          <p className="text-gray-600">Create and manage special offers and group buying deals</p>
        </div>
        <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="w-4 h-4 mr-2" />
              New Offer
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingOffer ? 'Edit Offer' : 'Create New Offer'}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              {/* Title */}
              <div className="grid grid-cols-1 sm:grid-cols-9 gap-4">
                <Label className="text-sm font-medium col-span-2">
                  Title *
                </Label>
                <div className="col-span-7">
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g., Big bag of sweet tomatoes"
                  />
                </div>
              </div>
              
              {/* Category */}
              <div className="grid grid-cols-1 sm:grid-cols-9 gap-4">
                <Label className="text-sm font-medium col-span-2">
                  Category
                </Label>
                <div className="col-span-7">
                  <ReactSelect
                    options={categories}
                    value={formData.category}
                    isLoading={loadingCategories}
                    onChange={(selectedCategory) =>
                      setFormData({ ...formData, category: selectedCategory })
                    }
                    placeholder="Select category"
                    isClearable
                  />
                </div>
              </div>
              
              {/* Description */}
              <div className="grid grid-cols-1 sm:grid-cols-9 gap-4">
                <Label className="text-sm font-medium col-span-2">
                  Description
                </Label>
                <div className="col-span-7">
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the offer..."
                    rows={3}
                  />
                </div>
              </div>

              {/* Image Upload */}
              <div className="grid grid-cols-1 sm:grid-cols-9 gap-4">
                <Label className="text-sm font-medium col-span-2">
                  Image
                </Label>
                <div className="col-span-7">
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleImageUpload}
                    accept="image/*"
                    id="image-upload"
                  />
                  <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center justify-center size-[156px] border border-dashed rounded-lg cursor-pointer hover:bg-gray-50 bg-[#EBFFF3]"
                  >
                    <div className="text-[#61BB84] flex items-center gap-1 justify-center w-full h-full bg-[#ebfff8] px-3 py-[3px] rounded-[3.66px] font-semibold text-[10px]">
                      <Plus size={10} /> Upload
                    </div>
                  </label>
                  {imagePreview && (
                    <div className="mt-2 relative size-16">
                      <Image
                        src={imagePreview}
                        alt="Preview"
                        fill
                        className="rounded-lg object-cover"
                      />
                      <button
                        type="button"
                        className="absolute top-0 right-0 bg-white rounded-full py-[2px] px-2 shadow"
                        onClick={() => {
                          setFormData({ ...formData, image: null });
                          setImagePreview(null);
                        }}
                        aria-label="Remove image"
                      >
                        <span className="text-red-500 font-bold text-xs">X</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Price and Slots */}
              <div className="grid grid-cols-1 sm:grid-cols-9 gap-4">
                <Label className="text-sm font-medium col-span-2">
                  Price per Slot (₦) *
                </Label>
                <div className="col-span-3">
                  <Input
                    type="number"
                    value={formData.price_per_slot}
                    onChange={(e) => setFormData({ ...formData, price_per_slot: e.target.value })}
                    placeholder="6500"
                  />
                </div>
                <Label className="text-sm font-medium col-span-2 text-right">
                  Total Slots *
                </Label>
                <div className="col-span-2">
                  <Input
                    type="number"
                    value={formData.total_slots}
                    onChange={(e) => setFormData({ ...formData, total_slots: e.target.value })}
                    placeholder="10"
                  />
                </div>
              </div>
              
              {/* Weight and End Date */}
              <div className="grid grid-cols-1 sm:grid-cols-9 gap-4">
                <Label className="text-sm font-medium col-span-2">
                  Weight per Slot
                </Label>
                <div className="col-span-3">
                  <Input
                    value={formData.weight_per_slot}
                    onChange={(e) => setFormData({ ...formData, weight_per_slot: e.target.value })}
                    placeholder="10kg"
                  />
                </div>
                <Label className="text-sm font-medium col-span-2 text-right">
                  End Date
                </Label>
                <div className="col-span-2">
                  <Input
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                  />
                </div>
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setShowCreateForm(false);
                  setEditingOffer(null);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                className="flex-1"
                onClick={handleSubmit}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {createMutation.isPending || updateMutation.isPending ? 'Saving...' : (editingOffer ? 'Update' : 'Create')}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Offers Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Offers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div>Loading offers...</div>
          ) : offers.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No offers found. Create your first offer!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Offer</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Slots</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {offers.map((offer) => (
                    <TableRow key={offer.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {offer.image_url && (
                            <div className="relative w-12 h-12 rounded-lg overflow-hidden">
                              <Image
                                src={offer.image_url}
                                alt={offer.title}
                                fill
                                className="object-cover"
                                sizes="48px"
                              />
                            </div>
                          )}
                          <div>
                            <div className="font-medium">{offer.title}</div>
                            {(offer.categories?.title || offer.category_id) && (
                              <Badge variant="outline" className="text-xs capitalize">
                                {offer.categories?.title || offer.category_id}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">
                        {formatPrice(offer.price_per_slot)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {offer.available_slots}/{offer.total_slots}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(offer.status)}>
                          {offer.status.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(offer.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => window.open(`/offers/${toSlug(offer.title || '')}`, '_blank')}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              handleEdit(offer);
                              setShowCreateForm(true);
                            }}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDelete(offer.id)}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}