"use client";

import { Archive, EyeOff, FilePenLine, Pause, Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { PublicationCard } from "@/components/shared/publication-card";
import { CATALOG_STATUS_LABELS, type CatalogStatus } from "@nikharta-roop/shared/constants/catalog-status";
import { updatePackageStatusApi } from "./api";

/** Lets authorized managers publish a package directly from its private preview. */
export function PackagePublicationCard({ salonId, packageId, status, salonIsLive }: {
  salonId: string;
  packageId: string;
  status: CatalogStatus;
  salonIsLive: boolean;
}) {
  const router = useRouter();
  const published = status === "PUBLISHED";
  const Icon = status === "DRAFT" ? FilePenLine : status === "PAUSED" ? Pause : status === "ARCHIVED" ? Archive : EyeOff;

  async function publish() {
    await updatePackageStatusApi(salonId, packageId, "PUBLISHED");
    toast.success("Package published.");
    router.refresh();
  }

  return (
    <PublicationCard
      className="mb-6"
      title={published ? "Package published · Salon not live" : `${CATALOG_STATUS_LABELS[status]} package · Private preview`}
      description={published
        ? "This package is published. Customers can view it once your salon is live."
        : <>Customers cannot view this package yet. Publish it when ready.{!salonIsLive ? " Your salon must also be live before customers can access it." : ""}</>}
      icon={<Icon className="size-5" />}
      action={published ? undefined : {
        label: status === "ARCHIVED" ? "Restore and publish" : status === "PAUSED" ? "Publish again" : "Publish package",
        pendingLabel: "Publishing…",
        icon: <Send className="size-4" aria-hidden="true" />,
        onClick: publish,
      }}
    />
  );
}
