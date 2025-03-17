"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@components/ui/avatar";
import { Pencil } from "lucide-react";
import Image from "next/image";
import { redirect } from "next/navigation";
import React, { useState } from "react";
import { updateUserInfo } from "src/lib/actions/user.action";
import { formatDate } from "src/lib/utils";
// import { formatDate } from "src/lib/utils";
import { UserData } from "src/types";

interface AppSidebarProps {
  user: UserData;
}

const Profile = ({ user }: AppSidebarProps) => {
  // if (!user) {
  //   redirect("/login?callbackUrl=/account");
  // }
  const [editableUser, setEditableUser] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  const handleAvatarPreview = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAvatar(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleEditProfile = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const updatedUser = {
      name: editableUser.name,
      email: editableUser.email,
      phone: editableUser.phone,
      address: editableUser.address,
      role: editableUser.role,
      status: editableUser.role === "seller" ? "inactive" : undefined,
    };

    const formData = new FormData();
    Object.entries(updatedUser).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, value.toString());
    });

    if (avatar) {
      formData.append("avatar", avatar);
    }

    await updateUserInfo(formData);
    setIsEditing(false);
  };

  return (
    <main>
      {/* <div className="flex justify-center items-center mx-auto">
        <Image
          src="/footerlogo.png"
          alt="logo"
          width={160}
          height={60}
          className="py-6 cursor-pointer"
        />
      </div> */}
      <div className=" border rounded-md p-4 flex flex-col mb-6 mx-6">
        <p className="font-semibold text-xl">{user?.name}</p>
        <p className="text-[#1B6013]">{user?.email}</p>
        <p className="text-xs text-gray-500">Joined {formatDate(user?.createdAt || "")}</p>
      </div>
      <div className="p-4 lg:p-8 borde rounded-md">
        <p className="font-semibold text-xl mb-4">Personal Details</p>
        <form className="flex flex-col gap-y-4" onSubmit={handleEditProfile}>
          {/* Avatar Section */}
          <div className="w-fit flex flex-col md:flex-row items-center gap-4 md:gap-6 p-4 relative">
            <Avatar className="w-24 h-24 md:w-32 md:h-32">
              <AvatarImage
                className="w-full h-full rounded-md object-cover"
                src={avatarPreview || user?.avatar?.url}
              />
              <AvatarFallback className="w-full h-full text-2xl md:text-3xl">
                {user?.name[0]}
              </AvatarFallback>
            </Avatar>

            {isEditing && (
              <div className="flex flex-col w-fit gap-2">
                <label
                  htmlFor="avatar"
                  className="bg-[#1B6013] cursor-pointer absolute right-[0.9rem] md:right-[2.3rem] bottom-[2.3rem] md:bottom-[1.8rem] rounded-full p-2 text-white border-white border-2"
                >
                  <Pencil className="size-4" />
                  {/* {user?.avatar?.url === "" ? "Choose Avatar" : "Change Avatar"} */}
                </label>
                <input
                  type="file"
                  id="avatar"
                  className="hidden"
                  accept=".jpg, .jpeg, .png"
                  onChange={handleAvatarPreview}
                />
              </div>
            )}
          </div>

          {/* Name & Email */}
          <div className="flex flex-col md:flex-row gap-4 lg:gap-20 p-4">
            <label
              htmlFor="name"
              className="w-full md:w-1/2 flex flex-col gap-y-1"
            >
              <span className="text-sm">Name</span>
              {isEditing ? (
                <input
                  type="text"
                  id="name"
                  value={editableUser.name}
                  onChange={(e) =>
                    setEditableUser({ ...editableUser, name: e.target.value })
                  }
                  className="border rounded-xl text-center py-3 text-lg"
                />
              ) : (
                <p className="border rounded-xl text-center py-3 bg-slate-50 text-lg">{editableUser?.name}</p>
              )}
            </label>

            <label
              htmlFor="email"
              className="w-full md:w-1/2 flex flex-col gap-y-1"
            >
              <span className="text-sm">Email</span>
              {isEditing ? (
                <input
                  type="email"
                  id="email"
                  value={editableUser?.email}
                  onChange={(e) =>
                    setEditableUser({ ...editableUser, email: e.target.value })
                  }
                  className="border rounded-xl text-center py-3 text-lg"
                />
              ) : (
                <p className="border rounded-xl text-center py-3 bg-slate-50 text-lg">{editableUser?.email}</p>
              )}
            </label>
          </div>

          {/* Phone, Address */}
          <div className="flex flex-col md:flex-row gap-4 lg:gap-20 px-4">
            <label
              htmlFor="phone"
              className="w-full md:w-1/2 flex flex-col gap-y-1"
            >
              <span className="text-sm">Phone</span>
              {isEditing ? (
                <input
                  type="text"
                  id="phone"
                  value={editableUser?.phone}
                  onChange={(e) =>
                    setEditableUser({ ...editableUser, phone: e.target.value })
                  }
                  className="border rounded-xl text-center py-3 text-lg"
                />
              ) : (
                <p className="border rounded-xl text-center py-3 bg-slate-50 text-lg">{editableUser?.phone}</p>
              )}
            </label>

            <label
              htmlFor="address"
              className="w-full md:w-1/2 flex flex-col gap-y-1"
            >
              <span className="text-sm">Address</span>
              {isEditing ? (
                <input
                  type="text"
                  id="address"
                  value={editableUser?.address}
                  onChange={(e) =>
                    setEditableUser({
                      ...editableUser,
                      address: e.target.value,
                    })
                  }
                  className="border rounded-xl text-center py-3 text-lg"
                />
              ) : (
                <p className=" border rounded-xl text-center py-3 bg-slate-50 text-lg">{editableUser?.address}</p>
              )}
            </label>
          </div>
          <label
            htmlFor="role"
            className="w-full md:w-1/2 flex flex-col gap-4 lg:gap-x-20 gap-y-1 px-4"
          >
            <span className="text-sm">Role</span>
            {isEditing ? (
              <select
                id="role"
                value={editableUser?.role}
                onChange={(e) =>
                  setEditableUser({
                    ...editableUser,
                    role: e.target.value as "buyer" | "seller",
                  })
                }
                className="border rounded-xl text-center py-3 text-lg"
              >
                <option value="buyer">Buyer</option>
                <option value="seller">Seller</option>
              </select>
            ) : (
              <p className="border rounded-xl text-center py-3 bg-slate-50 text-lg">{editableUser?.role}</p>
            )}
          </label>

          {/* Edit & Submit Buttons */}
          <div className="flex gap-2 p-4">
            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="py-2 rounded bg-[#1B6013] hover:bg-green-900 text-white transition-colors drop-shadow cursor-pointer text-sm  w-fit px-4"
              >
                Edit Details
              </button>
            ) : (
              <input
                type="submit"
                value="Update Profile"
                className="py-2 bg-[#1B6013] hover:bg-green-900 text-white transition-colors drop-shadow cursor-pointer text-sm w-fit px-4 rounded-md"
              />
            )}
          </div>
        </form>
      </div>
    </main>
  );
};

export default Profile;
