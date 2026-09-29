"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FormHeader } from "@/components/shared";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
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
import { MediaPickerDialog } from "@/features/media/components/media-picker-dialog";

import {
  createServiceFormSchema,
  slugifyServiceName,
  type CreateServiceFormValues,
} from "./schema";
import type { ServiceCategoryOption } from "./types";
import { useCreateService } from "./use-create-service";

interface CreateServiceFormProps {
  salonName: string;
  salonSlug: string;
  categories: ServiceCategoryOption[];
}

const DEFAULT_VALUES: CreateServiceFormValues = {
  name: "",
  slug: undefined,
  categoryId: undefined,
  price: 0,
  duration: 30,
  isActive: true,
  shortDescription: undefined,
  description: undefined,
  descriptionHtml: undefined,
  descriptionJson: undefined,
  seoTitle: undefined,
  seoDescription: undefined,
  images: [],
};

/** Renders the complete salon-service creation workflow. */
export function CreateServiceForm({
  salonName,
  salonSlug,
  categories,
}: CreateServiceFormProps) {
  const router = useRouter();
  const { create, error, fieldErrors, isLoading } =
    useCreateService(salonSlug);
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [slugWasEdited, setSlugWasEdited] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<CreateServiceFormValues>({
    resolver: zodResolver(createServiceFormSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const name = useWatch({ control, name: "name" });
  const description = useWatch({ control, name: "description" }) ?? "";
  const shortDescription =
    useWatch({ control, name: "shortDescription" }) ?? "";
  const seoDescription =
    useWatch({ control, name: "seoDescription" }) ?? "";

  useEffect(() => {
    if (!slugWasEdited) {
      setValue("slug", slugifyServiceName(name), { shouldValidate: false });
    }
  }, [name, setValue, slugWasEdited]);

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
    const service = await create(values);
    if (!service) return;

    router.push(routes.salonServiceDetail(salonSlug, service.slug));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(submit)} data-form-rounded="true" noValidate>
      <Card className="gap-0 overflow-visible py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-8 sm:py-6">
          <FormHeader
            title="Create a service"
            description={`Add a bookable service to ${salonName}.`}
          />
        </CardHeader>

        <CardContent className="space-y-10 px-5 py-5 sm:px-8 sm:py-6">
          <FormError>{error}</FormError>

          <FormSection
            title="Basic information"
            description="Name, category and booking details shown to customers."
          >
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Field
                id="name"
                label="Service name"
                placeholder="Hair spa treatment"
                disabled={isLoading}
                error={errors.name?.message}
                {...register("name")}
              />
              <Field
                id="slug"
                label="URL slug"
                placeholder="hair-spa-treatment"
                autoCapitalize="none"
                spellCheck={false}
                disabled={isLoading}
                error={errors.slug?.message}
                {...register("slug", {
                  setValueAs: (value: string) => value || undefined,
                  onChange: () => setSlugWasEdited(true),
                })}
              />
            </div>

            <div className="grid items-start gap-4 sm:grid-cols-3">
              <FormControl
                id="categoryId"
                label="Category"
                error={errors.categoryId?.message}
              >
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
                        disabled={isLoading}
                        onBlur={field.onBlur}
                        aria-invalid={errors.categoryId ? true : undefined}
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
              </FormControl>

              <Field
                id="price"
                label="Price"
                type="number"
                inputMode="decimal"
                min={0}
                max={10_000_000}
                step="0.01"
                disabled={isLoading}
                error={errors.price?.message}
                {...register("price", { valueAsNumber: true })}
              />
              <Field
                id="duration"
                label="Duration (minutes)"
                type="number"
                inputMode="numeric"
                min={5}
                max={480}
                step={5}
                disabled={isLoading}
                error={errors.duration?.message}
                {...register("duration", { valueAsNumber: true })}
              />
            </div>

            <FormControl
              id="shortDescription"
              label="Short description"
              error={errors.shortDescription?.message}
            >
              <Textarea
                id="shortDescription"
                rows={3}
                maxLength={280}
                placeholder="A concise summary shown on service cards"
                disabled={isLoading}
                aria-invalid={errors.shortDescription ? true : undefined}
                {...register("shortDescription", {
                  setValueAs: (value: string) => value || undefined,
                })}
              />
              <CharacterCount value={shortDescription} max={280} />
            </FormControl>

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

          <FormSection
            title="Gallery"
            description="Add up to 10 images. The first image becomes the cover."
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
                  <div className="flex min-h-40 flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-border px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/30">
                    <ImagePlus className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-semibold">Add media</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        JPG, PNG, WebP or AVIF · Max 5MB
                      </p>
                    </div>
                  </div>
                }
              />
            ) : null}

            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {images.map((image, index) => (
                  <div
                    key={image.publicId}
                    className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
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
                      onClick={() =>
                        syncImages(images.filter((_, item) => item !== index))
                      }
                      disabled={isLoading}
                      aria-label="Remove image"
                      className="absolute right-1.5 top-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-background/90 opacity-0 shadow-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 focus-visible:opacity-100"
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

          <FormSection
            title="Search preview"
            description="Optional title and description for search engines."
          >
            <Field
              id="seoTitle"
              label="SEO title"
              maxLength={70}
              disabled={isLoading}
              error={errors.seoTitle?.message}
              {...register("seoTitle", {
                setValueAs: (value: string) => value || undefined,
              })}
            />
            <FormControl
              id="seoDescription"
              label="SEO description"
              error={errors.seoDescription?.message}
            >
              <Textarea
                id="seoDescription"
                rows={3}
                maxLength={160}
                disabled={isLoading}
                {...register("seoDescription", {
                  setValueAs: (value: string) => value || undefined,
                })}
              />
              <CharacterCount value={seoDescription} max={160} />
            </FormControl>
          </FormSection>

          <Controller
            name="isActive"
            control={control}
            render={({ field }) => (
              <div className="flex items-center justify-between gap-4 rounded-xl border border-border p-4">
                <div>
                  <Label htmlFor="isActive">Available for booking</Label>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Inactive services stay hidden from customers.
                  </p>
                </div>
                <Switch
                  id="isActive"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  disabled={isLoading}
                  aria-label="Available for booking"
                />
              </div>
            )}
          />
        </CardContent>

        <CardFooter className="flex flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end sm:px-8">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                Creating…
              </>
            ) : (
              "Create service"
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
  description: string;
  children: React.ReactNode;
}) {
  const id = `section-${title.toLowerCase().replaceAll(" ", "-")}`;
  return (
    <section className="space-y-5" aria-labelledby={id}>
      <header className="border-b border-border pb-3">
        <h2 id={id} className="font-heading text-xl font-semibold">
          {title}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      <div className="space-y-5">{children}</div>
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

function CharacterCount({ value, max }: { value: string; max: number }) {
  return (
    <p className="text-right text-xs text-muted-foreground" aria-live="polite">
      {value.length}/{max} characters
    </p>
  );
}
