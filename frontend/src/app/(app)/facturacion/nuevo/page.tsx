"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function NuevoReciboRedirectPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/facturacion");
  }, [router]);

  return null;
}
