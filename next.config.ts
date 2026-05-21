/**
 * Purpose: Next.js runtime configuration for the Nikharta Roop app.
 * Responsibilities: declare image optimization sources used by maps and uploaded media.
 * Important notes: Cloudinary image URLs are stored dynamically, so the shared host is allowed.
 */
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/staticmap",
        protocol: "https",
      },
      {
        hostname: "res.cloudinary.com",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
