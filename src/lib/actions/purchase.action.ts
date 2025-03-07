"use server";

import { cookies } from "next/headers";
import { formatError } from "src/lib/utils";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Get All Purchases
export async function getAllPurchases() {
  try {
    const token = cookies().get("accessToken")?.value;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/purchase/get-all-purchases`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch purchases");
    return await response.json();
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}

// Update Purchase Status
export async function updatePurchaseStatus(id: string, body: Record<string, any>) {
  try {
    const token = cookies().get("accessToken")?.value;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/purchase/update-purchase-status/${id}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error("Failed to update purchase status");
    return await response.json();
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}

// Add Purchase
export async function addPurchase(body: Record<string, any>) {
  try {
    const token = cookies().get("accessToken")?.value;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/purchase/add-purchase`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) throw new Error("Failed to add purchase");
    return await response.json();
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}

// Get Voucher
export async function getVoucher(code: string) {
  try {
    const token = cookies().get("accessToken")?.value;
    if (!token) return null;

    const response = await fetch(`${API_BASE_URL}/voucher/get-voucher?code=${encodeURIComponent(code)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!response.ok) throw new Error("Failed to fetch voucher");
    return await response.json();
  } catch (error: any) {
    return { success: false, error: formatError(error.message) };
  }
}