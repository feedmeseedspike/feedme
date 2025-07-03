"use client";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UserProfileSchema } from "src/lib/validator";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import {
  Pencil,
  Loader2,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  Camera,
  // Calendar,
  Apple,
} from "lucide-react";
import { useState } from "react";
import { formatDate } from "src/lib/utils";
import { PublicUserData } from "src/types";
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
import { Badge } from "@components/ui/badge";
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
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { updateUserInfo } from "src/lib/actions/user.action";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";
import { cn } from "../../../lib/utils";
import { Calendar as ShadCalendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../../components/ui/popover";
import { getUserQuery } from "src/queries/auth";

interface AppSidebarProps {
  user: PublicUserData;
}

const isFile = (value: any): value is File => value instanceof File;

// Helper: convert MM-DD string to Date (use year 2000)
function mmddToDate(mmdd: string): Date | undefined {
  if (!mmdd) return undefined;
  const [month, day] = mmdd.split("-").map(Number);
  if (!month || !day) return undefined;
  return new Date(2000, month - 1, day);
}

// Helper: convert Date to MM-DD string
function dateToMMDD(date: Date | null | undefined): string | null {
  if (!date) return null;
  return `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

// Helper: format MM-DD as 'Month Day'
function formatMonthDay(mmdd: string | null | undefined): string {
  if (!mmdd) return "";
  const date = mmddToDate(mmdd);
  return date
    ? date.toLocaleDateString(undefined, { month: "long", day: "numeric" })
    : "";
}

const Profile = ({ user: initialUser }: AppSidebarProps) => {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { showToast } = useToast();

  const {
    data: user,
    isLoading,
    isError,
    error: userError,
  } = useQuery({
    ...getUserQuery(),
    staleTime: 1000 * 60 * 5,
  });

  const allowedRoles = [
    "customer",
    "vendor",
    "admin",
    "buyer",
    "seller",
  ] as const;
  const defaultRole = allowedRoles.includes(user?.role as any)
    ? (user?.role as (typeof allowedRoles)[number])
    : "customer";
  const form = useForm<z.infer<typeof UserProfileSchema>>({
    resolver: zodResolver(UserProfileSchema),
    mode: "all",
    values: {
      display_name: user?.display_name || "",
      role: defaultRole,
      avatar: user?.avatar_url ?? "",
      birthday:
        typeof user?.birthday === "string" && user?.birthday?.length === 5
          ? user.birthday
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
        // Invalidate queries to refresh data
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

  const watchedAvatar = form.watch("avatar");

  return (
    <div className="min-h-screen md:px-6">
      <div className="max-w-4xl mx-auto space-y-3">
        <div className="">
          <div className="pb-6 border-b border-gray-200 mb-3">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <User className="w-6 h-6 text-[#1B6013]" />
              Personal Information
            </h2>
            <p className="text-gray-600">
              Update your profile information and preferences
            </p>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Avatar Upload Section */}
              <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-xl">
                <div className="relative">
                  <Avatar className="w-20 h-20 ring-2 ring-[#1B6013]/20">
                    <AvatarImage
                      className="w-full h-full object-cover"
                      src={avatarPreview || user?.avatar_url || undefined}
                    />
                    <AvatarFallback className="text-xl bg-[#1B6013]/10 text-[#1B6013]">
                      {user?.display_name ? user.display_name[0] : "U"}
                    </AvatarFallback>
                  </Avatar>

                  <label
                    htmlFor="avatar"
                    className="absolute -bottom-2 -right-2 bg-[#1B6013] hover:bg-green-700 cursor-pointer rounded-full p-2 text-white shadow-lg transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
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

                {/* {isFile(watchedAvatar) && (
                  <div className="text-center">
                    <p className="text-sm text-gray-600">
                      Selected:{" "}
                      <span className="font-medium">
                        {watchedAvatar.name}
                      </span>
                    </p>
                    <p className="text-xs text-gray-500">
                      ({(watchedAvatar.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  </div>
                )} */}

                <p className="text-xs text-gray-500 text-center max-w-xs">
                  Upload a new profile picture. Max file size: 2MB. Supported
                  formats: JPG, PNG, WebP
                </p>
              </div>

              {/* Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Display Name */}
                <FormField
                  control={form.control}
                  name="display_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <User className="w-4 h-4 text-[#1B6013]" />
                        Full Name
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Enter your full name"
                          className="h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Email (Read-only) */}
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#1B6013]" />
                    Email Address
                  </FormLabel>
                  <Input
                    value={initialUser.email || ""}
                    readOnly
                    className="h-12 bg-gray-50 border-gray-200 text-gray-600 rounded-lg cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Email cannot be changed
                  </p>
                </FormItem>

                {/* Address (Link to Address Management Page)*/}
                <FormItem className="md:col-span-2">
                  <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-[#1B6013]" />
                    Addresses
                  </FormLabel>
                  <p className="text-gray-600 text-sm mb-2">
                    Manage your delivery addresses.
                  </p>
                  <Link href="/account/addresses">
                    <Button
                      variant="outline"
                      className="border-[#1B6013] text-[#1B6013] hover:bg-[#1B6013]/10"
                    >
                      Manage Addresses
                    </Button>
                  </Link>
                </FormItem>

                {/* Birthday Field */}
                <FormField
                  control={form.control}
                  name="birthday"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-[#1B6013]" />
                        Birthday (Month & Day Only)
                      </FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full justify-start text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {field.value ? (
                                formatMonthDay(field.value)
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <ShadCalendar
                            mode="single"
                            selected={mmddToDate(field.value ?? "")}
                            onSelect={(date) => {
                              field.onChange(dateToMMDD(date));
                            }}
                            initialFocus
                            captionLayout="dropdown"
                            startMonth={new Date(2000, 0)}
                            endMonth={new Date(2000, 11)}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Favorite Fruit Field */}
                <FormField
                  control={form.control}
                  name="favorite_fruit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <Apple className="w-4 h-4 text-[#1B6013]" />
                        Favorite Fruit
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="e.g., Apple, Banana"
                          className="h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-lg"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Role (Read-only for now, can be made editable later) */}
                <FormItem>
                  <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4 text-[#1B6013]" />
                    Account Type
                  </FormLabel>
                  <Input
                    value={user?.role || "customer"}
                    readOnly
                    className="h-12 bg-gray-50 border-gray-200 text-gray-600 rounded-lg cursor-not-allowed"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Account type cannot be changed from here
                  </p>
                </FormItem>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end pt-6 border-t border-gray-200">
                <Button
                  type="submit"
                  disabled={mutation.isPending || !form.formState.isValid}
                  className="bg-[#1B6013]/90 hover:bg-[#1B6013] text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {mutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Updating Profile...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Update Profile
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
