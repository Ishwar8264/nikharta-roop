// Load focused icons that communicate salon services and interface actions.
import {
  ArrowRight,
  BadgeCheck,
  CalendarDays,
  Check,
  Clock3,
  Heart,
  MapPin,
  Scissors,
  Sparkles,
  Star,
  SwatchBook,
  Type,
  WandSparkles,
} from "lucide-react";
// Load the shared icon component type for strict service configuration.
import type { LucideIcon } from "lucide-react";
// Load the reusable private navbar instead of keeping page-local navigation.
import { PrivateNavbar } from "@/src/components/navigation/private-navbar";
// Load the metadata type for a strict page-level search preview declaration.
import type { Metadata } from "next";

// Describe the showcase route when it appears in browser and search previews.
export const metadata: Metadata = {
  // Explain that this route documents the complete salon visual system.
  description:
    "Explore the Nikharta Roop salon colors, typography, components, and booking patterns.",
  // Give the showcase a specific title while retaining the salon identity.
  title: "Salon Design System | Nikharta Roop",
};

// Describe one semantic color example shown in the brand palette section.
type BrandSwatch = {
  // Store the Tailwind surface class that follows the active theme.
  className: string;
  // Show the light and dark reference values without treating hex as component API.
  colorReference: string;
  // Give the semantic token a human-readable brand name.
  label: string;
  // Explain where the color should be used across the product.
  usage: string;
};

// Describe one salon service card rendered from shared presentation data.
type Service = {
  // Keep the short service explanation consistent across cards.
  description: string;
  // Pair each service with one recognizable decorative icon.
  icon: LucideIcon;
  // Show a simple starting price for the pricing pattern demo.
  price: string;
  // Display the customer-facing service name.
  title: string;
};

// Keep the complete semantic palette in one maintainable demo configuration.
const BRAND_SWATCHES: BrandSwatch[] = [
  // Demonstrate the adaptive page canvas in both supported themes.
  {
    className: "bg-background",
    colorReference: "#FFF9F6 / #1B1116",
    label: "Background",
    usage: "Main canvas",
  },
  // Demonstrate the elevated card surface used throughout the interface.
  {
    className: "bg-card",
    colorReference: "#FFFFFF / #281820",
    label: "Surface",
    usage: "Cards and forms",
  },
  // Demonstrate the signature action color used for bookings.
  {
    className: "bg-primary",
    colorReference: "#7A214D / #E7A1B8",
    label: "Primary",
    usage: "Booking actions",
  },
  // Demonstrate the softer rose used for secondary emphasis.
  {
    className: "bg-brand-rose",
    colorReference: "#D7A2A9 / #B86D86",
    label: "Dusty rose",
    usage: "Highlights",
  },
  // Demonstrate champagne gold as a limited premium accent.
  {
    className: "bg-brand-gold",
    colorReference: "#B78A46 / #D7AE72",
    label: "Champagne",
    usage: "Premium details",
  },
  // Demonstrate the high-contrast text color as a visual swatch.
  {
    className: "bg-foreground",
    colorReference: "#291B22 / #FFF7F3",
    label: "Foreground",
    usage: "Readable text",
  },
];

// Keep sample services declarative so every card shares one visual pattern.
const SERVICES: Service[] = [
  // Represent the salon's core hair styling experience.
  {
    description: "Consultation-led cut, finish, and styling designed around you.",
    icon: Scissors,
    price: "₹699",
    title: "Signature Hair",
  },
  // Represent premium skin services with a softer visual cue.
  {
    description: "A calming facial ritual focused on hydration and natural glow.",
    icon: Sparkles,
    price: "₹1,299",
    title: "Radiance Facial",
  },
  // Represent event-ready beauty packages without adding another card pattern.
  {
    description: "Personalized makeup and styling for your most important moments.",
    icon: WandSparkles,
    price: "₹2,499",
    title: "Occasion Ready",
  },
];

// Keep sample booking times reusable and separate from rendered button markup.
const BOOKING_TIMES = ["10:30 AM", "12:00 PM", "2:30 PM", "5:00 PM"];

// Describe the shared heading props used by every design-system section.
type SectionHeadingProps = {
  // Provide optional supporting copy when the section needs guidance.
  description?: string;
  // Show a compact uppercase category above the main heading.
  eyebrow: string;
  // Give each section one clear editorial heading.
  title: string;
};

