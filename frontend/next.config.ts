import type { NextConfig } from "next";

if (process.env.VERCEL === "1" && !process.env.NEXT_PUBLIC_API_URL) {
  throw new Error(
    "Define NEXT_PUBLIC_API_URL en Vercel con la URL pública del API de Railway.",
  );
}

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [],
    dangerouslyAllowSVG: true,
  },
};

export default nextConfig;
