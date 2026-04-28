import Link from "next/link";

import { Button } from "@/components/ui/button";

export function Navbar() {
  return (
    <header className="flex items-center justify-between gap-4 py-4">
      <Link className="text-lg font-semibold" href="/">
        निखरता रूप
      </Link>
      <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
        <Link href="/services">सेवाएं</Link>
        <Link href="/branches">ब्रांच</Link>
        <Link href="/blog">ब्लॉग</Link>
      </nav>
      <Button asChild>
        <Link href="/login">लॉगिन</Link>
      </Button>
    </header>
  );
}
