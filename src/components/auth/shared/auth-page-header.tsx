// Configure server-rendered introductory copy for an authentication route.
type AuthPageHeaderProps = {
  description: string;
  headingId: string;
  title: string;
};

// Render static route copy on the server before the interactive form island.
export function AuthPageHeader({
  description,
  headingId,
  title,
}: AuthPageHeaderProps) {
  // Keep route-level copy available in the first server-rendered HTML response.
  return (
    <header className="text-center">
      {/* Use the editorial font for the primary authentication heading. */}
      <h1
        className="font-display text-3xl font-semibold tracking-tight"
        id={headingId}
      >
        {title}
      </h1>

      {/* Explain the OTP interaction before the client form hydrates. */}
      <p className="mt-3 text-sm leading-6 text-muted-foreground">
        {description}
      </p>
    </header>
  );
}
