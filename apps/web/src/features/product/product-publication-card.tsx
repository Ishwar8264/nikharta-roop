"use client";

import { Archive, EyeOff, FilePenLine, Pause, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PublicationCard } from "@/components/shared/publication-card";
import { CATALOG_STATUS_LABELS, type CatalogStatus } from "@nikharta-roop/shared/constants/catalog-status";
import { updateProductStatusApi } from "./api";

/** Lets authorized managers publish a product directly from its private preview. */
export function ProductPublicationCard({ salonId, productId, status, salonIsLive }: {
  salonId: string;
  productId: string;
  status: CatalogStatus;
  salonIsLive: boolean;
}) {
  const router = useRouter();
  const published = status === "PUBLISHED";
  const Icon = status === "DRAFT" ? FilePenLine : status === "PAUSED" ? Pause : status === "ARCHIVED" ? Archive : EyeOff;

  async function publish() {
    await updateProductStatusApi(salonId, productId, "PUBLISHED");
    toast.success("Product published.");
    router.refresh();
  }

  return (
    <PublicationCard
      className="mb-6"
      title={published ? "Product published · Salon not live" : `${CATALOG_STATUS_LABELS[status]} product · Private preview`}
      description={published
        ? "This product is published. Customers can view it once your salon is live."
        : <>Customers cannot view this product yet. Publish it when ready.{!salonIsLive ? " Your salon must also be live before customers can access it." : ""}</>}
      icon={<Icon className="size-5" />}
      action={published ? undefined : {
        label: status === "ARCHIVED" ? "Restore and publish" : status === "PAUSED" ? "Publish again" : "Publish product",
        pendingLabel: "Publishing…",
        icon: <Send className="size-4" aria-hidden="true" />,
        onClick: publish,
      }}
    />
  );
}
