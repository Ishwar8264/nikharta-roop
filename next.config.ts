import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep the familiar Springdoc URL without creating a conflicting app route.
  async redirects() {
    return [
      {
        source: "/swagger-ui.html",
        destination: "/swagger-ui",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
