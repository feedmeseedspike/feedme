"use client";

import { useRouter } from "next/navigation";
import { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@utils/supabase/client";
import { Session, AuthChangeEvent } from "@supabase/supabase-js";
import { useQueryClient } from "@tanstack/react-query";

interface SupabaseContextType {
  session: Session | null;
}

const SupabaseContext = createContext<SupabaseContextType | undefined>(
  undefined
);

export function SupabaseAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [session, setSession] = useState<Session | null>(null);
  const supabase = createClient();
  const queryClient = useQueryClient();

  useEffect(() => {
    supabase.auth
      .getSession()
      .then(({ data }: { data: { session: Session | null } }) => {
        setSession(data.session);
      });

    // Get the data object which contains the subscription
    const { data } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, session: Session | null) => {
        setSession(session);
        if (event === "SIGNED_IN" && session) {
          // Check if there's a 'code' parameter in the URL after sign-in
          const currentUrl = new URL(window.location.href);
          if (currentUrl.searchParams.has("code")) {
            // Remove the 'code' parameter and replace the URL in the browser history
            currentUrl.searchParams.delete("code");
            router.replace(currentUrl.toString());
          }
          // Invalidate the user query instead of refreshing the page
          queryClient.invalidateQueries({ queryKey: ["user"] });
        } else if (event === "SIGNED_OUT") {
          // Invalidate the user query instead of refreshing the page
          queryClient.invalidateQueries({ queryKey: ["user"] });
        }
      }
    );

    // Destructure the subscription from the data object
    const { subscription } = data;

    return () => {
      // Call unsubscribe on the subscription object
      subscription.unsubscribe();
    };
  }, [router, supabase, queryClient]);

  return (
    <SupabaseContext.Provider value={{ session }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabaseSession = () => {
  const context = useContext(SupabaseContext);
  if (context === undefined) {
    throw new Error(
      "useSupabaseSession must be used within a SupabaseAuthProvider"
    );
  }
  return context.session;
};

