"use server";

import { cookies } from "next/headers";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

// Add to favorite
export async function addToFavorite(body: any) {
  const token = cookies().get("accessToken")?.value;

  const res = await fetch(`${BASE_URL}/favorite/add-to-favorite`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error("Failed to add to favorites");
  }

  return res.json();
}

// Get favorites
export async function getFavourites() {
  const token = cookies().get("accessToken")?.value;

  const res = await fetch(`${BASE_URL}/favorite/get-favorites`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-store", // Ensure fresh data
  });
  // console.log(res)

  if (!res.ok) {
    throw new Error("Failed to fetch favorites");
  }

  return res.json();
}


// Remove from favorite
export async function removeFromFavorite(id: string) {
  const token = cookies().get("accessToken")?.value;

  const res = await fetch(`${BASE_URL}/favorite/delete-from-favorite/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) {
    throw new Error("Failed to remove from favorites");
  }

  return res.json();
}
