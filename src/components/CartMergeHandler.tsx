"use client";

import { useEffect } from 'react';
import { useUpdateCartMutation } from 'src/queries/cart';
import { useUser } from 'src/hooks/useUser';

// This component is no longer needed - cart merging is handled directly in useAnonymousCart hook
export function CartMergeHandler() {
  return null;
}