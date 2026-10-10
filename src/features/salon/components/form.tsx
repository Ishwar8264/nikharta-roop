"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ImagePlus, Loader2, X } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { FormHeader, SelectField, SlugField } from "@/components/shared";
import { checkSlugAvailability } from "@/lib/api/slug-availability";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { routes } from "@/config/routes";
import { Field } from "@/features/auth/shared/components/field";
import { FormError } from "@/features/auth/shared/components/form-error";
import type { UploadedImage } from "@/features/media";
import { MediaPickerDialog } from "@/features/media/components/media-picker-dialog";

import { RichTextEditor } from "@/components/shared/rich-text-editor";
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
  coverImage: undefined,
  bannerImage: undefined,
  images: [],
} satisfies CreateSalonFormInput;

export function SalonForm() {
  const router = useRouter();
  const {
    create,
    isLoading: isCreating,
    error,
    fieldErrors,
  } = useCreateSalon();
  const [images, setImages] = useState<UploadedImage[]>([]);
  const [coverImages, setCoverImages] = useState<UploadedImage[]>([]);
  const [bannerImages, setBannerImages] = useState<UploadedImage[]>([]);
  const [slugWasEdited, setSlugWasEdited] = useState(false);

  const {
    control,
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
    setValue,
    clearErrors,
    setFocus,
  } = useForm<CreateSalonFormInput, unknown, CreateSalonFormValues>({
    resolver: zodResolver(createSalonSchema),
    defaultValues: DEFAULT_VALUES,
    mode: "onTouched",
    reValidateMode: "onChange",
    shouldFocusError: true,
  });
  const isLoading = isCreating || isSubmitting;

  const name = useWatch({ control, name: "name" });
  const latitude = useWatch({ control, name: "lat" });
  const longitude = useWatch({ control, name: "lng" });
  const shortDescription =
    useWatch({ control, name: "shortDescription" }) ?? "";

  const description = useWatch({ control, name: "description" }) ?? "";

  useEffect(() => {
    if (!slugWasEdited) {
      clearErrors("slug");
      setValue("slug", slugify(name), { shouldValidate: false });
    }
  }, [name, setValue, slugWasEdited, clearErrors]);

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
    if (values.slug) {
      try {
        const result = await checkSlugAvailability({
          resource: "salon",
          slug: values.slug,
        });
        if (!result.available) {
          setError("slug", {
            type: "availability",
            message: "This slug is already taken. Choose another.",
          });
          setFocus("slug");
          return;
        }
      } catch {
        setError("slug", {
          type: "availability",
          message: "Could not check availability. Please try again.",
        });
        setFocus("slug");
        return;
      }
    }
    const created = await create(values);
    if (created) router.push(routes.salonDetail(created.slug));
  }

  return (
    <form onSubmit={handleSubmit(submit)} data-form-rounded="true" noValidate>
      <Card className="gap-0 overflow-visible py-0">
        <CardHeader className="border-b px-5 py-5 sm:px-8 sm:py-6">
          <FormHeader title="Create a salon" />
        </CardHeader>
        <CardContent className="space-y-8 px-5 py-6 sm:space-y-10 sm:px-8">
          <FormError>{error}</FormError>

          <Section
            title="Basic information"
            description="Help customers get to know your salon."
          >
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <Field
                id="name"
                required
                label="Salon name"
                placeholder="e.g. Glow Salon"
                autoComplete="organization"
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
                    resource="salon"
                    label="URL slug"
                    placeholder="e.g. glow-salon"
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
                name="category"
                control={control}
                render={({ field }) => (
                  <SelectField
                    id="category"
                    label="Category"
                    options={CATEGORIES}
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={isLoading}
                    error={errors.category?.message}
                    triggerProps={{ onBlur: field.onBlur, ref: field.ref }}
                  />
                )}
              />
              <div className="space-y-1.5 sm:col-span-2">
                <Field
                  id="shortDescription"
                  label="Short description"
                  placeholder="e.g. Haircuts, colour and beauty care"
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
              </div>
            </div>

            <Controller
              name="descriptionHtml"
              control={control}
              render={({ field }) => (
                <div className="space-y-1.5">
                  <Label htmlFor="description">Description</Label>
                  <RichTextEditor
                    variant="compact"
                    aiContext={`Salon name: ${name || "Not provided"}. Summary: ${shortDescription || "Not provided"}.`}
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
                    placeholder="Share your services, expertise and salon experience."
                    disabled={isLoading}
                  />
                  <p
                    className="text-right text-xs text-muted-foreground"
                    aria-live="polite"
                  >
                    {description.length}/5000 characters
                  </p>
                  <FieldError
                    id="description-error"
                    message={
                      errors.description?.message ??
                      errors.descriptionHtml?.message ??
                      errors.descriptionJson?.message
                    }
                  />
                </div>
              )}
            />
          </Section>

          <Section title="Contact">
            <div className="grid items-start gap-4 sm:grid-cols-2">
              <FormControl
                id="phone"
                label="Phone number (optional)"
                error={errors.phone?.message}
              >
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <PhoneInput
                      initialCountry="in"
                      onlyCountries={["in"]}
                      countrySelectorMode="OFF"
                      value={field.value ?? ""}
                      onValueChange={(value) =>
                        field.onChange(value || undefined)
                      }
                      disabled={isLoading}
                      inputProps={{
                        id: "phone",
                        onBlur: field.onBlur,
                        autoComplete: "tel",
                        placeholder: "e.g. 98765 43210",
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
                label="Email address (optional)"
                type="email"
                placeholder="e.g. hello@glowsalon.com"
                autoComplete="email"
                disabled={isLoading}
                error={errors.email?.message}
                {...register("email", {
                  setValueAs: (value: string) => value || undefined,
                })}
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Customers can use these details to contact your salon.
            </p>
          </Section>

          <Section
            title="Location"
            description="Add your address and confirm the salon location on the map."
          >
            <FormControl
              id="address"
              required
              label="Street address"
              error={errors.address?.message}
            >
              <Input
                id="address"
                required
                placeholder="e.g. Shop 12, Linking Road"
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
                required
                label="City"
                placeholder="e.g. Mumbai"
                autoComplete="address-level2"
                disabled={isLoading}
                error={errors.city?.message}
                {...register("city")}
              />
              <Field
                id="state"
                required
                label="State"
                placeholder="e.g. Maharashtra"
                autoComplete="address-level1"
                disabled={isLoading}
                error={errors.state?.message}
                {...register("state")}
              />
              <Field
                id="zip"
                required
                label="PIN code"
                placeholder="e.g. 400050"
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
              placeError={errors.placeId?.message}
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
                setValue("placeId", placeId, {
                  shouldDirty: true,
                  shouldValidate: true,
                });
              }}
            />
          </Section>

          <Section title="Cover and banner">
            <div className="grid gap-4 sm:grid-cols-2">
              {(
                [
                  {
                    field: "coverImage",
                    label: "Cover image",
                    dimensions: "1260 × 540 px",
                    usage: "Shown in salon listings.",
                    selected: coverImages,
                    setSelected: setCoverImages,
                  },
                  {
                    field: "bannerImage",
                    label: "Banner image",
                    dimensions: "1680 × 720 px",
                    usage: "Shown at the top of your salon page.",
                    selected: bannerImages,
                    setSelected: setBannerImages,
                  },
                ] as const
              ).map(
                ({
                  field,
                  label,
                  dimensions,
                  usage,
                  selected,
                  setSelected,
                }) => (
                  <div key={field} className="space-y-2">
                    <p className="text-sm font-medium">{label}</p>
                    <MediaPickerDialog
                      title={`Choose ${label.toLowerCase()}`}
                      value={selected}
                      onChange={(next) => {
                        setSelected(next);
                        setValue(field, next[0]?.url, {
                          shouldDirty: true,
                          shouldTouch: true,
                          shouldValidate: true,
                        });
                      }}
                      mode="single"
                      max={1}
                      maxSizeMB={5}
                      disabled={isLoading}
                      trigger={
                        <div className={`relative flex aspect-[21/9] items-center justify-center overflow-hidden rounded-md border border-dashed border-border bg-muted/30 px-4 text-center transition-colors hover:border-primary/40 hover:bg-muted/50 ${selected[0] ? "" : "min-h-36"}`}>
                          {selected[0] ? (
                            <Image
                              src={selected[0].url}
                              alt={label}
                              fill
                              sizes="400px"
                              className="object-cover"
                            />
                          ) : (
                            <div className="flex flex-col items-center gap-1.5">
                              <ImagePlus
                                className="size-5 text-muted-foreground"
                                aria-hidden="true"
                              />
                              <span className="text-sm font-medium">
                                Choose {label.toLowerCase()}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                Recommended: {dimensions}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                JPG, PNG, WebP or AVIF · Up to 5 MB per image.
                              </span>
                            </div>
                          )}
                        </div>
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {usage}
                      {selected.length > 0 && ` Recommended: ${dimensions} (21:9).`}
                    </p>
                    {selected.length > 0 ? (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={isLoading}
                        onClick={() => {
                          setSelected([]);
                          setValue(field, undefined, {
                            shouldDirty: true,
                            shouldTouch: true,
                            shouldValidate: true,
                          });
                        }}
                      >
                        Remove {label.toLowerCase()}
                      </Button>
                    ) : null}
                    <FieldError
                      id={`${field}-error`}
                      message={errors[field]?.message}
                    />
                  </div>
                ),
              )}
            </div>
          </Section>

          <Section title="Gallery">
            {images.length < 20 ? (
              <MediaPickerDialog
                title="Add photos"
                description="Upload new images or pick from your library."
                value={images}
                onChange={syncImages}
                mode="multiple"
                max={20}
                maxSizeMB={5}
                disabled={isLoading}
                trigger={
                  <div className="flex min-h-44 w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-md border-2 border-dashed border-border px-6 py-8 text-center transition-colors hover:border-primary/40 hover:bg-muted/30">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <ImagePlus className="h-6 w-6" aria-hidden="true" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-foreground">
                        Add photos
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Up to 20 photos · JPG, PNG, WebP or AVIF · Up to 5 MB each.
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
            </p>

            <FieldError id="images-error" message={errors.images?.message} />
          </Section>
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
          <Button
            type="submit"
            className="h-10 sm:min-w-32"
            disabled={isLoading}
          >
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
  required?: boolean;
  children: React.ReactNode;
}

function FormControl({
  id,
  label,
  error,
  required,
  children,
}: FormControlProps) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} required={required}>
        {label}
      </Label>
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
    <section className="space-y-4" aria-labelledby={headingId}>
      <header className="space-y-1 border-b border-border pb-3">
        <h2
          id={headingId}
          className="font-heading text-lg font-semibold tracking-tight text-foreground"
        >
          {title}
        </h2>
      </header>
      <div className="space-y-4">
        {children}
        {description ? (
          <p className="text-xs leading-relaxed text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>
    </section>
  );
}
