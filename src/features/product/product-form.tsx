"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FormHeader, SelectField, SlugField } from "@/components/shared";
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
  productFormSchema,
  slugifyProductName,
  type ProductFormValues,
  type ProductFormInput,
} from "./schema";
import type { PublicProduct, PublicCategory } from "@/server/modules/product/product.types";
import { ApiError } from "@/lib/api/backend.client";
import { createProductApi, updateProductApi } from "./api";

interface ProductFormProps {
  salonId?: string;
  salonName: string;
  salonSlug: string;
  categories: PublicCategory[];
  initialProduct?: PublicProduct;
}

const DEFAULT_VALUES: ProductFormInput = {
  name: "",
  slug: undefined,
  categoryId: undefined,
  price: 0,
  stock: 0,
  status: "DRAFT",
  shortDescription: undefined,
  description: undefined,
  descriptionHtml: undefined,
  descriptionJson: undefined,
  coverImage: undefined,
  bannerImage: undefined,
  images: [],
};

/** Renders the shared salon-product creation and editing workflow. */
export function ProductForm({
  salonId,
  salonName,
  salonSlug,
  categories,
  initialProduct,
}: ProductFormProps) {
  const router = useRouter();
  const [error, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [images, setImages] = useState<UploadedImage[]>(
    initialProduct?.images.map((url) => ({ url, publicId: url })) ?? [],
  );
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(initialProduct));

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    clearErrors,
    setValue,
  } = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: initialProduct
      ? {
          name: initialProduct.name,
          slug: initialProduct.slug,
          categoryId: initialProduct.categoryId ?? undefined,
          price: initialProduct.price,
          stock: initialProduct.stock,
          status: initialProduct.status,
          shortDescription: initialProduct.shortDescription ?? undefined,
          description: initialProduct.description ?? undefined,
          descriptionHtml: initialProduct.descriptionHtml ?? undefined,
          descriptionJson: initialProduct.descriptionJson ?? undefined,
          coverImage: initialProduct.coverImage ?? undefined,
          bannerImage: initialProduct.bannerImage ?? undefined,
          images: initialProduct.images,
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
      setValue("slug", slugifyProductName(name), { shouldValidate: false });
    }
  }, [name, setValue, slugWasEdited, clearErrors]);

  function syncImages(next: UploadedImage[]): void {
    setImages(next);
    setValue(
      "images",
      next.map((image) => image.url),
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
  }

  function showApiError(caught: unknown) {
    if (caught instanceof ApiError) {
      setErrorMessage(caught.message);
      const payload = caught.data as {
        errors?: Array<{ field: string; message: string }>;
      } | null;
      for (const issue of payload?.errors ?? []) {
        if (issue.field in productFormSchema.shape) {
          setError(issue.field as keyof ProductFormInput, {
            type: "server",
            message: issue.message,
          });
        }
      }
    } else {
      setErrorMessage("Something went wrong. Please try again.");
    }
  }

  async function submit(values: ProductFormValues) {
    setErrorMessage(null);
    setBusy(true);
    try {
      let product: PublicProduct;
      if (initialProduct) {
        const changes: Record<string, unknown> = {};
        for (const [key, value] of Object.entries(values)) {
          if (key === "status" || (key === "slug" && value === undefined)) continue;
          const previous = initialProduct[key as keyof PublicProduct];
          const next = value === undefined ? null : value;
          if (JSON.stringify(next) !== JSON.stringify(previous))
            changes[key] = next;
        }
        if (Object.keys(changes).length === 0) {
          router.push(routes.salonProductDetail(salonSlug, initialProduct.slug));
          router.refresh();
          return;
        }
        product = (
          await updateProductApi(
            initialProduct.salonId,
            initialProduct.id,
            changes,
          )
        ).data.product;
      } else {
        product = (await createProductApi(salonSlug, values)).data.product;
      }
      router.push(routes.salonProductDetail(salonSlug, product.slug));
      router.refresh();
    } catch (caught) {
      showApiError(caught);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} data-form-rounded="true" noValidate>
      <Card className="gap-0 overflow-visible py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-8 sm:py-6">
          <FormHeader
            title={initialProduct ? "Edit product" : "Create a product"}
            description={initialProduct ? `Update ${initialProduct.name} at ${salonName}.` : `Create a draft product for ${salonName}. Publish it from product details when ready.`}
          />
        </CardHeader>

        <CardContent className="space-y-8 px-5 py-6 sm:space-y-10 sm:px-8">
          <FormError>{error}</FormError>

          <FormSection
            title="Basic information"
            description="Name, category and stock details shown to customers."
          >
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Field
                id="name"
                required
                label="Product name"
                placeholder="e.g. Nourishing shampoo"
                disabled={busy}
                error={errors.name?.message}
                {...register("name")}
              />
              <Controller
                name="slug"
                control={control}
                render={({ field }) => (
                  <SlugField
                    id="slug"
                    resource="product"
                    salonId={initialProduct?.salonId ?? salonId}
                    currentSlug={initialProduct?.slug}
                    label="URL slug"
                    placeholder="e.g. nourishing-shampoo"
                    value={field.value ?? ""}
                    name={field.name}
                    ref={field.ref}
                    onBlur={field.onBlur}
                    onValueChange={(value) => {
                      setSlugWasEdited(true);
                      clearErrors("slug");
                      field.onChange(value || undefined);
                    }}
                    disabled={busy}
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
                    disabled={busy}
                    error={errors.categoryId?.message}
                    triggerProps={{ onBlur: field.onBlur, ref: field.ref }}
                  />
                )}
              />
              <div className="space-y-1.5 sm:col-span-2">
                <Field
                  id="shortDescription"
                  label="Short description"
                  placeholder="e.g. Gentle care for smooth, healthy hair"
                  maxLength={280}
                  disabled={busy}
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
                disabled={busy}
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
              <Field
                id="stock"
                required
                label="Stock"
                type="number"
                inputMode="numeric"
                min={0}
                max={1_000_000}
                step={1}
                disabled={busy}
                error={errors.stock?.message}
                placeholder="0"
                {...register("stock", {
                  valueAsNumber: true,
                  onBlur: (event: React.FocusEvent<HTMLInputElement>) => {
                    if (event.target.value === "") {
                      event.target.value = "0";
                      setValue("stock", 0, { shouldValidate: true });
                    }
                  },
                })}
                onFocus={(event) => {
                  if (event.target.value === "0") event.target.value = "";
                }}
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
                    aiContext={`Product name: ${name || "Not provided"}. Salon: ${salonName}. Summary: ${shortDescription || "Not provided"}.`}
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
                    placeholder="Describe this product"
                    disabled={busy}
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
                        disabled={busy}
                        trigger={
                          <div className={`relative flex aspect-[21/9] w-full min-w-0 items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/30 px-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/50 ${field.value ? "" : "min-h-36"}`}>
                            {field.value ? <Image src={field.value} alt={name === "coverImage" ? "Product cover" : "Product banner"} fill sizes="400px" className="object-cover" /> : (
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
                      <p className="text-xs text-muted-foreground">{name === "coverImage" ? "Shown on product cards." : "Shown at the top of your product page."}</p>
                      {field.value ? <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => field.onChange(undefined)}>Remove {name === "coverImage" ? "cover" : "banner"}</Button> : null}
                      <InlineError id={`product-${name}-error`} message={errors[name]?.message} />
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
                title="Add product images"
                description="Upload images or choose from your media library."
                value={images}
                onChange={syncImages}
                mode="multiple"
                max={10}
                maxSizeMB={5}
                disabled={busy}
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
                      disabled={busy}
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
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="submit" className="h-10 sm:min-w-32" disabled={busy}>
            {busy ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                {initialProduct ? "Saving…" : "Creating…"}
              </>
            ) : (
              initialProduct ? "Save changes" : "Create product"
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