// Render one consistent introduction for each design-system section.
function SectionHeading({
  description,
  eyebrow,
  title,
}: SectionHeadingProps) {
  // Keep section hierarchy consistent without repeating complex markup.
  return (
    <div className="max-w-2xl">
      {/* Use the sans face for compact category labels. */}
      <p className="text-primary text-xs font-bold tracking-[0.2em] uppercase">
        {eyebrow}
      </p>
      {/* Use the display face only where editorial personality adds value. */}
      <h2 className="font-display mt-3 text-3xl leading-tight font-semibold tracking-[-0.025em] text-balance sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {/* Render supporting copy only when the caller provides it. */}
      {description ? (
        <p className="text-muted-foreground mt-4 max-w-[62ch] text-base leading-7 sm:text-lg">
          {description}
        </p>
      ) : null}
    </div>
  );
}

// Render one theme-aware color token with its intended usage.
function ColorSwatch({
  className,
  colorReference,
  label,
  usage,
}: BrandSwatch) {
  // Keep color documentation and its live token preview together.
  return (
    <article className="overflow-hidden rounded-2xl border border-border bg-card text-card-foreground shadow-sm">
      {/* Preview the actual semantic class so the swatch responds to theme changes. */}
      <div className={`h-28 border-b border-border ${className}`} />
      {/* Explain the color role beneath its live preview. */}
      <div className="p-4">
        {/* Pair the token name and usage on one scannable row. */}
        <div className="flex items-start justify-between gap-3">
          {/* Keep the brand-facing name prominent. */}
          <h3 className="font-semibold">{label}</h3>
          {/* Keep implementation context secondary to the semantic name. */}
          <span className="text-muted-foreground text-right text-xs">
            {usage}
          </span>
        </div>
        {/* Document both approved theme values for future implementation work. */}
        <p className="text-muted-foreground mt-2 font-mono text-xs">
          {colorReference}
        </p>
      </div>
    </article>
  );
}

// Render one reusable salon service card from the shared configuration.
function ServiceCard({ description, icon: Icon, price, title }: Service) {
  // Keep all services visually consistent while allowing their content to vary.
  return (
    <article className="group rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-salon sm:p-7">
      {/* Pair the service icon with a subtle premium badge treatment. */}
      <div className="flex items-start justify-between gap-4">
        {/* Keep the decorative icon visible without overwhelming the heading. */}
        <span className="flex size-12 items-center justify-center rounded-2xl bg-surface-soft text-primary">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        {/* Mark the showcased treatments as customer favorites. */}
        <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">
          <Star aria-hidden="true" className="size-3 fill-current" />
          Popular
        </span>
      </div>
      {/* Present the service name with the editorial display face. */}
      <h3 className="font-display mt-8 text-2xl font-semibold tracking-[-0.02em]">
        {title}
      </h3>
      {/* Keep descriptions readable and visually quieter than service names. */}
      <p className="text-muted-foreground mt-3 leading-7">{description}</p>
      {/* Separate price and action from descriptive card content. */}
      <div className="mt-7 flex items-end justify-between gap-4 border-t border-border pt-5">
        {/* Show pricing with an explicit qualifier for real-world flexibility. */}
        <div>
          <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
            Starting at
          </p>
          <p className="mt-1 text-xl font-bold">{price}</p>
        </div>
        {/* Demonstrate a quiet icon action suitable for service cards. */}
        <button
          aria-label={`View ${title}`}
          className="flex size-11 items-center justify-center rounded-full border border-border text-foreground transition hover:border-primary hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          type="button"
        >
          <ArrowRight aria-hidden="true" className="size-4" />
        </button>
      </div>
    </article>
  );
}

