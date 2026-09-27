import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming favourites experience. */
export default function FavoritesPage() {
  return <ComingSoon {...comingSoonPages.favorites} />;
}
