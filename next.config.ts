import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        hostname: "maps.googleapis.com",
        pathname: "/maps/api/staticmap",
        protocol: "https",
      },
    ],
  },
};

export default nextConfig;
