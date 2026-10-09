"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FormHeader } from "@/components/shared";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/config/routes";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import type { UploadedImage } from "@/features/media";
import { ImagePickerField } from "@/features/media/components/image-picker-field";
import { MediaPickerDialog } from "@/features/media/components/media-picker-dialog";
import { ApiError } from "@/lib/api/backend.client";
import type {
  PublicCategory,
  PublicProduct,
} from "@/server/modules/product/product.types";

import { createProductApi, deleteProductApi, updateProductApi } from "./api";
import {
  productFormSchema,
  slugifyProductName,
  type ProductFormInput,
  type ProductFormValues,
} from "./schema";

interface ProductFormProps {
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
  isActive: true,
  shortDescription: undefined,
  description: undefined,
  descriptionHtml: undefined,
  descriptionJson: undefined,
  coverImage: undefined,
  bannerImage: undefined,
  images: [],
};

/** Reuses shared fields, media picker, and API errors for create and edit. */
export function ProductForm({
  salonName,
  salonSlug,
  categories,
  initialProduct,
}: ProductFormProps) {
  const router = useRouter();
  const [images, setImages] = useState<UploadedImage[]>(
    initialProduct?.images.map((url) => ({ url, publicId: url })) ?? [],
  );
  const [slugWasEdited, setSlugWasEdited] = useState(Boolean(initialProduct));
  const [error, setErrorMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
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
          isActive: initialProduct.isActive,
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
  });

  const name = useWatch({ control, name: "name" });
  const description = useWatch({ control, name: "description" }) ?? "";
  const shortDescription =
    useWatch({ control, name: "shortDescription" }) ?? "";

  useEffect(() => {
    if (!slugWasEdited)
      setValue("slug", slugifyProductName(name), { shouldValidate: false });
  }, [name, setValue, slugWasEdited]);

  function syncImages(next: UploadedImage[]) {
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
          if (key === "slug" && value === undefined) continue;
          const previous = initialProduct[key as keyof PublicProduct];
          const next = value === undefined ? null : value;
          if (JSON.stringify(next) !== JSON.stringify(previous))
            changes[key] = next;
        }
        if (Object.keys(changes).length === 0) {
          router.push(routes.salonProductsManage(salonSlug));
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
      router.push(
        initialProduct || !product.isActive
          ? routes.salonProductsManage(salonSlug)
          : routes.salonProductDetail(salonSlug, product.slug),
      );
      router.refresh();
    } catch (caught) {
      showApiError(caught);
    } finally {
      setBusy(false);
    }
  }

  async function removeProduct() {
    if (!initialProduct || !window.confirm(`Delete ${initialProduct.name}?`))
      return;
    setErrorMessage(null);
    setDeleting(true);
    try {
      await deleteProductApi(initialProduct.salonId, initialProduct.id);
      router.push(routes.salonProductsManage(salonSlug));
      router.refresh();
    } catch (caught) {
      showApiError(caught);
      setDeleting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate data-form-rounded="true">
      <Card className="gap-0 overflow-visible py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-8">
          <FormHeader
            title={initialProduct ? "Edit product" : "Create a product"}
            description={`${salonName} product catalogue`}
          />
        </CardHeader>
        <CardContent className="space-y-8 px-5 py-6 sm:px-8">
          <FormError>{error}</FormError>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              id="name"
              label="Product name"
              disabled={busy}
              error={errors.name?.message}
              {...register("name")}
            />
            <Field
              id="slug"
              label="URL slug"
              disabled={busy}
              error={errors.slug?.message}
              {...register("slug", {
                setValueAs: (value: string) => value || undefined,
                onChange: () => setSlugWasEdited(true),
              })}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="categoryId">Category</Label>
              <Controller
                name="categoryId"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value ?? "none"}
                    onValueChange={(value) =>
                      field.onChange(value === "none" ? undefined : value)
                    }
                  >
                    <SelectTrigger
                      id="categoryId"
                      className="h-11 w-full"
                      disabled={busy}
                      onBlur={field.onBlur}
                      aria-invalid={Boolean(errors.categoryId)}
                    >
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No category</SelectItem>
                      {categories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.categoryId?.message ? (
                <p role="alert" className="text-xs text-destructive">
                  {errors.categoryId.message}
                </p>
              ) : null}
            </div>
            <Field
              id="price"
              label="Price"
              type="number"
              inputMode="decimal"
              min={0}
              max={10_000_000}
              step="0.01"
              disabled={busy}
              error={errors.price?.message}
              {...register("price", { valueAsNumber: true })}
            />
            <Field
              id="stock"
              label="Stock"
              type="number"
              inputMode="numeric"
              min={0}
              max={1_000_000}
              step={1}
              disabled={busy}
              error={errors.stock?.message}
              {...register("stock", { valueAsNumber: true })}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="shortDescription">Short description</Label>
            <Textarea
              id="shortDescription"
              rows={3}
              maxLength={280}
              disabled={busy}
              aria-invalid={Boolean(errors.shortDescription)}
              {...register("shortDescription", {
                setValueAs: (value: string) => value || undefined,
              })}
            />
            <p className="text-right text-xs text-muted-foreground">
              {shortDescription.length}/280
            </p>
            {errors.shortDescription?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.shortDescription.message}
              </p>
            ) : null}
          </div>
          <Controller
            name="descriptionHtml"
            control={control}
            render={({ field }) => (
              <div className="space-y-1.5">
                <Label htmlFor="description">Description</Label>
                <RichTextEditor
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
                  disabled={busy}
                  placeholder="Describe this product"
                />
                <p className="text-right text-xs text-muted-foreground">
                  {description.length}/5000
                </p>
                {errors.description?.message ||
                errors.descriptionHtml?.message ||
                errors.descriptionJson?.message ? (
                  <p role="alert" className="text-xs text-destructive">
                    {errors.description?.message ??
                      errors.descriptionHtml?.message ??
                      errors.descriptionJson?.message}
                  </p>
                ) : null}
              </div>
            )}
          />
          <section className="space-y-4" aria-labelledby="product-images">
            <h2 id="product-images" className="text-lg font-semibold">Cover and banner</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {(["coverImage", "bannerImage"] as const).map((name) => (
                <Controller
                  key={name}
                  name={name}
                  control={control}
                  render={({ field }) => (
                    <ImagePickerField
                      id={`product-${name}`}
                      label={name === "coverImage" ? "Cover image" : "Banner image"}
                      value={field.value}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      disabled={busy}
                      error={errors[name]?.message}
                    />
                  )}
                />
              ))}
            </div>
          </section>
          <section className="space-y-4" aria-labelledby="product-gallery">
            <h2 id="product-gallery" className="text-lg font-semibold">
              Gallery
            </h2>
            {images.length < 10 ? (
              <MediaPickerDialog
                title="Add product images"
                description="Upload or select from your media library."
                value={images}
                onChange={syncImages}
                mode="multiple"
                max={10}
                maxSizeMB={5}
                disabled={busy}
                trigger={
                  <div className="flex min-h-28 flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-muted-foreground">
                    <ImagePlus aria-hidden="true" />
                    <span>Add media</span>
                  </div>
                }
              />
            ) : null}
            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((image, index) => (
                  <div
                    key={`${image.url}-${index}`}
                    className="relative aspect-square overflow-hidden rounded-lg border"
                  >
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                    <button
                      type="button"
                      aria-label={`Remove image ${index + 1}`}
                      onClick={() =>
                        syncImages(images.filter((_, item) => item !== index))
                      }
                      disabled={busy}
                      className="absolute right-1 top-1 rounded-full bg-background p-1 focus-visible:ring-2"
                    >
                      <X className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
            {errors.images?.message ? (
              <p role="alert" className="text-xs text-destructive">
                {errors.images.message}
              </p>
            ) : null}
          </section>
          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between rounded-xl border p-4">
                <div>
                  <Label htmlFor="isActive">Visible to customers</Label>
                  <p className="text-xs text-muted-foreground">
                    Inactive products stay hidden from the public catalogue.
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
              : initialProduct
                ? "Save changes"
                : "Create product"}
          </Button>
        </CardFooter>
      </Card>
      {initialProduct ? (
        <section className="mt-8 space-y-3 rounded-xl border border-destructive/40 p-5">
          <h2 className="text-lg font-semibold">Delete product</h2>
          <Button
            type="button"
            variant="destructive"
            onClick={removeProduct}
            disabled={busy || deleting}
          >
            {deleting ? "Deleting…" : "Delete product"}
          </Button>
        </section>
      ) : null}
    </form>
  );
}