// Render the salon message and appointment preview as one focused hero section.
function HeroSection() {
  // Keep the brand promise and booking context together as the page introduction.
  return (
    <section className="relative isolate border-b border-border" id="top">
        {/* Add a soft brand glow that automatically changes with semantic colors. */}
        <div className="pointer-events-none absolute -top-24 -right-28 -z-10 size-96 rounded-full bg-brand-rose opacity-25 blur-3xl" />
        {/* Balance marketing copy with a realistic booking preview. */}
        <div className="mx-auto grid max-w-7xl gap-14 px-5 py-20 sm:px-8 sm:py-24 lg:grid-cols-[1.08fr_0.92fr] lg:items-center lg:px-10 lg:py-32">
          {/* Keep the primary brand message focused on customer confidence. */}
          <div className="max-w-3xl">
            {/* Show the approved eyebrow treatment for marketing sections. */}
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-bold tracking-[0.14em] uppercase shadow-sm">
              <BadgeCheck aria-hidden="true" className="size-4 text-primary" />
              Modern Indian luxury
            </div>
            {/* Demonstrate the largest responsive editorial heading. */}
            <h1 className="font-display mt-8 max-w-[12ch] text-[clamp(2.8rem,7vw,5.8rem)] leading-[0.98] font-semibold tracking-[-0.045em] text-balance">
              Khoobsurti jo aap jaisi lage.
            </h1>
            {/* Use the dedicated Devanagari face for a short bilingual brand line. */}
            <p
              className="font-devanagari mt-6 text-xl leading-relaxed text-primary sm:text-2xl"
              lang="hi"
            >
              खूबसूरती, आपके अपने अंदाज़ में।
            </p>
            {/* Keep supporting copy within a comfortable reading measure. */}
            <p className="text-muted-foreground mt-5 max-w-[58ch] text-lg leading-8 sm:text-xl">
              Thoughtful hair, skin, and beauty rituals designed around your
              style, comfort, and confidence.
            </p>
            {/* Demonstrate the approved primary and secondary action hierarchy. */}
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              {/* Use the filled plum action only for the main conversion goal. */}
              <button
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-sm transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                type="button"
              >
                Book an appointment
                <ArrowRight aria-hidden="true" className="size-4" />
              </button>
              {/* Use a bordered action when conversion priority is lower. */}
              <button
                className="inline-flex min-h-12 items-center justify-center rounded-xl border border-border bg-card px-6 py-3 text-sm font-bold text-card-foreground transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                type="button"
              >
                Explore services
              </button>
            </div>
          </div>

          {/* Show a booking-card pattern using only shared semantic tokens. */}
          <div className="relative mx-auto w-full max-w-lg lg:mr-0">
            {/* Add an offset rose panel to create depth without an image dependency. */}
            <div className="absolute -inset-4 -z-10 rotate-2 rounded-[2rem] bg-brand-rose opacity-50" />
            {/* Keep the booking summary readable over both theme backgrounds. */}
            <article className="rounded-[2rem] border border-border bg-card p-6 text-card-foreground shadow-salon sm:p-8">
              {/* Pair the appointment context with its status. */}
              <div className="flex items-start justify-between gap-4">
                {/* Identify the purpose of the preview card. */}
                <div>
                  <p className="text-primary text-xs font-bold tracking-[0.16em] uppercase">
                    Your next visit
                  </p>
                  <h2 className="font-display mt-2 text-3xl font-semibold">
                    A little time for you
                  </h2>
                </div>
                {/* Use the gold token only as a small premium detail. */}
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-gold-foreground">
                  <Heart aria-hidden="true" className="size-4 fill-current" />
                </span>
              </div>
              {/* Group appointment details on the quieter alternate surface. */}
              <div className="mt-7 space-y-4 rounded-2xl bg-surface-soft p-5 text-surface-soft-foreground">
                {/* Show the selected service with a concise icon cue. */}
                <div className="flex items-center gap-3">
                  <Scissors aria-hidden="true" className="size-5 text-primary" />
                  <span className="font-semibold">Signature Hair Ritual</span>
                </div>
                {/* Show date and time as related appointment metadata. */}
                <div className="flex items-center gap-3">
                  <CalendarDays
                    aria-hidden="true"
                    className="size-5 text-primary"
                  />
                  <span className="text-sm">Saturday, 18 July · 12:00 PM</span>
                </div>
                {/* Show branch context without relying on color alone. */}
                <div className="flex items-center gap-3">
                  <MapPin aria-hidden="true" className="size-5 text-primary" />
                  <span className="text-sm">Nikharta Roop · City Centre</span>
                </div>
              </div>
              {/* Reinforce trust through a concise confirmation pattern. */}
              <div className="mt-6 flex items-center gap-3 text-sm">
                <span className="flex size-8 items-center justify-center rounded-full bg-accent text-accent-foreground">
                  <Check aria-hidden="true" className="size-4" />
                </span>
                <span className="text-muted-foreground">
                  Easy rescheduling up to 4 hours before your visit.
                </span>
              </div>
            </article>
          </div>
        </div>
    </section>
  );
}

