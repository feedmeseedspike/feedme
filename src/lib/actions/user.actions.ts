"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

// Base API URL
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

//  Sign Up
export async function registerUser(userData: { name: string; email: string; password: string }) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/sign-up`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });

    if (!response.ok) throw new Error("Failed to register");
    return { success: true, message: "User registered successfully" };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

//  Sign In
export async function signInUser(credentials: { email: string; password: string }) {
  try {
    const response = await fetch(`${API_BASE_URL}/user/sign-in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data?.message || "Failed to sign in");

    // Store the token in cookies (HTTP only for security)
    cookies().set("accessToken", data.accessToken, { httpOnly: true });

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

//  Sign Out
export async function signOutUser() {
  cookies().delete("accessToken");
  revalidatePath("/"); // Refresh session-based UI
  return { success: true };
}

//  Get User Data (Persist Login)
export async function getUser() {
  try {
    const token = cookies().get("accessToken")?.value;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/user/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
