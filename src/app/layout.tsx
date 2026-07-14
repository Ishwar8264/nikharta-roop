// Load the global Tailwind stylesheet once from the root layout.
import "./globals.css";

// Render the shared document shell for every App Router route.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Keep global antialiasing while rendering each route inside the document body.
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
