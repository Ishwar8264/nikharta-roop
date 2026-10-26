"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { DurationField, FormHeader, SelectField, SlugField } from "@/components/shared";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { routes } from "@/config/routes";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import type { UploadedImage } from "@/features/media";
import { MediaPickerDialog } from "@/features/media/components/media-picker-dialog";

import {
  createServiceFormSchema,
  slugifyServiceName,
  type CreateServiceFormValues,
} from "./schema";
import type { SalonService, ServiceCategoryOption } from "./types";
import { useServiceForm } from "./use-service-form";

interface CreateServiceFormProps {
  salonId?: string;
  salonName: string;
  salonSlug: string;
  categories: ServiceCategoryOption[];
  initialService?: SalonService;
}

const DEFAULT_VALUES: CreateServiceFormValues = {
  name: "",
  slug: undefined,
  categoryId: undefined,
  price: 0,
  duration: 30,
  status: "DRAFT",
  shortDescription: undefined,
  description: undefined,
  descriptionHtml: undefined,
  descriptionJson: undefined,
  coverImage: undefined,
  bannerImage: undefined,
  images: [],
};

/** Renders the shared salon-service creation and editing workflow. */
export function CreateServiceForm({
  salonId,
  salonName,
  salonSlug,
  categories,
  initialService,
}: CreateServiceFormProps) {
  const router = useRouter();
  const { save, error, fieldErrors, isLoading } =
    useServiceForm(initialService?.salonId ?? salonSlug, initialService);
  const [images, setImages] = useState<UploadedImage[]>(
    initialService?.images.map((url) => ({ url, publicId: url })) ?? [],
  );
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(initialService));

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    clearErrors,
    setValue,
  } = useForm<CreateServiceFormValues>({
    resolver: zodResolver(createServiceFormSchema),
    defaultValues: initialService
      ? {
          name: initialService.name,
          slug: initialService.slug,
          categoryId: initialService.categoryId ?? undefined,
          price: initialService.price,
          duration: initialService.duration,
          status: initialService.status,
          shortDescription: initialService.shortDescription ?? undefined,
          description: initialService.description ?? undefined,
          descriptionHtml: initialService.descriptionHtml ?? undefined,
          descriptionJson: initialService.descriptionJson ?? undefined,
          coverImage: initialService.coverImage ?? undefined,
          bannerImage: initialService.bannerImage ?? undefined,
          images: initialService.images,
        }
      : DEFAULT_VALUES,
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const name = useWatch({ control, name: "name" });
  const description = useWatch({ control, name: "description" }) ?? "";
  const shortDescription =
    useWatch({ control, name: "shortDescription" }) ?? "";

  useEffect(() => {
    if (!slugWasEdited) {
      clearErrors("slug");
      setValue("slug", slugifyServiceName(name), { shouldValidate: false });
    }
  }, [name, setValue, slugWasEdited, clearErrors]);

  useEffect(() => {
    for (const [field, message] of Object.entries(fieldErrors)) {
      setError(field as keyof CreateServiceFormValues, {
        type: "server",
        message,
      });
    }
  }, [fieldErrors, setError]);

  function syncImages(next: UploadedImage[]): void {
    setImages(next);
    setValue(
      "images",
      next.map((image) => image.url),
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
  }

  async function submit(values: CreateServiceFormValues): Promise<void> {
    const service = await save(values);
    if (!service) return;

    router.push(routes.salonServiceDetail(salonSlug, service.slug));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(submit)} data-form-rounded="true" noValidate>
      <Card className="gap-0 overflow-visible py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-8 sm:py-6">
          <FormHeader
            title={initialService ? "Edit service" : "Create a service"}
            description={initialService ? `Update ${initialService.name} at ${salonName}.` : `Create a draft service for ${salonName}. Publish it from service details when ready.`}
          />
        </CardHeader>

        <CardContent className="space-y-8 px-5 py-6 sm:space-y-10 sm:px-8">
          <FormError>{error}</FormError>

          <FormSection
            title="Basic information"
            description="Name, category and booking details shown to customers."
          >
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Field
                id="name"
                required
                label="Service name"
                placeholder="e.g. Hair spa treatment"
                disabled={isLoading}
                error={errors.name?.message}
                {...register("name")}
              />
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <SlugField
                    id="slug"
                    resource="service"
                    salonId={initialService?.salonId ?? salonId}
                    currentSlug={initialService?.slug}
                    label="URL slug"
                    placeholder="e.g. hair-spa-treatment"
                    value={field.value ?? ""}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onValueChange={(value) => {
                      setSlugWasEdited(true);
                      clearErrors("slug");
                      field.onChange(value || undefined);
                    }}
                    disabled={isLoading}
                    error={errors.slug?.message}
                  />
                )}
              />
            </div>

            <div className="grid items-start gap-4 sm:grid-cols-3">
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <SelectField
                    id="categoryId"
                    label="Category"
                    options={[
                      { value: "none", label: "No category" },
                      ...categories.map((category) => ({ value: category.id, label: category.name })),
                    ]}
                    name={field.name}
                    value={field.value ?? "none"}
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? undefined : value)
                    }
                    disabled={isLoading}
                    error={errors.categoryId?.message}
                    triggerProps={{ onBlur: field.onBlur, ref: field.ref }}
                  />
                )}
              />
              <div className="space-y-1.5 sm:col-span-2">
                <Field
                  id="shortDescription"
                  label="Short description"
                  placeholder="e.g. Deep conditioning for smooth, healthy hair"
                  maxLength={280}
                  disabled={isLoading}
                  error={errors.shortDescription?.message}
                  aria-describedby="shortDescription-count"
                  {...register("shortDescription", { setValueAs: (value: string) => value || undefined })}
                />
                <CharacterCount id="shortDescription-count" value={shortDescription} max={280} />
              </div>
            </div>

            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Field
                id="price"
                required
                label="Price (₹)"
                type="number"
                inputMode="decimal"
                min={0}
                max={10_000_000}
                step="0.01"
                disabled={isLoading}
                error={errors.price?.message}
                placeholder="0"
                {...register("price", {
                  valueAsNumber: true,
                  onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
                    if (event.target.value === "") {
                      event.target.value = "0";
                      setValue("price", 0, { shouldValidate: true });
                    }
                  },
                })}
                onFocus={(event) => {
                  if (event.target.value === "0") event.target.value = "";
                }}
              />
              <Controller
                name="duration"
                control={control}
                render={({ field }) => (
                  <DurationField
                    id="duration"
                    isRequired
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                    error={errors.duration?.message}
                    triggerProps={{ onBlur: field.onBlur, ref: field.ref }}
                  />
                )}
              />
            </div>

            <Controller
              name="descriptionHtml"
              control={control}
              render={({ field }) => (
                <FormControl
                  id="description"
                  label="Description"
                  error={
                    errors.description?.message ??
                    errors.descriptionHtml?.message ??
                    errors.descriptionJson?.message
                  }
                >
                  <RichTextEditor
                    variant="compact"
                    aiContext={`Service name: ${name || "Not provided"}. Salon: ${salonName}. Summary: ${shortDescription || "Not provided"}.`}
                    value={field.value ?? ""}
                    onChange={field.onChange}
                    onOutputsChange={({ text, html, json }) => {
                      setValue("description", text || undefined, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("descriptionHtml", html || undefined, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                      setValue("descriptionJson", json || undefined, {
                        shouldDirty: true,
                        shouldValidate: true,
                      });
                    }}
                    onBlur={field.onBlur}
                    output="html"
                    placeholder="Explain what the service includes"
                    disabled={isLoading}
                  />
                  <CharacterCount value={description} max={5000} />
                </FormControl>
              )}
            />
          </FormSection>

          <FormSection title="Cover and banner">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              {(["coverImage", "bannerImage"] as const).map((name) => (
                <Controller
                  key={name}
                  name={name}
                  control={control}
                  render={({ field }) => (
                    <div className="min-w-0 space-y-2" onBlur={field.onBlur}>
                      <p className="text-sm font-medium">{name === "coverImage" ? "Cover image" : "Banner image"}</p>
                      <MediaPickerDialog
                        title={name === "coverImage" ? "Choose cover image" : "Choose banner image"}
                        value={field.value ? [{ url: field.value, publicId: field.value }] : []}
                        onChange={(next) => field.onChange(next[0]?.url)}
                        mode="single"
                        max={1}
                        maxSizeMB={5}
                        disabled={isLoading}
                        trigger={
                          <div className={`relative flex aspect-[21/9] w-full min-w-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/30 px-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/50 ${field.value ? "" : "min-h-36"}`}>
                            {field.value ? <Image src={field.value} alt={name === "coverImage" ? "Service cover" : "Service banner"} fill sizes="400px" className="object-cover" /> : (
                              <div className="flex flex-col items-center gap-1.5">
                                <ImagePlus className="size-5 text-muted-foreground" aria-hidden="true" />
                                <span className="text-sm font-medium">Choose {name === "coverImage" ? "cover" : "banner"} image</span>
                                <span className="text-xs text-muted-foreground">Recommended: {name === "coverImage" ? "1260 × 540" : "1680 × 720"} px</span>
                                <span className="text-xs text-muted-foreground">JPG, PNG, WebP or AVIF · Up to 5 MB per image.</span>
                              </div>
                            )}
                          </div>
                        }
                      />
                      <p className="text-xs text-muted-foreground">{name === "coverImage" ? "Shown on service cards." : "Shown at the top of your service page."}</p>
                      {field.value ? <Button type="button" variant="outline" size="sm" disabled={isLoading} onClick={() => field.onChange(undefined)}>Remove {name === "coverImage" ? "cover" : "banner"}</Button> : null}
                      <InlineError id={`service-${name}-error`} message={errors[name]?.message} />
                    </div>
                  )}
                />
              ))}
            </div>
          </FormSection>
          <FormSection
            title="Gallery"
            description="Add up to 10 gallery images."
          >
            {images.length < 10 ? (
              <MediaPickerDialog
                title="Add service images"
                description="Upload images or choose from your media library."
                value={images}
                onChange={syncImages}
                mode="multiple"
                max={10}
                maxSizeMB={5}
                disabled={isLoading}
                trigger={
                  <div className="flex min-h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-border px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <ImagePlus className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">Add photos</p>
                      <p className="text-xs text-muted-foreground">
                        Up to 10 photos · JPG, PNG, WebP or AVIF · Up to 5 MB each.
                      </p>
                    </div>
                  </div>
                }
              />
            ) : null}

            {images.length > 0 ? (
              <div className="flex flex-wrap gap-3">
                {images.map((image, index) => (
                  <div
                    key={image.publicId}
                    className="group relative aspect-square w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-muted sm:w-32"
                  >
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="(min-width: 640px) 128px, 96px"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        syncImages(images.filter((_, item) => item !== index))
                      }
                      disabled={isLoading}
                      aria-label="Remove image"
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 opacity-0 shadow-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 focus-visible:opacity-100 max-sm:opacity-100"
                    >
                      <X className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              {images.length}/10 images
            </p>
            <InlineError id="images-error" message={errors.images?.message} />
          </FormSection>

        </CardContent>

        <CardFooter className="flex flex-col-reverse items-stretch gap-3 border-t px-5 py-4 sm:flex-row sm:items-center sm:justify-end sm:px-8">
          <Button
            type="button"
            variant="outline"
            className="h-10 sm:min-w-28"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" className="h-10 sm:min-w-32" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {initialService ? "Saving…" : "Creating…"}
              </>
            ) : (
              initialService ? "Save changes" : "Create service"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const id = `section-${title.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <section className="space-y-4" aria-labelledby={id}>
      <header className="space-y-1 border-b border-border pb-3">
        <h2 id={id} className="font-heading text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </header>
      <div className="space-y-4">
        {children}
        {description ? <p className="text-xs leading-relaxed text-muted-foreground">{description}</p> : null}
      </div>
    </section>
  );
}

function FormControl({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <InlineError id={`${id}-error`} message={error} />
    </div>
  );
}

function InlineError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

function CharacterCount({ id, value, max }: { id?: string; value: string; max: number }) {
  return (
    <p id={id} className="text-right text-xs text-muted-foreground" aria-live="polite">
      {value.length}/{max} characters
    </p>
  );
}