// Render the approved semantic palette and its usage rule.
function ColorsSection() {
  // Keep live theme swatches generated from the single maintained token list.
  return (
    <section
      className="scroll-mt-10 px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
      id="colors"
    >
        {/* Keep palette documentation within the shared application width. */}
        <div className="mx-auto max-w-7xl">
          {/* Explain why semantic roles matter more than raw color values. */}
          <SectionHeading
            description="Components consume semantic roles, so the same button, card, or border stays readable when Light, Dark, or System mode changes."
            eyebrow="01 · Brand colors"
            title="Warm, refined, and built for real interfaces."
          />
          {/* Render every maintained token from the single palette configuration. */}
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            {BRAND_SWATCHES.map((swatch) => (
              <ColorSwatch key={swatch.label} {...swatch} />
            ))}
          </div>
          {/* Keep the premium accent rule visible for future developers. */}
          <div className="mt-6 flex items-start gap-3 rounded-2xl border border-border bg-surface-soft p-5 text-surface-soft-foreground">
            <SwatchBook
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0 text-primary"
            />
            <p className="text-sm leading-6">
              <strong>Usage rule:</strong> ivory and surfaces carry the layout,
              plum drives actions, rose supports emphasis, and champagne gold
              stays limited to premium decorative details.
            </p>
          </div>
        </div>
    </section>
  );
}

// Render the editorial and functional typography specimens together.
function TypographySection() {
  // Keep both font roles visible for direct hierarchy comparison.
  return (
    <section
      className="scroll-mt-10 border-y border-border bg-surface-soft px-5 py-20 text-surface-soft-foreground sm:px-8 sm:py-24 lg:px-10"
      id="typography"
    >
        {/* Keep typography specimens aligned with the other demo sections. */}
        <div className="mx-auto max-w-7xl">
          {/* Introduce the deliberate split between expressive and functional type. */}
          <SectionHeading
            description="Playfair gives marketing moments personality. Manrope keeps navigation, forms, prices, and booking details fast to scan."
            eyebrow="02 · Typography"
            title="Editorial in expression, effortless in use."
          />
          {/* Compare display and interface typography in real content blocks. */}
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {/* Show the approved Playfair heading scale. */}
            <article className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
              {/* Name the family and its limited role. */}
              <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
                <div>
                  <p className="text-sm font-bold">Playfair Display</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Marketing headings only
                  </p>
                </div>
                <Type aria-hidden="true" className="size-5 text-primary" />
              </div>
              {/* Demonstrate large through small editorial hierarchy. */}
              <div className="mt-7 space-y-7">
                <div>
                  <p className="text-muted-foreground text-xs">Display · 64</p>
                  <p className="font-display mt-2 text-5xl leading-none font-semibold tracking-[-0.04em] sm:text-6xl">
                    Beautifully you.
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Heading · 40</p>
                  <p className="font-display mt-2 text-4xl leading-tight font-semibold tracking-[-0.025em]">
                    Care in every detail.
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Title · 28</p>
                  <p className="font-display mt-2 text-3xl font-semibold">
                    Signature experiences
                  </p>
                </div>
              </div>
            </article>

            {/* Show the approved Manrope content and control scale. */}
            <article className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
              {/* Name the functional family and its broad interface role. */}
              <div className="flex items-center justify-between gap-4 border-b border-border pb-5">
                <div>
                  <p className="text-sm font-bold">Manrope</p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Body, UI, forms, and prices
                  </p>
                </div>
                <BadgeCheck
                  aria-hidden="true"
                  className="size-5 text-primary"
                />
              </div>
              {/* Demonstrate readable functional text at practical sizes. */}
              <div className="mt-7 space-y-7">
                <div>
                  <p className="text-muted-foreground text-xs">Lead · 20/32</p>
                  <p className="mt-2 text-xl leading-8">
                    Personal attention, thoughtful consultations, and results
                    that feel naturally yours.
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Body · 16/26</p>
                  <p className="mt-2 max-w-[62ch] leading-[1.65]">
                    Every appointment starts with understanding your routine,
                    comfort, and personal style before recommending a service.
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Label · 14/20
                  </p>
                  <p className="mt-2 text-sm font-bold tracking-wide uppercase">
                    Choose a preferred time
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">
                    Caption · 13/18
                  </p>
                  <p className="text-muted-foreground mt-2 text-[13px] leading-[1.4]">
                    Prices may vary by hair length and selected specialist.
                  </p>
                </div>
              </div>
            </article>
          </div>
        </div>
    </section>
  );
}

