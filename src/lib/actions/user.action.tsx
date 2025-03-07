"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { formatError } from "src/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Get All Users
export async function getUsers() {
  try {
    const token = cookies().get("accessToken")?.value;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/user/all-users`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch users");
    return await response.json();
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}

// Get Single User
export async function getUserById(id: string) {
  try {
    const token = cookies().get("accessToken")?.value;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/user/get-user/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch user");
    return await response.json();
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}

// Update User Information
export async function updateUserInfo(userData: Record<string, any>) {
  try {
    const token = cookies().get("accessToken")?.value;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/user/update-information`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) throw new Error("Failed to update user information");
    return await response.json();
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}

// Update Specific User
export async function updateUser(id: string, userData: Record<string, any>) {
  try {
    const token = cookies().get("accessToken")?.value;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/user/update-user/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) throw new Error("Failed to update user");
    return await response.json();
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}

// Delete User
export async function deleteUser(id: string) {
  try {
    const token = cookies().get("accessToken")?.value;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/user/delete-user/${id}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to delete user");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}

// Get Seller Request
export async function getSellerRequest() {
  try {
    const token = cookies().get("accessToken")?.value;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/user/seller-review`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch seller requests");
    return await response.json();
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}

// Review Seller
export async function reviewSeller(id: string, reviewData: Record<string, any>) {
  try {
    const token = cookies().get("accessToken")?.value;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/user/seller-review?id=${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reviewData),
    });

    if (!response.ok) throw new Error("Failed to review seller");
    return await response.json();
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}
