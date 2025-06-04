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
} from "lucide-react";
import { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@components/ui/card";
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

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size must be less than 5MB");
      return;
    }

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

  useEffect(() => {
    if (state) {
      if (state.success) {
        toast.success(state.message || "Profile updated successfully!");
        if (state.avatarUrl) {
          setAvatarPreview(null);
        }
        form.setValue("avatar", undefined);
      } else if (state.message) {
        toast.error(state.message);
      }
    }
  }, [state, form]);

  const watchedAvatar = form.watch("avatar");

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header Card */}
        <Card className="overflow-hidden border-0 shadow-lg bg-[#1B6013]">
          <CardContent className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative group">
                <Avatar className="w-24 h-24 md:w-32 md:h-32 ring-4 ring-white/20 shadow-xl">
                  <AvatarImage
                    className="w-full h-full object-cover"
                    src={avatarPreview || user?.avatar_url || undefined}
                  />
                  <AvatarFallback className="w-full h-full text-2xl md:text-3xl bg-white/10 text-white">
                    {user?.display_name[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute inset-0 bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="text-center md:text-left text-white">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  {user?.display_name}
                </h1>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
                  <Mail className="w-4 h-4" />
                  <span className="text-white/90">{user?.email}</span>
                </div>
                <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                  <User className="w-4 h-4" />
                  <span className="text-white/90 text-sm">
                    Member since {formatDate(user?.created_at || "")}
                  </span>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-white/20 text-white border-white/30"
                >
                  <Shield className="w-3 h-3 mr-1" />
                  {user?.role === "seller" ? "Seller" : "Buyer"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Profile Form Card */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="pb-6">
            <CardTitle className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <User className="w-6 h-6 text-[#1B6013]" />
              Personal Information
            </CardTitle>
            <p className="text-gray-600">
              Update your profile information and preferences
            </p>
          </CardHeader>

          <CardContent className="p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-8"
              >
                {/* Avatar Upload Section */}
                <div className="flex flex-col items-center gap-4 p-6 bg-gray-50 rounded-xl">
                  <div className="relative">
                    <Avatar className="w-20 h-20 ring-2 ring-[#1B6013]/20">
                      <AvatarImage
                        className="w-full h-full object-cover"
                        src={avatarPreview || user?.avatar_url || undefined}
                      />
                      <AvatarFallback className="text-xl bg-[#1B6013]/10 text-[#1B6013]">
                        {user?.display_name[0]}
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

                  {watchedAvatar instanceof File && (
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
                  )}

                  <p className="text-xs text-gray-500 text-center max-w-xs">
                    Upload a new profile picture. Max file size: 5MB. Supported
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
                      value={user.email}
                      readOnly
                      className="h-12 bg-gray-50 border-gray-200 text-gray-600 rounded-lg cursor-not-allowed"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Email cannot be changed
                    </p>
                  </FormItem>

                  {/* Phone */}
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                          <Phone className="w-4 h-4 text-[#1B6013]" />
                          Phone Number
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your phone number"
                            className="h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-lg"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Address */}
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-[#1B6013]" />
                          Address
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your address"
                            className="h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-lg"
                            value={field.value || ""}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Role Selection */}
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="max-w-md">
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#1B6013]" />
                        Account Type
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 border-gray-200 focus:border-[#1B6013] focus:ring-[#1B6013]/20 rounded-lg">
                            <SelectValue placeholder="Select your role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="buyer">
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              Buyer
                            </div>
                          </SelectItem>
                          <SelectItem value="seller">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4" />
                              Seller
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Form Errors */}
                {Object.keys(form.formState.errors).length > 0 && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="text-red-800 font-medium mb-2">
                      Please fix the following errors:
                    </h4>
                    <ul className="text-red-600 text-sm space-y-1">
                      {Object.values(form.formState.errors).map(
                        (error, index) => (
                          <li key={index} className="flex items-center gap-2">
                            <span className="w-1 h-1 bg-red-500 rounded-full"></span>
                            {error.message}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end pt-6 border-t border-gray-200">
                  <Button
                    type="submit"
                    disabled={pending || !form.formState.isValid}
                    className="bg-[#1B6013] hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {pending ? (
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;