// Render controls, booking fields, and service cards as one UI-kit section.
function ComponentsSection() {
  // Keep reusable interface states grouped for efficient visual review.
  return (
    <section
      className="scroll-mt-10 px-5 py-20 sm:px-8 sm:py-24 lg:px-10"
      id="components"
    >
        {/* Keep component examples within the shared application width. */}
        <div className="mx-auto max-w-7xl">
          {/* Explain that all examples consume the same token system. */}
          <SectionHeading
            description="Every example below uses the same semantic colors, focus ring, spacing rhythm, and minimum touch size."
            eyebrow="03 · Components"
            title="A small UI kit for a calm booking journey."
          />

          {/* Group core actions and form controls before larger feature cards. */}
          <div className="mt-12 grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
            {/* Demonstrate action hierarchy and common status badges. */}
            <article className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
              {/* Identify this example group for quick scanning. */}
              <h3 className="font-display text-2xl font-semibold">
                Buttons &amp; badges
              </h3>
              {/* Show actions in descending visual priority. */}
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  className="min-h-11 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground transition hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  type="button"
                >
                  Primary action
                </button>
                <button
                  className="min-h-11 rounded-xl bg-secondary px-5 py-2.5 text-sm font-bold text-secondary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  type="button"
                >
                  Secondary
                </button>
                <button
                  className="min-h-11 rounded-xl border border-border bg-transparent px-5 py-2.5 text-sm font-bold transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                  type="button"
                >
                  Outline
                </button>
                <button
                  className="min-h-11 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground opacity-45"
                  disabled
                  type="button"
                >
                  Disabled
                </button>
              </div>
              {/* Show non-interactive statuses with text and icons, not color alone. */}
              <div className="mt-8 flex flex-wrap gap-2 border-t border-border pt-6">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground">
                  <Sparkles aria-hidden="true" className="size-3.5" />
                  Best seller
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-soft px-3 py-1.5 text-xs font-bold text-surface-soft-foreground">
                  <Clock3 aria-hidden="true" className="size-3.5" />
                  60 minutes
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-gold px-3 py-1.5 text-xs font-bold text-brand-gold-foreground">
                  <Star aria-hidden="true" className="size-3.5 fill-current" />
                  Premium
                </span>
              </div>
            </article>

            {/* Demonstrate accessible labels, fields, help text, and time selection. */}
            <article className="rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-sm sm:p-8">
              {/* Identify the booking control group. */}
              <h3 className="font-display text-2xl font-semibold">
                Booking form
              </h3>
              {/* Keep related fields aligned while retaining single-column mobile flow. */}
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                {/* Pair the full name field with its visible label. */}
                <label className="block" htmlFor="demo-name">
                  <span className="text-sm font-bold">Full name</span>
                  <input
                    className="mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/35"
                    id="demo-name"
                    name="demo-name"
                    placeholder="Your name"
                    type="text"
                  />
                </label>
                {/* Pair the phone field with its expected input format. */}
                <label className="block" htmlFor="demo-phone">
                  <span className="text-sm font-bold">Phone number</span>
                  <input
                    className="mt-2 min-h-12 w-full rounded-xl border border-input bg-background px-4 text-base text-foreground outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-ring/35"
                    id="demo-phone"
                    inputMode="tel"
                    name="demo-phone"
                    placeholder="+91 98765 43210"
                    type="tel"
                  />
                </label>
              </div>
              {/* Group the available sample times under a clear field label. */}
              <fieldset className="mt-6">
                <legend className="text-sm font-bold">
                  Choose a preferred time
                </legend>
                {/* Render every available time from the single maintained list. */}
                <div className="mt-3 flex flex-wrap gap-2">
                  {BOOKING_TIMES.map((time, index) => (
                    <button
                      className={
                        index === 1
                          ? "min-h-11 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                          : "min-h-11 rounded-xl border border-border px-4 py-2 text-sm font-bold transition hover:border-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                      }
                      key={time}
                      type="button"
                    >
                      {time}
                    </button>
                  ))}
                </div>
              </fieldset>
              {/* Explain the static nature of this design preview. */}
              <p className="text-muted-foreground mt-5 text-xs leading-5">
                Demo controls show visual and keyboard states; no appointment
                will be submitted from this page.
              </p>
            </article>
          </div>

          {/* Present realistic service cards using the shared component pattern. */}
          <div className="mt-16 flex items-end justify-between gap-6">
            {/* Keep the card group title aligned with its editorial content. */}
            <div>
              <p className="text-primary text-xs font-bold tracking-[0.18em] uppercase">
                Service card pattern
              </p>
              <h3 className="font-display mt-2 text-3xl font-semibold sm:text-4xl">
                Signature experiences
              </h3>
            </div>
            {/* Keep the desktop browse action subtle and out of the mobile flow. */}
            <button
              className="hidden min-h-11 items-center gap-2 text-sm font-bold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:inline-flex"
              type="button"
            >
              View all services
              <ArrowRight aria-hidden="true" className="size-4" />
            </button>
          </div>
          {/* Render every sample service through the reusable card component. */}
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {SERVICES.map((service) => (
              <ServiceCard key={service.title} {...service} />
            ))}
          </div>
        </div>
    </section>
  );
}

