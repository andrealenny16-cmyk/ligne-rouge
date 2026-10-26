"use client";

import { useEffect } from "react";
import { trackEvent } from "@/app/actions";

export default function ViewTracker({ productId }: { productId: string }) {
  useEffect(() => {
    void trackEvent("view_product", productId);
  }, [productId]);
  return null;
}
