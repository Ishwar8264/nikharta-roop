"use client";

import { Archive, EyeOff, FilePenLine, Pause, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PublicationCard } from "@/components/shared/publication-card";
import { CATALOG_STATUS_LABELS, type CatalogStatus } from "@/lib/catalog/status";
import { updateServiceStatusApi } from "./api";

/** Lets authorized managers publish a service directly from its private preview. */
export function ServicePublicationCard({ salonId, serviceId, status, salonIsLive }: {
  salonId: string;
  serviceId: string;
  status: CatalogStatus;
  salonIsLive: boolean;
}) {
  const router = useRouter();
  const published = status === "PUBLISHED";
  const Icon = status === "DRAFT" ? FilePenLine : status === "PAUSED" ? Pause : status === "ARCHIVED" ? Archive : EyeOff;

  async function publish() {
    await updateServiceStatusApi(salonId, serviceId, "PUBLISHED");
    toast.success("Service published.");
    router.refresh();
  }

  return (
    <PublicationCard
      className="mb-6"
      title={published ? "Service published · Salon not live" : `${CATALOG_STATUS_LABELS[status]} service · Private preview`}
      description={published
        ? "This service is published. Customers can view and book it once your salon is live."
        : <>Customers cannot view or book this service yet. Publish it when ready.{!salonIsLive ? " Your salon must also be live before customers can access it." : ""}</>}
      icon={<Icon className="size-5" />}
      action={published ? undefined : {
        label: status === "ARCHIVED" ? "Restore and publish" : status === "PAUSED" ? "Publish again" : "Publish service",
        pendingLabel: "Publishing…",
        icon: <Send className="size-4" aria-hidden="true" />,
        onClick: publish,
      }}
    />
  );
}
