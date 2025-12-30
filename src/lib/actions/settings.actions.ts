"use server";

import { createClient } from "@/utils/supabase/server";
import { supabaseAdmin } from "../supabaseAdmin";
import { StoreSettingsSchema } from "../validator";
import { z } from "zod";

export async function getStoreSettings() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("store_settings")
    .select("*")
    .order('updated_at', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
       // Result contains 0 rows
       // Create default settings WITHOUT specifying ID
       const defaultSettings = {
           open_time: '08:00',
           close_time: '18:00',
           closed_days: [],
           accept_orders_when_closed: true,
           is_store_enabled: true
       };
       // Use admin client to bypass RLS on insert
       const { data: newData, error: insertError } = await supabaseAdmin
         .from("store_settings")
         .insert(defaultSettings)
         .select()
         .single();
        
       if (insertError) {
         console.error("Error creating default settings:", insertError);
         return null;
       }
       return newData;
    }
    console.error("Error fetching store settings:", error);
    return null;
  }

  return data;
}

import { revalidatePath } from "next/cache";

// ... existing imports

// ... existing getStoreSettings ...

export async function updateStoreSettings(settings: z.infer<typeof StoreSettingsSchema>) {
  console.log("updateStoreSettings called with:", JSON.stringify(settings, null, 2));

  // Use admin client to bypass RLS on updates
  const { id, ...updates } = settings;
  const payload = {
    ...updates,
    updated_at: new Date().toISOString(),
  };

  let result;
  
  if (id) {
      console.log("Updating row with ID:", id);
      // If we have an ID, update that specific row
      result = await supabaseAdmin
        .from("store_settings")
        .update(payload)
        .eq("id", id)
        .select()
        .single();
        
      // Fallback: If row not found (e.g. deleted or bad ID), try insert
      if (result.error && result.error.code === 'PGRST116') {
          console.log("ID not found, inserting new row as fallback.");
           const { id: _, ...insertPayload } = payload as any;
           result = await supabaseAdmin
            .from("store_settings")
            .insert(insertPayload)
            .select()
            .single();
      }
  } else {
      console.log("No ID provided, performing singleton check...");
      // Fallback: Check if ANY row exists (Singleton pattern enforcement)
       const { data: existing, error: findError } = await supabaseAdmin.from("store_settings").select("id").limit(1).single();
       
       if (existing) {
           console.log("Found existing row ID:", existing.id);
           result = await supabaseAdmin
            .from("store_settings")
            .update(payload)
            .eq("id", existing.id)
            .select()
            .single();
       } else {
           console.log("No existing row found, inserting new row.");
           result = await supabaseAdmin
            .from("store_settings")
            .insert(payload)
            .select()
            .single();
       }
  }

  const { data, error } = result;

  if (error) {
      console.error("Database update error:", error);
      throw error;
  }
  
  console.log("Database update success:", data);

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
  
  return data;
}
