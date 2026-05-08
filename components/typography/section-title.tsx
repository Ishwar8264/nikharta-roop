export function SectionTitle({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <div className="space-y-2">
      <h2 className="text-2xl font-semibold tracking-tight text-stone-950">
        {title}
      </h2>
      {description ? (
        <p className="max-w-2xl text-base leading-7 text-stone-600">
          {description}
        </p>
      ) : null}
    </div>
  );
}
