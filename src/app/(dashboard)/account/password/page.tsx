"use client"

import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

const Password = () => {
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const toggleVisibility = (field: "current" | "new" | "confirm") => {
    setShowPassword((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="p-6">
      <h2 className="text-lg font-semibold mb-4">Update Password</h2>

      {/* Current Password */}
      <div className="mb-4">
        <label className="block font-medium mb-1">Password *</label>
        <div className="relative">
          <input
            type={showPassword.current ? "text" : "password"}
            placeholder="Enter Password"
            className="w-full border rounded-full py-2 px-4 pr-10 focus:outline-none"
          />
          <button
            type="button"
            className="absolute right-3 top-[10px] text-gray-500"
            onClick={() => toggleVisibility("current")}
          >
            {showPassword.current ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
        <a href="#" className="text-green-800 text-sm mt-1 inline-block">
          Forgot Password?
        </a>
      </div>

      {/* New Password */}
      <div className="mb-4">
        <label className="block font-medium mb-1">New Password</label>
        <div className="relative">
          <input
            type={showPassword.new ? "text" : "password"}
            placeholder="Enter Password"
            className="w-full border rounded-full py-2 px-4 pr-10 focus:outline-none"
          />
          <button
            type="button"
            className="absolute right-3 top-[10px] text-gray-500"
            onClick={() => toggleVisibility("new")}
          >
            {showPassword.new ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Confirm New Password */}
      <div className="mb-6">
        <label className="block font-medium mb-1">Confirm New Password</label>
        <div className="relative">
          <input
            type={showPassword.confirm ? "text" : "password"}
            placeholder="Enter Password"
            className="w-full border rounded-full py-2 px-4 pr-10 focus:outline-none"
          />
          <button
            type="button"
            className="absolute right-3 top-[10px] text-gray-500"
            onClick={() => toggleVisibility("confirm")}
          >
            {showPassword.confirm ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>
      </div>

      {/* Submit Button */}
      <button className="w-fit bg-[#1B6013] text-white py-3 px-4 rounded-full hover:bg-green-800">
        Update Password
      </button>
    </div>
  );
};

export default Password;