// Render the final booking prompt using the approved primary hierarchy.
function BookingCallToAction() {
  // Keep the final conversion pattern isolated from documentation content.
  return (
    <section className="px-5 pb-20 sm:px-8 sm:pb-24 lg:px-10">
        {/* Keep the final CTA controlled and readable in both themes. */}
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground shadow-salon sm:px-10 sm:py-14 lg:flex lg:items-center lg:justify-between lg:gap-12 lg:px-14">
          {/* Reaffirm the customer-focused brand promise. */}
          <div className="max-w-2xl">
            <p className="text-xs font-bold tracking-[0.18em] uppercase opacity-75">
              Ready when you are
            </p>
            <h2 className="font-display mt-3 text-3xl leading-tight font-semibold tracking-[-0.025em] sm:text-5xl">
              Your next glow-up starts with a conversation.
            </h2>
            <p className="mt-4 max-w-[58ch] leading-7 opacity-85">
              Choose a service, preferred specialist, and time that feels right
              for your routine.
            </p>
          </div>
          {/* Use an inverse action so it remains visible on the primary section. */}
          <button
            className="mt-8 inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-background px-6 py-3 text-sm font-bold text-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-primary lg:mt-0"
            type="button"
          >
            Check availability
            <CalendarDays aria-hidden="true" className="size-4" />
          </button>
        </div>
    </section>
  );
}

// Render the minimal showcase footer and theme-review reminder.
function ShowcaseFooter() {
  // Keep the ending lightweight so it does not compete with the booking action.
  return (
    <footer className="border-t border-border px-5 py-8 sm:px-8 lg:px-10">
        {/* Keep footer content balanced at wide sizes and stacked on mobile. */}
        <div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm sm:flex-row sm:items-center sm:justify-between">
          {/* Repeat the brand name as the demo owner. */}
          <p className="font-display text-lg font-semibold">Nikharta Roop</p>
          {/* Remind reviewers to validate every supported color preference. */}
          <p className="text-muted-foreground">
            Use the top-right selector to review Light, Dark, and System modes.
          </p>
        </div>
    </footer>
  );
}

// Render the complete salon brand and component demonstration at the root route.
export default function HomePage() {
  // Compose focused server-rendered sections without adding unnecessary client state.
  return (
    <>
      {/* Render the reusable private navigation above the current Home experience. */}
      <PrivateNavbar />
      {/* Keep the private page content inside its semantic primary landmark. */}
      <main className="min-h-screen overflow-hidden bg-background text-foreground">
        {/* Introduce the approved salon direction through a realistic hero pattern. */}
        <HeroSection />
        {/* Document the complete approved light and dark semantic palette. */}
        <ColorsSection />
        {/* Demonstrate the complete responsive brand typography hierarchy. */}
        <TypographySection />
        {/* Demonstrate reusable controls, forms, cards, and booking patterns. */}
        <ComponentsSection />
        {/* Close the demo with a real conversion section using the approved hierarchy. */}
        <BookingCallToAction />
        {/* End the showcase with a minimal brand and accessibility reminder. */}
        <ShowcaseFooter />
      </main>
    </>
  );
}
