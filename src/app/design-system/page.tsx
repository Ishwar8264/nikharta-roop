import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Design system showcase.
 *
 * Why:
 * A single page that renders every token, type scale, and component keeps the
 * design language visible and reviewable. New contributors read this page
 * before touching any UI, and the page doubles as a regression check when a
 * token is renamed or a variant is removed.
 */
export default function DesignSystemPage() {
  return (
    <main className="min-h-screen bg-background">
      {/* ─── Header ─── */}
      <header className="sticky top-0 z-10 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div>
            <h1 className="font-heading text-2xl font-bold text-foreground">
              Nikharta Roop
            </h1>
            <p className="text-sm text-muted-foreground">
              Design System Reference
            </p>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-16 px-6 py-12">
        {/* ─── Typography ─── */}
        <section className="space-y-6">
          <SectionHeading
            title="Typography"
            description="Playfair Display (600/700) for headings, Inter for body."
          />
          <Card>
            <CardContent className="space-y-8 pt-6">
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Display — Playfair Display
                </Label>
                <h1 className="font-heading text-5xl font-bold tracking-tight">
                  The quick brown fox
                </h1>
                <h2 className="font-heading text-4xl font-bold tracking-tight">
                  The quick brown fox
                </h2>
                <h3 className="font-heading text-3xl font-semibold">
                  The quick brown fox
                </h3>
                <h4 className="font-heading text-2xl font-semibold">
                  The quick brown fox
                </h4>
                <h5 className="font-heading text-xl font-semibold">
                  The quick brown fox
                </h5>
                <h6 className="font-heading text-lg font-semibold">
                  The quick brown fox
                </h6>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Body — Inter
                </Label>
                <p className="text-lg">
                  Large body — The quick brown fox jumps over the lazy dog.
                </p>
                <p className="text-base">
                  Base body — The quick brown fox jumps over the lazy dog.
                </p>
                <p className="text-sm">
                  Small — The quick brown fox jumps over the lazy dog.
                </p>
                <p className="text-xs text-muted-foreground">
                  XSmall / muted — The quick brown fox jumps over the lazy dog.
                </p>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Weights
                </Label>
                <div className="space-y-1 text-base">
                  <p className="font-light">Light (300) — captions</p>
                  <p className="font-normal">Regular (400) — body</p>
                  <p className="font-medium">Medium (500) — emphasis</p>
                  <p className="font-semibold">Semi-Bold (600) — subheadings</p>
                  <p className="font-bold">Bold (700) — headings</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── Color Palette ─── */}
        <section className="space-y-6">
          <SectionHeading
            title="Color Palette"
            description="Brand and semantic tokens. All in OKLCH."
          />

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ColorSwatch
              name="Primary"
              token="bg-primary"
              textToken="text-primary-foreground"
              description="Warm rose — brand anchor"
            />
            <ColorSwatch
              name="Secondary"
              token="bg-secondary"
              textToken="text-secondary-foreground"
              description="Deep plum — depth"
            />
            <ColorSwatch
              name="Accent"
              token="bg-accent"
              textToken="text-accent-foreground"
              description="Warm gold — highlights"
            />
            <ColorSwatch
              name="Success"
              token="bg-success"
              textToken="text-success-foreground"
              description="Sage — confirmations"
            />
            <ColorSwatch
              name="Warning"
              token="bg-warning"
              textToken="text-warning-foreground"
              description="Amber — attention"
            />
            <ColorSwatch
              name="Info"
              token="bg-info"
              textToken="text-info-foreground"
              description="Warm teal — neutral info"
            />
            <ColorSwatch
              name="Destructive"
              token="bg-destructive"
              textToken="text-destructive-foreground"
              description="Clear red — errors"
            />
            <ColorSwatch
              name="Muted"
              token="bg-muted"
              textToken="text-muted-foreground"
              description="Soft cream — subdued UI"
            />
            <ColorSwatch
              name="Card"
              token="bg-card border border-border"
              textToken="text-card-foreground"
              description="Elevated surfaces"
            />
          </div>

          {/* ─── Salon-specific tokens ─── */}
          <div className="space-y-3">
            <Label className="text-xs uppercase tracking-wide text-muted-foreground">
              Salon-specific tokens
            </Label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <ColorSwatch
                name="Rating"
                token="bg-rating"
                textToken="text-foreground"
                description="5-star gold — review system"
              />
              <ColorSwatch
                name="Available"
                token="bg-available"
                textToken="text-foreground"
                description="Bookable slot in calendar"
              />
              <ColorSwatch
                name="Booked"
                token="bg-booked"
                textToken="text-foreground"
                description="Slot already taken"
              />
            </div>
          </div>
        </section>

        {/* ─── Buttons ─── */}
        <section className="space-y-6">
          <SectionHeading
            title="Buttons"
            description="Six variants × four sizes."
          />

          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Variants
                </Label>
                <div className="flex flex-wrap gap-3">
                  <Button>Default</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="link">Link</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  Sizes
                </Label>
                <div className="flex flex-wrap items-center gap-3">
                  <Button size="sm">Small</Button>
                  <Button size="default">Default</Button>
                  <Button size="lg">Large</Button>
                  <Button size="icon">⚙</Button>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                  States
                </Label>
                <div className="flex flex-wrap gap-3">
                  <Button>Enabled</Button>
                  <Button disabled>Disabled</Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── Badges ─── */}
        <section className="space-y-6">
          <SectionHeading title="Badges" description="Status and tags." />
          <Card>
            <CardContent className="flex flex-wrap gap-3 pt-6">
              <Badge>Default</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="outline">Outline</Badge>
              <Badge variant="destructive">Destructive</Badge>
            </CardContent>
          </Card>
        </section>

        {/* ─── Form Inputs ─── */}
        <section className="space-y-6">
          <SectionHeading
            title="Form Inputs"
            description="Inputs, labels, and states."
          />
          <Card className="max-w-lg">
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-2">
                <Label htmlFor="demo-name">Name</Label>
                <Input id="demo-name" placeholder="Enter your name" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-email">Email</Label>
                <Input
                  id="demo-email"
                  type="email"
                  placeholder="you@example.com"
                />
                <p className="text-xs text-muted-foreground">
                  We will never share your email.
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="demo-disabled">Disabled</Label>
                <Input id="demo-disabled" disabled placeholder="Disabled" />
              </div>
            </CardContent>
          </Card>
        </section>

        {/* ─── Cards ─── */}
        <section className="space-y-6">
          <SectionHeading title="Cards" description="Content containers." />
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Salon Card</CardTitle>
                <CardDescription>
                  Soft rounded edges, subtle border, warm surfaces.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Body content sits inside CardContent with comfortable spacing.
                </p>
              </CardContent>
              <CardFooter className="gap-2">
                <Button size="sm">Book now</Button>
                <Button size="sm" variant="outline">
                  View
                </Button>
              </CardFooter>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Booking Summary</CardTitle>
                <CardDescription>
                  Uses success / warning badges for status.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Status</span>
                  <Badge>Confirmed</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Services</span>
                  <span className="font-medium">Haircut + Beard</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Total</span>
                  <span className="font-heading text-lg font-semibold">
                    ₹ 799
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* ─── Avatars ─── */}
        <section className="space-y-6">
          <SectionHeading
            title="Avatars"
            description="User and staff identity."
          />
          <Card>
            <CardContent className="flex items-center gap-4 pt-6">
              <Avatar>
                <AvatarFallback className="bg-primary text-primary-foreground">
                  IK
                </AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback className="bg-secondary text-secondary-foreground">
                  SR
                </AvatarFallback>
              </Avatar>
              <Avatar>
                <AvatarFallback className="bg-accent text-accent-foreground">
                  MP
                </AvatarFallback>
              </Avatar>
            </CardContent>
          </Card>
        </section>

        {/* ─── Skeleton ─── */}
        <section className="space-y-6">
          <SectionHeading
            title="Skeleton"
            description="Loading placeholders."
          />
          <Card className="max-w-lg">
            <CardContent className="space-y-3 pt-6">
              <div className="flex items-center gap-3">
                <Skeleton className="h-10 w-10 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
              <Skeleton className="h-32 w-full" />
            </CardContent>
          </Card>
        </section>

        {/* ─── Radius Scale ─── */}
        <section className="space-y-6">
          <SectionHeading
            title="Radius Scale"
            description="Consistent corner rounding."
          />
          <Card>
            <CardContent className="flex flex-wrap items-end gap-4 pt-6">
              <RadiusBox label="sm" className="rounded-sm" bg="bg-primary" />
              <RadiusBox label="md" className="rounded-md" bg="bg-secondary" />
              <RadiusBox label="lg" className="rounded-lg" bg="bg-accent" />
              <RadiusBox label="xl" className="rounded-xl" bg="bg-success" />
              <RadiusBox label="2xl" className="rounded-2xl" bg="bg-info" />
              <RadiusBox
                label="full"
                className="rounded-full"
                bg="bg-destructive"
              />
            </CardContent>
          </Card>
        </section>

        {/* ─── Footer ─── */}
        <footer className="border-t border-border pt-8 text-center text-sm text-muted-foreground">
          Nikharta Roop Design System · {new Date().getFullYear()}
        </footer>
      </div>
    </main>
  );
}

/* ═══════════════════════════════════════════════════════════
   Helper Components (local to this page)
   ═══════════════════════════════════════════════════════════ */

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="space-y-1">
      <h2 className="font-heading text-2xl font-semibold tracking-tight">
        {title}
      </h2>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function ColorSwatch({
  name,
  token,
  textToken,
  description,
}: {
  name: string;
  token: string;
  textToken: string;
  description: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <div
        className={`flex h-24 items-end justify-between p-4 ${token} ${textToken}`}
      >
        <span className="font-heading text-lg font-semibold">{name}</span>
      </div>
      <div className="space-y-1 bg-card p-3">
        <p className="font-mono text-xs text-muted-foreground">{token}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

function RadiusBox({
  label,
  className,
  bg,
}: {
  label: string;
  className: string;
  bg: string;
}) {
  return (
    <div className="space-y-2 text-center">
      <div
        className={`flex h-16 w-16 items-center justify-center ${bg} ${className}`}
      >
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="text-xs text-muted-foreground">radius-{label}</p>
    </div>
  );
}
