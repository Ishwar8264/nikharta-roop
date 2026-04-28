import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export function NotificationComposer() {
  return (
    <div className="space-y-3">
      <Textarea placeholder="WhatsApp/SMS संदेश लिखें" />
      <Button>भेजें</Button>
    </div>
  );
}
