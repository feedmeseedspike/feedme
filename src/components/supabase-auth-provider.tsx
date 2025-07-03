"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@utils/supabase/client";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";
import { Tables } from "src/utils/database.types";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "src/components/ui/dialog";
import { linkAuthUserToProfile } from "src/utils/users";

interface SupabaseContextType {
  session: Session | null;
  user: Tables<"profiles"> | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined
);

export function SupabaseAuthProvider({
  children,
  initialSession,
  initialUser,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
  initialUser: Tables<"profiles"> | null;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(initialSession);
  const [user, setUser] = useState<Tables<"profiles"> | null>(initialUser);
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    // If initialSession is NOT provided, fetch authenticated user and session client-side
    if (initialSession === undefined) {
      const fetchUserAndSession = async () => {
        const {
          data: { user: authenticatedUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error(
            "SupabaseAuthProvider: Error fetching initial authenticated user:",
            authError
          );
          setSession(null);
          setUser(null);
          return;
        }

        setSession(null); // Don't use session from getSession, just set to null or use user presence

        if (authenticatedUser && authenticatedUser.id) {
          const { data: userProfile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", authenticatedUser.id)
            .single();

          if (profileError) {
            console.error(
              "SupabaseAuthProvider: Error fetching initial user profile:",
              profileError
            );
            setUser(null);
          } else {
            setUser(userProfile);
          }
        } else {
          setUser(null);
        }
      };
      fetchUserAndSession();
    }

    const { data } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, newSession: Session | null) => {
        // Always use getUser() for authenticated user data after an auth change
        const {
          data: { user: authenticatedUser },
          error: authError,
        } = await supabase.auth.getUser();

        if (authError) {
          console.error(
            "SupabaseAuthProvider: Error fetching authenticated user on auth change:",
            authError
          );
          setSession(null);
          setUser(null);
          return;
        }

        setSession(null); // Don't use session from getSession, just set to null or use user presence

        if (authenticatedUser && authenticatedUser.id) {
          const { data: userProfile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("user_id", authenticatedUser.id)
            .single();

          if (profileError) {
            console.error(
              "SupabaseAuthProvider: Error fetching user profile on auth change:",
              profileError
            );
            setUser(null);
          } else {
            setUser(userProfile);
          }
        } else {
          setUser(null);
        }

        if (event === "SIGNED_IN" || event === "SIGNED_OUT") {
          queryClient.invalidateQueries({ queryKey: ["user"] });
        }
      }
    );

    const { subscription } = data;

    return () => {
      subscription.unsubscribe();
    };
  }, [router, supabase, queryClient, initialSession]);

  return (
    <SupabaseContext.Provider value={{ session, user }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabaseSession = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    return null;
  }
  return context.session;
};

export const useSupabaseUser = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    return null;
  }
  return context.user;
};
