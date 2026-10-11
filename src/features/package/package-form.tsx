"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";

import { DurationField, FormHeader, SlugField } from "@/components/shared";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { routes } from "@/config/routes";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import { appointmentPriceFormatter } from "@/features/appointment/format";
import { ApiError } from "@/lib/api/backend.client";

import { PackageServiceSelect } from "./package-service-select";
import { createPackageApi, updatePackageApi } from "./api";
import {
  formatDuration,
  packageFormSchema,
  slugifyPackageName,
  type PackageFormInput,
  type PackageFormValues,
} from "./schemas";
import type { PackageServiceOption, PublicPackage } from "./types";

const EMPTY_SERVICE_IDS: string[] = [];

const SERVICE_MISMATCH_MESSAGE =
  "One or more services do not belong to this salon. Refresh the page and try again.";

interface PackageFormProps {
  salonId: string;
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
  salonId,
  salonSlug,
  salonName,
  services,
  initialPackage,
}: PackageFormProps) {
  const router = useRouter();
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(initialPackage));
  const [knownServices, setKnownServices] = useState(services);
  const [busy, setBusy] = useState(false);
  const apiError = useApiError();

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    clearErrors,
    setValue,
  } = useForm<PackageFormInput, unknown, PackageFormValues>({
    resolver: zodResolver(packageFormSchema),
    defaultValues: initialPackage
      ? {
          name: initialPackage.name,
          slug: initialPackage.slug,
          price: initialPackage.price,
          duration: initialPackage.duration,
          status: initialPackage.status,
          serviceIds: initialPackage.services.map((line) => line.serviceId),
        }
      : { name: "", price: 0, duration: 30, status: "DRAFT", serviceIds: [] },
    mode: "onTouched",
    reValidateMode: "onChange",
  });

  const name = useWatch({ control, name: "name" });
  const selectedIds = useWatch({ control, name: "serviceIds" }) ?? EMPTY_SERVICE_IDS;
  const price = useWatch({ control, name: "price" });

  useEffect(() => {
    if (!slugWasEdited) {
      clearErrors("slug");
      setValue("slug", slugifyPackageName(name) ?? "", {
        shouldValidate: false,
      });
    }
  }, [name, setValue, slugWasEdited, clearErrors]);

  const selected = useMemo(
    () =>
      knownServices.filter((service) => selectedIds.includes(service.id)),
    [knownServices, selectedIds],
  );
  const servicesTotal = selected.reduce((sum, s) => sum + s.price, 0);
  const savingsPercent =
    selected.length === selectedIds.length && servicesTotal > price && price > 0
      ? Math.round(((servicesTotal - price) / servicesTotal) * 100)
      : 0;
  const durationTotal = selected.reduce((sum, s) => sum + s.duration, 0);
  const durationPreview =
    selected.length > 0 && selected.length === selectedIds.length
      ? formatDuration(durationTotal)
      : null;

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
          serviceIds: values.serviceIds,
        };
        await updatePackageApi(salonSlug, initialPackage.id, body);
        toast.success("Package updated.");
      } else {
        const response = await createPackageApi(salonSlug, values);
        toast.success("Package created as draft.");
        router.push(routes.salonPackageDetail(salonSlug, response.data.package.id));
        router.refresh();
        return;
      }
      router.push(routes.salonPackageDetail(salonSlug, initialPackage!.id));
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

  return (
    <form onSubmit={handleSubmit(submit)} noValidate data-form-rounded="true">
      <Card className="gap-0 overflow-visible py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-8 sm:py-6">
      <FormHeader
        title={initialPackage ? "Edit package" : "Create a package"}
        description={initialPackage ? `${salonName} · Published packages appear on your public page.` : `Create a draft package for ${salonName}. Publish it from package details when ready.`}
      />

        </CardHeader>
        <CardContent className="space-y-6 px-5 py-6 sm:px-8">
          <FormError>{apiError.message}</FormError>
          <section className="space-y-4" aria-labelledby="package-basics">
            <h2 id="package-basics" className="border-b pb-3 font-heading text-lg font-semibold">Basic information</h2>
            <div className="grid items-start gap-4 sm:grid-cols-2">
          <Field
            id="name"
            required
            disabled={busy}
            label="Package name"
            placeholder="e.g. Bridal Glow Package"
            error={errors.name?.message}
            {...register("name")}
          />

          <Controller
            name="slug"
            control={control}
            render={({ field }) => (
              <SlugField
                id="slug"
                resource="package"
                placeholder="e.g. bridal-glow-package"
                salonId={salonId}
                currentSlug={initialPackage?.slug}
                value={field.value ?? ""}
                onValueChange={(value) => {
                  setSlugWasEdited(true);
                  clearErrors("slug");
                  field.onChange(value);
                }}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                disabled={busy || Boolean(initialPackage)}
                error={errors.slug?.message}
              />
            )}
          />
            </div>
          <div className="grid items-start gap-4 sm:grid-cols-2">
            <Field
              id="price"
              label="Package price (₹)"
              type="number"
              min={1}
              step={1}
              placeholder="0"
              required
              disabled={busy}
              error={errors.price?.message}
              {...register("price", { valueAsNumber: true })}
              onFocus={(event) => { if (event.target.value === "0") event.target.value = ""; }}
            />
            <div className="space-y-1">
              <Controller
                name="duration"
                control={control}
                render={({ field }) => (
                  <DurationField
                    id="duration"
                    label="Total duration"
                    maxMinutes={1440}
                    isRequired
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={busy}
                    error={errors.duration?.message}
                    triggerProps={{ onBlur: field.onBlur, ref: field.ref }}
                  />
                )}
              />
              {durationPreview ? (
                <p className="text-xs text-muted-foreground">
                  About {durationPreview} end to end.
                </p>
              ) : null}
            </div>
          </div>

          </section>

          <section className="space-y-3" aria-labelledby="included-services">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 id="included-services" className="font-heading text-lg font-semibold">Included services</h2>
                <p className="text-xs text-muted-foreground">
                  {selectedIds.length === 0
                    ? "Pick the services this package bundles."
                    : selected.length === selectedIds.length
                      ? `${selectedIds.length} selected · ${appointmentPriceFormatter.format(servicesTotal)} individually`
                      : `${selectedIds.length} services selected`}
                </p>
              </div>
            </div>
            <PackageServiceSelect
              salonId={salonId}
              selected={selectedIds.map((id) => ({ id, name: knownServices.find((service) => service.id === id)?.name ?? initialPackage?.services.find((line) => line.serviceId === id)?.service.name ?? "Selected service" }))}
              onToggle={toggleService}
              onCancel={(ids) => setValue("serviceIds", ids, { shouldDirty: true, shouldValidate: true })}
              onOptions={(options) => setKnownServices((previous) => [...previous.filter((item) => !options.some((option) => option.id === item.id)), ...options])}
              disabled={busy}
              error={errors.serviceIds?.message}
            />

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

          </section>
        </CardContent>
        <CardFooter className="flex flex-col-reverse items-stretch gap-3 border-t px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
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

    </form>
  );
}
