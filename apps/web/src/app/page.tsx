import { ComingSoon } from "@/components/shared/coming-soon";

/** Keeps the root route usable while the product flows are rebuilt. */
export default function HomePage() {
  return (
    <main>
      <ComingSoon
        title="Nikharta Roop"
        description="A fresh experience is on its way."
        backHref={null}
      />
    </main>
  );
}
