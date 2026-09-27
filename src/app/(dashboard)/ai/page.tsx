import { ComingSoon } from "@/components/shared/coming-soon";
import { comingSoonPages } from "@/config/coming-soon";

/** Shows the upcoming AI assistant experience. */
export default function AiAssistantPage() {
  return <ComingSoon {...comingSoonPages.ai} />;
}
