"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { routes } from "@/config/routes";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import type { UploadedImage } from "@/features/media";
import { MediaPickerDialog } from "@/features/media/components/media-picker-dialog";

import { useCreateSalon } from "../hooks/use-create-salon";
import {
  createSalonSchema,
  slugify,
  type CreateSalonFormInput,
  type CreateSalonFormValues,
} from "../schemas";
import { LocationPicker } from "./location-picker";

const CATEGORIES = [
  { value: "UNISEX", label: "Unisex" },
  { value: "MALE", label: "Men only" },
  { value: "FEMALE", label: "Women only" },
  { value: "KIDS", label: "Kids" },
] as const;

const DEFAULT_VALUES = {
  name: "",
  slug: undefined,
  shortDescription: undefined,
  description: undefined,
  descriptionHtml: undefined,
  descriptionJson: undefined,
  category: "UNISEX",
  address: "",
  city: "",
  state: "",
  zip: "",
  country: "IN",
  timezone: "Asia/Kolkata",
  lat: Number.NaN,
  lng: Number.NaN,
  placeId: undefined,
  phone: undefined,
  email: undefined,
  images: [],
} satisfies CreateSalonFormInput;

export function SalonForm() {
  const router = useRouter();
  const { create, isLoading, error, fieldErrors } = useCreateSalon();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [slugWasEdited, setSlugWasEdited] = useState(false);

  const {
    control,
    formState: { errors },
    handleSubmit,
    register,
    setError,
    setValue,
  } = useForm<CreateSalonFormInput, unknown, CreateSalonFormValues>({
    resolver: zodResolver(createSalonSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });

  const name = useWatch({ control, name: "name" });
  const latitude = useWatch({ control, name: "lat" });
  const longitude = useWatch({ control, name: "lng" });
  const shortDescription =
    useWatch({ control, name: "shortDescription" }) ?? "";

  useEffect(() => {
    if (!slugWasEdited) {
      setValue("slug", slugify(name), { shouldValidate: false });
    }
  }, [name, setValue, slugWasEdited]);

  useEffect(() => {
    for (const [field, message] of Object.entries(fieldErrors)) {
      setError(field as keyof CreateSalonFormInput, {
        type: "server",
        message,
      });
    }
  }, [fieldErrors, setError]);

  function syncImages(next: UploadedImage[]) {
    setImages(next);
    setValue(
      "images",
      next.map((im) => im.url),
      { shouldDirty: true, shouldTouch: true, shouldValidate: true },
    );
  }

  async function submit(values: CreateSalonFormValues) {
    const created = await create(values);
    if (created) router.push(routes.salonDetail(created.slug));
  }

  return (
    <form onSubmit={handleSubmit(submit)} noValidate>
      <Card className="overflow-visible py-0">
        <CardContent className="space-y-10 px-5 py-6 sm:px-8 sm:py-8">
          <FormError>{error}</FormError>

          <Section
            title="Basic information"
            description="How your salon appears across the platform."
          >
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Field
                id="name"
                label="Salon name"
                placeholder="Élan Studio Mumbai"
                autoComplete="organization"
                disabled={isLoading}
                error={errors.name?.message}
                {...register("name")}
              />
              <Field
                id="slug"
                label="URL slug"
                placeholder="elan-studio-mumbai"
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

            <div className="space-y-1.5">
              <Label htmlFor="category">Category</Label>
              <Controller
                name="category"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="category"
                      className="h-11 w-full sm:w-56"
                      disabled={isLoading}
                      onBlur={field.onBlur}
                      aria-invalid={errors.category ? true : undefined}
                      aria-describedby={
                        errors.category ? "category-error" : undefined
                      }
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((category) => (
                        <SelectItem key={category.value} value={category.value}>
                          {category.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError
                id="category-error"
                message={errors.category?.message}
              />
            </div>

            <Field
              id="shortDescription"
              label="Short description"
              placeholder="A concise summary shown in salon cards and previews"
              maxLength={280}
              disabled={isLoading}
              error={errors.shortDescription?.message}
              aria-describedby="shortDescription-count"
              {...register("shortDescription", {
                setValueAs: (value: string) => value || undefined,
              })}
            />
            <p
              id="shortDescription-count"
              className="text-right text-xs text-muted-foreground"
              aria-live="polite"
            >
              {shortDescription.length}/280 characters
            </p>

            <FormControl
              id="description"
              label="Description"
              error={errors.description?.message}
            >
              <Textarea
                id="description"
                rows={6}
                maxLength={5000}
                placeholder="What makes this salon special?"
                disabled={isLoading}
                aria-invalid={errors.description ? true : undefined}
                aria-describedby={
                  errors.description ? "description-error" : undefined
                }
                {...register("description", {
                  setValueAs: (value: string) => value || undefined,
                })}
              />
            </FormControl>
          </Section>

          <Section
            title="Location"
            description="Where customers can find you. Drag the pin to fine-tune."
          >
            <FormControl
              id="address"
              label="Street address"
              error={errors.address?.message}
            >
              <Input
                id="address"
                placeholder="Shop 12, Linking Road, Bandra West"
                autoComplete="street-address"
                disabled={isLoading}
                aria-invalid={errors.address ? true : undefined}
                aria-describedby={errors.address ? "address-error" : undefined}
                {...register("address")}
              />
            </FormControl>

            <div className="grid items-start gap-4 sm:grid-cols-3">
              <Field
                id="city"
                label="City"
                placeholder="Mumbai"
                autoComplete="address-level2"
                disabled={isLoading}
                error={errors.city?.message}
                {...register("city")}
              />
              <Field
                id="state"
                label="State"
                placeholder="Maharashtra"
                autoComplete="address-level1"
                disabled={isLoading}
                error={errors.state?.message}
                {...register("state")}
              />
              <Field
                id="zip"
                label="PIN code"
                placeholder="400050"
                inputMode="numeric"
                autoComplete="postal-code"
                disabled={isLoading}
                error={errors.zip?.message}
                {...register("zip")}
              />
            </div>

            <LocationPicker
              latitude={Number.isFinite(latitude) ? latitude : null}
              longitude={Number.isFinite(longitude) ? longitude : null}
              disabled={isLoading}
              latitudeError={errors.lat?.message}
              longitudeError={errors.lng?.message}
              onChange={({
                latitude: lat,
                longitude: lng,
                address,
                placeId,
                city,
                state,
                zip,
              }) => {
                setValue("lat", lat, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
                setValue("lng", lng, {
                  shouldDirty: true,
                  shouldTouch: true,
                  shouldValidate: true,
                });
                if (address)
                  setValue("address", address, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                if (city)
                  setValue("city", city, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                if (state)
                  setValue("state", state, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                if (zip)
                  setValue("zip", zip, {
                    shouldDirty: true,
                    shouldTouch: true,
                    shouldValidate: true,
                  });
                if (placeId)
                  setValue("placeId", placeId, { shouldDirty: true });
              }}
            />
          </Section>

          <Section
            title="Contact"
            description="Optional, but helps customers reach you."
          >
            <FormControl id="phone" label="Phone" error={errors.phone?.message}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <PhoneInput
                    value={field.value ?? ""}
                    onValueChange={(value) =>
                      field.onChange(value || undefined)
                    }
                    disabled={isLoading}
                    inputProps={{
                      id: "phone",
                      onBlur: field.onBlur,
                      autoComplete: "tel",
                      "aria-invalid": errors.phone ? true : undefined,
                      "aria-describedby": errors.phone
                        ? "phone-error"
                        : undefined,
                    }}
                  />
                )}
              />
            </FormControl>

            <Field
              id="email"
              label="Email"
              type="email"
              placeholder="hello@salon.com"
              autoComplete="email"
              disabled={isLoading}
              error={errors.email?.message}
              {...register("email", {
                setValueAs: (value: string) => value || undefined,
              })}
            />
          </Section>

          <Section
            title="Gallery"
            description="Up to 20 images. The first one becomes the cover."
          >
            {images.length < 20 ? (
              <MediaPickerDialog
                title="Add media"
                description="Upload new images or pick from your library."
                value={images}
                onChange={syncImages}
                mode="multiple"
                max={20}
                maxSizeMB={5}
                disabled={isLoading}
                trigger={
                  <div className="flex min-h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <ImagePlus className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Add media
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Upload new images or choose from your media library
                      </p>
                      <p className="text-xs text-muted-foreground">
                        JPG · PNG · WebP · AVIF · Max 5MB
                      </p>
                    </div>
                  </div>
                }
              />
            ) : null}

            {images.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
                {images.map((image, index) => (
                  <div
                    key={image.publicId}
                    className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted"
                  >
                    <Image
                      src={image.url}
                      alt=""
                      fill
                      sizes="200px"
                      className="object-cover"
                    />
                    {!isLoading ? (
                      <button
                        type="button"
                        onClick={() =>
                          syncImages(images.filter((_, i) => i !== index))
                        }
                        aria-label="Remove image"
                        className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-background/90 text-foreground opacity-0 shadow-sm transition-opacity hover:bg-destructive hover:text-destructive-foreground group-hover:opacity-100 focus-visible:opacity-100"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : null}

            <p className="text-xs text-muted-foreground">
              {images.length}/20 images
              {images.length > 0 ? " · First image becomes the cover" : ""}
            </p>

            <FieldError id="images-error" message={errors.images?.message} />
          </Section>
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
                <Loader2
                  className="mr-2 size-4 animate-spin"
                  aria-hidden="true"
                />
                Creating…
              </>
            ) : (
              "Create salon"
            )}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}

interface FormControlProps {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}

function FormControl({ id, label, error, children }: FormControlProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      {children}
      <FieldError id={`${id}-error`} message={error} />
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? (
    <p id={id} role="alert" className="text-xs text-destructive">
      {message}
    </p>
  ) : null;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  const headingId = `section-${title.toLowerCase().replaceAll(" ", "-")}`;

  return (
    <section className="space-y-5" aria-labelledby={headingId}>
      <header className="border-b border-border pb-3">
        <h2
          id={headingId}
          className="font-heading text-xl font-semibold tracking-tight text-foreground"
        >
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        ) : null}
      </header>
      <div className="space-y-5">{children}</div>
    </section>
  );
}
