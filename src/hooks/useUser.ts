"use client"

import { useEffect, useState, useMemo } from "react";
import { createClient } from "@utils/supabase/client";
import { Session } from "@supabase/supabase-js";
import { Tables } from "src/utils/database.types";
import { useRouter } from "next/navigation";
import { useQueryClient, useQuery } from "@tanstack/react-query";
import { useSupabaseUser, useSupabaseSession } from "@components/supabase-auth-provider";
import { getUserQuery } from "src/queries/auth";

interface SupabaseAuthUser {
  id: string;
  display_name?: string;
  email?: string;
  avatar_url?: string;
}

export function useUser() {
  const contextUser = useSupabaseUser();
  const contextSession = useSupabaseSession();
  const queryClient = useQueryClient();

  const {
    data: userProfile,
    isLoading: isLoadingUserProfile,
    error: userProfileError,
  } = useQuery({ ...getUserQuery() });

  // Combine Supabase auth user with user profile data
  const user = useMemo(() => {
    if (userProfile) {
      return { ...userProfile, ...contextUser };
    } else if (contextUser) {
      return contextUser;
    }
    return null;
  }, [contextUser, userProfile]);

  const isLoading = !contextUser && isLoadingUserProfile;

  const session = contextSession;

  // Optionally add an effect to refetch user profile if contextUser changes, ensuring fresh data
  // However, `staleTime` and `invalidateQueries` should handle most cases.
  // useEffect(() => {
  //   if (contextUser?.id) {
  //     queryClient.invalidateQueries({ queryKey: ['user'] });
  //   }
  // }, [contextUser?.id, queryClient]);

  return { user, isLoading, session };
}