"use client"

import { useEffect, useState } from "react";
import {createClient} from "@utils/supabase/client";
import { User, Session } from "@supabase/supabase-js";

interface SupabaseAuthUser {
  id: string;
}

export function useUser() {
  const [user, setUser] = useState<SupabaseAuthUser | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      setUser(data?.user as SupabaseAuthUser | null || null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: Session | null) => {
      setUser(session?.user as SupabaseAuthUser | null || null);
    });

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return user;
}