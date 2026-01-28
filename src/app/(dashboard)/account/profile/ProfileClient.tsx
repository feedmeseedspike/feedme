"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UserProfileSchema } from "src/lib/validator";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Loader2 } from "lucide-react";
import { Icon } from "@iconify/react";
import { useState, useMemo } from "react";
import { useToast } from "src/hooks/useToast";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import { Button } from "@components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@components/ui/select";
import { z } from "zod";
import Link from "next/link";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUserInfo } from "src/lib/actions/user.action";
import { format, getDaysInMonth, setDate, setMonth, setYear } from "date-fns";
import { cn } from "@/lib/utils";

interface ProfileClientProps {
  user: any;
}

const ProfileClient = ({ user }: ProfileClientProps) => {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const form = useForm<z.infer<typeof UserProfileSchema>>({
    resolver: zodResolver(UserProfileSchema),
    mode: "all",
    values: {
      display_name: user?.display_name || "",
      role: user?.role || "customer",
      avatar: user?.avatar_url ?? undefined,
      birthday: user?.birthday
        ? format(new Date(user.birthday), "yyyy-MM-dd")
        : null,
      favorite_fruit: user?.favorite_fruit || "",
    },
  });

  const mutation = useMutation({
    mutationFn: async (data: z.infer<typeof UserProfileSchema>) => {
      const formData = new FormData();
      if (data.display_name !== undefined && data.display_name !== null) {
        formData.append("display_name", data.display_name);
      }
      if (data.role !== undefined && data.role !== null) {
        formData.append("role", data.role);
      }
      if (data.favorite_fruit !== undefined && data.favorite_fruit !== null) {
        formData.append("favorite_fruit", data.favorite_fruit);
      }
      if (data.birthday !== undefined) {
        formData.append(
          "birthday",
          data.birthday === null ? "" : data.birthday
        );
      }
      if (data.avatar !== undefined) {
        if (data.avatar instanceof File) {
          formData.append("avatar", data.avatar);
        } else if (data.avatar === null || data.avatar === "") {
          formData.append("avatar", "");
        } else if (typeof data.avatar === "string") {
          formData.append("avatar", data.avatar);
        }
      }
      return await updateUserInfo(null, formData);
    },
    onSuccess: (result) => {
      if (result?.success) {
        showToast(result.message || "Profile updated successfully!", "success");
        if (result.avatarUrl) {
          setAvatarPreview(null);
        }
        queryClient.invalidateQueries({ queryKey: ["user"] });
      } else if (result?.message) {
        showToast(result.message, "error");
      }
    },
    onError: (error) => {
      showToast(error.message || "Failed to update profile", "error");
    },
  });

  const handleAvatarPreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast("File size must be less than 5MB", "error");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
      form.setValue(
        "avatar",
        file as z.infer<typeof UserProfileSchema>["avatar"]
      );
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = (data: z.infer<typeof UserProfileSchema>) => {
    mutation.mutate(data);
  };

  // Helper logic for Birthday Selects
  const currentYear = new Date().getFullYear();
  // Generate years from current year down to 1920
  const years = useMemo(() => Array.from({ length: currentYear - 1920 + 1 }, (_, i) => (currentYear - i).toString()), [currentYear]);
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  return (
    <div className="min-h-screen md:px-6 py-6 font-sans">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          
          {/* Header Section */}
          <div className="border-b border-gray-100 px-8 py-6 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                Personal Information
              </h2>
              <p className="text-gray-500 text-sm mt-1">
                Manage your personal details and preferences.
              </p>
            </div>
          </div>

          {/* Loyalty Progress Section */}
          <div className="bg-gradient-to-br from-[#1B6013] to-[#2a8b1f] p-8 text-white">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Icon icon="solar:crown-minimalistic-bold-duotone" className="w-8 h-8 text-yellow-400" />
                  <h3 className="text-2xl font-bold">Loyalty Level</h3>
                </div>
                <p className="text-white/80 text-sm mb-4">
                  Earn points with every purchase. Higher levels unlock better rewards!
                </p>
                <div className="relative h-4 bg-white/20 rounded-full overflow-hidden mb-2">
                   {/* Progress Logic: Platinum = 10, Gold = 5, Silver = 3, Bronze = 1 */}
                   <div 
                    className="absolute inset-y-0 left-0 bg-yellow-400 transition-all duration-1000" 
                    style={{ width: `${Math.min(((user?.loyalty_points || 0) / 10) * 100, 100)}%` }}
                   ></div>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-white/60">
                    <span>Bronze (1)</span>
                    <span>Silver (3)</span>
                    <span>Gold (5)</span>
                    <span>Platinum (10)</span>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 text-center min-w-[140px]">
                <div className="text-3xl font-black text-yellow-400 mb-1">
                    {user?.loyalty_points || 0}
                </div>
                <div className="text-[10px] uppercase font-bold tracking-widest text-white/80">
                    Points Earned
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                
                {/* Profile Photo */}
                <div className="flex items-center gap-6">
                  <div className="relative group">
                    <Avatar className="w-20 h-20 ring-4 ring-gray-50">
                      <AvatarImage
                        className="w-full h-full object-cover"
                        src={avatarPreview || user?.avatar_url || undefined}
                      />
                      <AvatarFallback className="text-2xl bg-gray-100 text-gray-500 font-bold">
                        {user?.display_name ? user.display_name[0] : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <label
                      htmlFor="avatar"
                      className="absolute -bottom-1 -right-1 bg-white border border-gray-200 text-gray-600 hover:text-[#1B6013] hover:border-[#1B6013] cursor-pointer rounded-full p-1.5 shadow-sm transition-colors"
                    >
                      <Icon icon="solar:camera-bold-duotone" className="w-3.5 h-3.5" />
                    </label>
                    <input
                      type="file"
                      id="avatar"
                      name="avatar"
                      className="hidden"
                      accept=".jpg,.jpeg,.png,.webp"
                      onChange={handleAvatarPreview}
                    />
                  </div>
                  <div>
                     <h4 className="font-medium text-gray-900">Profile Picture</h4>
                     <p className="text-xs text-gray-500 mt-0.5">
                       JPG, PNG or WebP. Max 5MB.
                     </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* Name */}
                  <FormField
                    control={form.control}
                    name="display_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                          Full Name
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Your full name"
                            className="h-10 border-gray-200 focus:border-[#1B6013] focus:ring-0 rounded-lg text-sm"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Email */}
                  <FormItem>
                    <FormLabel className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                      Email Address
                    </FormLabel>
                    <Input
                      value={user?.email || ""}
                      readOnly
                      className="h-10 bg-gray-50 border-gray-200 text-gray-500 rounded-lg cursor-not-allowed text-sm focus-visible:ring-0"
                    />
                  </FormItem>

                  {/* Birthday - Custom Select Implementation */}
                  <FormField
                    control={form.control}
                    name="birthday"
                    render={({ field }) => {
                        const date = field.value ? new Date(field.value) : undefined;
                        const currentYearVal = date ? date.getFullYear().toString() : "";
                        const currentMonthVal = date ? (date.getMonth()).toString() : "";
                        const currentDayVal = date ? date.getDate().toString() : "";
                        const isBirthdaySet = !!user?.birthday;

                        const handleDateChange = (type: 'year' | 'month' | 'day', value: string) => {
                            if (isBirthdaySet) return;
                            let newDate = date ? new Date(date) : new Date(2000, 0, 1);
                            if (type === 'year') newDate = setYear(newDate, parseInt(value));
                            if (type === 'month') newDate = setMonth(newDate, parseInt(value));
                            if (type === 'day') newDate = setDate(newDate, parseInt(value));
                            field.onChange(format(newDate, "yyyy-MM-dd"));
                        };

                        return (
                        <FormItem className="col-span-1 md:col-span-2">
                          <FormLabel className="flex items-center gap-2 text-gray-700 text-sm font-medium mb-1.5 min-h-[20px]">
                            <Icon icon="solar:cake-bold-duotone" className="w-4 h-4 text-pink-500" />
                            Birthday
                            {isBirthdaySet && (
                                <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded border border-gray-200 font-normal ml-2">
                                    Locked
                                </span>
                            )}
                          </FormLabel>
                          <div className="flex flex-wrap gap-3">
                              {/* Month */}
                              <Select disabled={isBirthdaySet} value={currentMonthVal} onValueChange={(v) => handleDateChange('month', v)}>
                                <SelectTrigger className="w-[140px] h-10 border-gray-200 focus:ring-0 pl-3 text-left font-normal text-sm bg-gray-50/50 disabled:opacity-80 disabled:cursor-not-allowed">
                                  <SelectValue placeholder="Month" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                    {months.map((m, i) => (
                                        <SelectItem key={i} value={i.toString()}>{m}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>

                              {/* Day */}
                              <Select disabled={isBirthdaySet} value={currentDayVal} onValueChange={(v) => handleDateChange('day', v)}>
                                <SelectTrigger className="w-[80px] h-10 border-gray-200 focus:ring-0 pl-3 text-left font-normal text-sm bg-gray-50/50 disabled:opacity-80 disabled:cursor-not-allowed">
                                  <SelectValue placeholder="Day" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                    {Array.from({ length: getDaysInMonth(date || new Date()) }, (_, i) => (
                                        <SelectItem key={i + 1} value={(i + 1).toString()}>{i + 1}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>

                              {/* Year */}
                              <Select disabled={isBirthdaySet} value={currentYearVal} onValueChange={(v) => handleDateChange('year', v)}>
                                <SelectTrigger className="w-[100px] h-10 border-gray-200 focus:ring-0 pl-3 text-left font-normal text-sm bg-gray-50/50 disabled:opacity-80 disabled:cursor-not-allowed">
                                  <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-[200px] overflow-y-auto">
                                    {years.map((y) => (
                                        <SelectItem key={y} value={y}>{y}</SelectItem>
                                    ))}
                                </SelectContent>
                              </Select>
                          </div>
                          {isBirthdaySet && (
                              <p className="text-[11px] text-gray-400 mt-1 italic">
                                  Birthday cannot be changed once set. Contact support for updates.
                              </p>
                          )}
                          <FormMessage />
                        </FormItem>
                        );
                    }}
                  />

                  {/* Favorite Fruit */}
                  <FormField
                    control={form.control}
                    name="favorite_fruit"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2"> 
                        <FormLabel className="flex items-center gap-2 text-gray-700 text-sm font-medium">
                          Favorite Fruit
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g., Apple, Mango..."
                            className="h-10 border-gray-200 focus:border-[#1B6013] focus:ring-0 rounded-lg text-sm"
                          />
                        </FormControl>
                        <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                           <Icon icon="solar:stars-minimalistic-bold-duotone" className="w-3 h-3" />
                           We might sneak this into your next order as a gift! 🍎
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Delivery Addresses Link */}
                   <div className="md:col-span-2 flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-100">
                      <div className="flex items-center gap-3">
                         <div className="bg-white p-1.5 rounded-md border border-gray-100 shadow-sm text-gray-500">
                             <Icon icon="solar:map-point-bold-duotone" className="w-4 h-4" />
                         </div>
                         <div>
                            <h4 className="font-medium text-gray-900 text-sm">Delivery Addresses</h4>
                            <p className="text-xs text-gray-500">Manage your shipping locations.</p>
                         </div>
                      </div>
                      <Link href="/account/addresses">
                        <Button variant="outline" size="sm" className="h-8 text-xs bg-white border-gray-200 hover:text-[#1B6013] hover:border-[#1B6013]">
                           Manage
                        </Button>
                      </Link>
                   </div>

                </div>

                {/* Footer Actions */}
                <div className="pt-6 border-t border-gray-100 flex justify-end">
                  <Button
                    type="submit"
                    disabled={mutation.isPending || !form.formState.isValid}
                    className="bg-[#1B6013] hover:bg-[#154d10] text-white rounded-lg shadow-sm transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                  >
                    {mutation.isPending ? (
                      <div className="flex items-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Saving...
                      </div>
                    ) : (
                      "Save Changes"
                    )}
                  </Button>
                </div>

              </form>
            </Form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileClient;
