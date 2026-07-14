// Register build-time CSS plugins used by the Next.js application.
const config = {
  plugins: {
    // Compile Tailwind imports into generated utilities during development and production builds.
    "@tailwindcss/postcss": {},
  },
};

// Export the configuration so Next.js can load it automatically.
export default config;
