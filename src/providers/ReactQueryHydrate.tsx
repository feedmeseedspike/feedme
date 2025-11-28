"use client";

import { HydrationBoundary, type DehydratedState } from "@tanstack/react-query";

interface ReactQueryHydrateProps {
  state: DehydratedState;
  children: React.ReactNode;
}

export const ReactQueryHydrate = ({
  state,
  children,
}: ReactQueryHydrateProps) => {
  return <HydrationBoundary state={state}>{children}</HydrationBoundary>;
};
