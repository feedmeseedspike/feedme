"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { UserProfileSchema } from "src/lib/validator";
import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Pencil, Loader2 } from "lucide-react";
import { useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { updateUserInfo } from "src/lib/actions/user.action";
import { formatDate } from "src/lib/utils";
import { PublicUserData } from "src/types";
import { toast } from "sonner";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@components/ui/form";
import { Input } from "@components/ui/input";
import { z } from "zod";

interface AppSidebarProps {
  user: PublicUserData;
}

const Profile = ({ user }: AppSidebarProps) => {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [state, formAction] = useFormState(updateUserInfo, null);
  const { pending } = useFormStatus();

  const form = useForm({
    resolver: zodResolver(UserProfileSchema),
    defaultValues: {
      display_name: user.display_name,
      phone: user.phone || "",
      address: user.address || "",
      role: user.role,
      avatar: undefined,
    },
  });

  const handleAvatarPreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
      form.setValue("avatar", file);
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: z.infer<typeof UserProfileSchema>) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value instanceof File ? value : String(value));
      }
    });
    await formAction(formData);
  };

  if (state?.success) {
    toast.success(state.message || "Profile updated successfully!");
    if (state.avatarUrl) {
      setAvatarPreview(null);
    }
  } else if (state?.message) {
    toast.error(state.message);
  }

  return (
    <main>
      <div className="border rounded-md p-4 flex flex-col mb-6 md:mx-6">
        <p className="font-semibold text-xl">{user?.display_name}</p>
        <p className="text-[#1B6013]">{user?.email}</p>
        <p className="text-xs text-gray-500">
          Joined {formatDate(user?.created_at || "")}
        </p>
      </div>

      <div className="p-4 lg:p-8 border rounded-md md:mx-6">
        <p className="font-semibold text-xl mb-4">Personal Details</p>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
            {/* Avatar Section */}
            <div className="w-fit flex flex-col md:flex-row items-center gap-4 md:gap-6 p-4 relative">
              <Avatar className="w-24 h-24 md:w-32 md:h-32">
                <AvatarImage
                  className="w-full h-full rounded-md object-cover"
                  src={avatarPreview || user?.avatar_url || undefined}
                />
                <AvatarFallback className="w-full h-full text-2xl md:text-3xl">
                  {user?.display_name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col w-fit gap-2">
                <label
                  htmlFor="avatar"
                  className="bg-[#1B6013] cursor-pointer absolute right-[0.9rem] md:right-[2.3rem] bottom-[2.3rem] md:bottom-[1.8rem] rounded-full p-2 text-white border-white border-2"
                >
                  <Pencil className="size-4" />
                </label>
                <input
                  type="file"
                  id="avatar"
                  name="avatar"
                  className="hidden"
                  accept=".jpg,.jpeg,.png,.webp"
                  onChange={handleAvatarPreview}
                />
                {form.watch("avatar") && (
                  <p className="text-xs text-gray-500 mt-1">
                    Selected: {form.watch("avatar").name} (
                    {(form.watch("avatar").size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            </div>

            {/* Name & Email */}
            <div className="flex flex-col md:flex-row gap-4 lg:gap-20 p-4">
              <FormField
                control={form.control}
                name="display_name"
                render={({ field }) => (
                  <FormItem className="w-full md:w-1/2">
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your name"
                        className="border rounded-xl text-center py-3 text-lg"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="w-full md:w-1/2 flex flex-col gap-y-1">
                <FormLabel>Email</FormLabel>
                <Input
                  value={user.email}
                  readOnly
                  className="border rounded-xl text-center py-3 text-lg bg-slate-50"
                />
              </div>
            </div>

            {/* Phone, Address */}
            <div className="flex flex-col md:flex-row gap-4 lg:gap-20 px-4">
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem className="w-full md:w-1/2">
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your phone number"
                        className="border rounded-xl text-center py-3 text-lg"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                  <FormItem className="w-full md:w-1/2">
                    <FormLabel>Address</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your address"
                        className="border rounded-xl text-center py-3 text-lg"
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Role */}
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem className="w-full md:w-1/2 px-4">
                  <FormLabel>Role</FormLabel>
                  <FormControl>
                    <select
                      {...field}
                      className="border rounded-xl text-center py-3 text-lg w-full"
                    >
                      <option value="buyer">Buyer</option>
                      <option value="seller">Seller</option>
                    </select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Form Errors */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="text-red-500 text-sm p-4">
                {Object.values(form.formState.errors).map((error, index) => (
                  <p key={index}>{error.message}</p>
                ))}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-2 p-4">
              <button
                type="submit"
                disabled={pending || !form.formState.isValid}
                className={`py-2 bg-[#1B6013] hover:bg-green-900 text-white transition-colors drop-shadow cursor-pointer text-sm w-fit px-4 rounded-md ${
                  pending ? "opacity-50" : ""
                }`}
              >
                {pending ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Updating...
                  </div>
                ) : (
                  "Update Profile"
                )}
              </button>
            </div>
          </form>
        </Form>
      </div>
    </main>
  );
};

export default Profile;