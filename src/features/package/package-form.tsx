"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ChevronDown, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { FormHeader } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { routes } from "@/config/routes";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import { appointmentPriceFormatter } from "@/features/appointment/format";
import { ApiError } from "@/lib/api/backend.client";
import { cn } from "@/lib/utils";

import { createPackageApi, deletePackageApi, updatePackageApi } from "./api";
import {
  formatDuration,
  packageFormSchema,
  slugifyPackageName,
  type PackageFormInput,
  type PackageFormValues,
} from "./schemas";
import type { PackageServiceOption, PublicPackage } from "./types";

const SERVICE_MISMATCH_MESSAGE =
  "One or more services do not belong to this salon. Refresh the page and try again.";

interface PackageFormProps {
  salonSlug: string;
  salonName: string;
  /** The salon's active services, grouped by category in the picker. */
  services: PackageServiceOption[];
  initialPackage?: PublicPackage;
}

/** Maps an API failure to form-level and field-level errors. */
function useApiError() {
  const [message, setMessage] = useState<string | null>(null);
  function show(caught: unknown) {
    if (caught instanceof ApiError) {
      setMessage(caught.message);
      const payload = caught.data as {
        errors?: Array<{ field: string; message: string }>;
      } | null;
      return payload?.errors ?? [];
    }
    setMessage("Something went wrong. Please try again.");
    return [];
  }
  return { message, setMessage, show };
}

