import { Badge } from "@/components/ui/badge";

type BookingStatus =
  | "PENDING"
  | "CONFIRMED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

const statusLabels: Record<BookingStatus, string> = {
  PENDING: "पेमेंट बाकी",
  CONFIRMED: "कन्फर्म",
  IN_PROGRESS: "चालू",
  COMPLETED: "पूरा हुआ",
  CANCELLED: "रद्द",
  NO_SHOW: "नहीं आए",
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <Badge variant={status === "CANCELLED" ? "destructive" : "secondary"}>{statusLabels[status]}</Badge>;
}
