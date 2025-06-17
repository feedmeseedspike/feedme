"use client"

import { useEffect, useState } from "react";
import { createClient } from "@utils/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Tables } from "src/utils/database.types";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { useSupabaseUser, useSupabaseSession } from "@components/supabase-auth-provider";

interface SupabaseAuthUser {
  id: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
}

export function useUser(initialUser?: Tables<"users"> | null) {
  const contextUser = useSupabaseUser();
  const contextSession = useSupabaseSession();

  const [user, setUser] = useState<Tables<"users"> | null>(initialUser || contextUser || null);
  const [session, setSession] = useState<Session | null>(contextSession || null);
  const [isLoading, setIsLoading] = useState(initialUser === undefined && contextUser === undefined);
  const supabase = createClient();
  const router = useRouter();
  const queryClient = useQueryClient();

  // console.log("useUser: Initial render state", { initialUser, contextUser, isLoading });

  useEffect(() => {
    setUser(contextUser || initialUser || null);
    setSession(contextSession || null);
    setIsLoading(initialUser === undefined && contextUser === undefined);
    // console.log("useUser: useEffect update", { contextUser, contextSession, initialUser, isLoading });
  }, [contextUser, contextSession, initialUser]);

  // console.log("useUser: Return state", { user, isLoading, session });
  return { user, isLoading, session };
}