/** Create or edit a package with a grouped, searchable service picker. */
export function PackageForm({
  salonSlug,
  salonName,
  services,
  initialPackage,
}: PackageFormProps) {
  const router = useRouter();
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(initialPackage));
  const [serviceQuery, setServiceQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(true);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const apiError = useApiError();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<PackageFormInput, unknown, PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: initialPackage
      ? {
          name: initialPackage.name,
          slug: initialPackage.slug,
          price: initialPackage.price,
          duration: initialPackage.duration,
          isActive: initialPackage.isActive,
          serviceIds: initialPackage.services.map((line) => line.serviceId),
        }
      : { name: "", price: 0, duration: 30, isActive: true, serviceIds: [] },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const name = useWatch({ control, name: "name" });
  const selectedIds = useWatch({ control, name: "serviceIds" }) ?? [];
  const price = useWatch({ control, name: "price" });

  useEffect(() => {
    if (!slugWasEdited) {
      setValue("slug", slugifyPackageName(name) ?? "", {
        shouldValidate: false,
      });
    }
  }, [name, setValue, slugWasEdited]);

  const selected = useMemo(
    () =>
      services.filter((service) => selectedIds.includes(service.id)),
    [services, selectedIds],
  );
  const servicesTotal = selected.reduce((sum, s) => sum + s.price, 0);
  const savingsPercent =
    servicesTotal > price && price > 0
      ? Math.round(((servicesTotal - price) / servicesTotal) * 100)
      : 0;
  const durationTotal = selected.reduce((sum, s) => sum + s.duration, 0);
  const durationPreview =
    typeof price === "number" && price > 0 && selected.length > 0
      ? formatDuration(durationTotal)
      : null;

  const filteredServices = useMemo(() => {
    const query = serviceQuery.trim().toLowerCase();
    if (!query) return services;
    return services.filter((service) =>
      `${service.name} ${service.category?.name ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }, [services, serviceQuery]);

  const grouped = useMemo(() => {
    const map = new Map<string, PackageServiceOption[]>();
    for (const service of filteredServices) {
      const key = service.category?.name ?? "Other";
      const bucket = map.get(key) ?? [];
      bucket.push(service);
      map.set(key, bucket);
    }
    return Array.from(map.entries());
  }, [filteredServices]);

  function toggleService(serviceId: string) {
    const next = selectedIds.includes(serviceId)
      ? selectedIds.filter((id) => id !== serviceId)
      : [...selectedIds, serviceId];
    setValue("serviceIds", next, {
      shouldDirty: true,
      shouldTouch: true,
      shouldValidate: true,
    });
  }

  async function submit(values: PackageFormValues) {
    apiError.setMessage(null);
    setBusy(true);
    try {
      if (initialPackage) {
        const body = {
          name: values.name,
          price: values.price,
          duration: values.duration,
          isActive: values.isActive,
          serviceIds: values.serviceIds,
        };
        await updatePackageApi(salonSlug, initialPackage.id, body);
        toast.success("Package updated.");
      } else {
        await createPackageApi(salonSlug, values);
        toast.success("Package created — customers can see it now.");
      }
      router.push(routes.salonPackagesManage(salonSlug));
      router.refresh();
    } catch (caught) {
      const fieldErrors = apiError.show(caught);
      for (const issue of fieldErrors) {
        if (issue.field in packageFormSchema.shape) {
          setError(issue.field as keyof PackageFormInput, {
            type: "server",
            message: issue.message,
          });
        }
      }
      if (caught instanceof ApiError && caught.status === 400) {
        apiError.setMessage(SERVICE_MISMATCH_MESSAGE);
      }
    } finally {
      setBusy(false);
    }
  }

  async function removePackage() {
    if (!initialPackage) return;
    setDeleting(true);
    try {
      await deletePackageApi(salonSlug, initialPackage.id);
      toast.success(`${initialPackage.name} removed.`);
      router.push(routes.salonPackagesManage(salonSlug));
      router.refresh();
    } catch (caught) {
      apiError.show(caught);
    } finally {
      setDeleting(false);
      setConfirmOpen(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="space-y-6">
      <FormHeader
        title={initialPackage ? "Edit package" : "New package"}
        description={`${salonName} · Customers see active packages on your public page.`}
      />

      {apiError.message ? <FormError>{apiError.message}</FormError> : null}

      <Card>
        <CardContent className="space-y-5">
          <Field
            id="name"
            label="Package name"
            placeholder="e.g. Bridal Glow Package"
            error={errors.name?.message}
            {...register("name")}
          />

          <div className="space-y-1">
            <Field
              id="slug"
              label="URL slug"
              placeholder="e.g. bridal-glow-package"
              {...register("slug", {
                onChange: () => setSlugWasEdited(true),
              })}
              error={errors.slug?.message}
            />
            <p className="text-xs text-muted-foreground">
              {initialPackage
                ? "The slug cannot change after creation — it appears in shared links."
                : "Shown in the public URL. Suggested from the name; edit if you like."}
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field
              id="price"
              label="Package price (₹)"
              type="number"
              min={1}
              step={1}
              placeholder="e.g. 4999"
              error={errors.price?.message}
              {...register("price", { valueAsNumber: true })}
            />
            <div className="space-y-1">
              <Field
                id="duration"
                label="Total duration (minutes)"
                type="number"
                min={5}
                step={5}
                placeholder="e.g. 150"
                error={errors.duration?.message}
                {...register("duration", { valueAsNumber: true })}
              />
              {durationPreview ? (
                <p className="text-xs text-muted-foreground">
                  About {durationPreview} end to end.
                </p>
              ) : null}
            </div>
          </div>

          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <Label htmlFor="isActive">Visible to customers</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive packages stay hidden — useful off-season.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={field.value ?? true}
                  onCheckedChange={field.onChange}
                  disabled={busy}
                />
              </div>
            )}
          />

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Label>Included services</Label>
                <p className="text-xs text-muted-foreground">
                  {selected.length === 0
                    ? "Pick the services this package bundles."
                    : `${selected.length} selected · ${appointmentPriceFormatter.format(servicesTotal)} individually`}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPickerOpen((open) => !open)}
                aria-expanded={pickerOpen}
                className="gap-1"
              >
                {pickerOpen ? "Hide" : "Show"}
                <ChevronDown
                  className={cn(
                    "h-4 w-4 transition-transform",
                    pickerOpen && "rotate-180",
                  )}
                  aria-hidden="true"
                />
              </Button>
            </div>
            {errors.serviceIds?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.serviceIds.message}
              </p>
            ) : null}

            {savingsPercent > 0 ? (
              <div
                role="status"
                className="flex items-center justify-between gap-3 rounded-xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm"
              >
                <span className="text-muted-foreground">
                  Bought separately:{" "}
                  {appointmentPriceFormatter.format(servicesTotal)}
                </span>
                <span className="font-semibold text-accent-foreground">
                  Save {savingsPercent}%
                </span>
              </div>
            ) : null}

            {pickerOpen ? (
              <div className="space-y-4 rounded-xl border p-4">
                <div className="relative">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    value={serviceQuery}
                    onChange={(e) => setServiceQuery(e.target.value)}
                    placeholder="Search services…"
                    aria-label="Search services"
                    className="pl-9"
                  />
                </div>

                {services.length === 0 ? (
                  <p className="rounded-lg bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                    No active services yet. Activate services from your catalog
                    first, then bundle them here.
                  </p>
                ) : grouped.length === 0 ? (
                  <p className="rounded-lg bg-muted/50 px-4 py-6 text-center text-sm text-muted-foreground">
                    No services match “{serviceQuery.trim()}”.
                  </p>
                ) : (
                  <div className="max-h-80 space-y-5 overflow-y-auto pr-1">
                    {grouped.map(([category, items]) => (
                      <fieldset key={category} className="space-y-2">
                        <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                          {category}
                        </legend>
                        <div className="space-y-1.5">
                          {items.map((service) => {
                            const checked = selectedIds.includes(service.id);
                            return (
                              <label
                                key={service.id}
                                className={cn(
                                  "flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors",
                                  checked
                                    ? "border-primary bg-primary/5"
                                    : "border-border hover:border-primary/40",
                                )}
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={() => toggleService(service.id)}
                                  disabled={busy}
                                  className="h-4 w-4 shrink-0 accent-primary"
                                  aria-label={service.name}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate text-sm font-medium">
                                    {service.name}
                                  </span>
                                  <span className="block text-xs text-muted-foreground">
                                    {appointmentPriceFormatter.format(
                                      service.price,
                                    )}{" "}
                                    · {formatDuration(service.duration)}
                                  </span>
                                </span>
                              </label>
                            );
                          })}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </section>
        </CardContent>
        <CardFooter className="flex justify-end gap-3 px-5 py-4 sm:px-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={busy}>
            {busy
              ? "Saving…"
              : initialPackage
                ? "Save changes"
                : "Create package"}
          </Button>
        </CardFooter>
      </Card>

      {initialPackage ? (
        <section className="space-y-3 rounded-xl border border-destructive/40 p-5">
          <h2 className="text-lg font-semibold">Delete package</h2>
          <p className="text-sm text-muted-foreground">
            Removing hides it from customers. Existing bookings are not
            affected.
          </p>
          <Button
            type="button"
            variant="destructive"
            onClick={() => setConfirmOpen(true)}
            disabled={busy || deleting}
          >
            Delete package
          </Button>

          <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Remove {initialPackage.name}?</DialogTitle>
                <DialogDescription>
                  Customers will no longer see this package. Existing bookings
                  are not affected.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmOpen(false)}
                  disabled={deleting}
                >
                  Keep it
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={removePackage}
                  disabled={deleting}
                >
                  {deleting ? "Removing…" : "Remove package"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </section>
      ) : null}
    </form>
  );
}
