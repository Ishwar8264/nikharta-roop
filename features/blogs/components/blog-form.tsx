/**
 * Purpose: Admin blog post creation/edit form
 * Responsibility: Collect blog post fields and submit through server actions
 * Important Notes: Uses shared media upload and unsaved-change guard like catalog forms
 */
"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { BlogPostStatus } from "@prisma/client";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnsavedChangesDialog } from "@/components/ui/shared/alertbox/unsaved-changes-dialog";
import { showError, showSuccess } from "@/components/ui/shared/toast/custom-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type {
  BlogActionState,
  BlogCategoryOption,
} from "@/features/blogs/types/blog.types";
import { useUnsavedChangesGuard } from "@/features/forms/hooks/use-unsaved-changes-guard";
import { MediaUploaderDialog } from "@/features/media/components/media-uploader-dialog";
import { useServiceImageUpload } from "@/features/services/components/use-service-image-upload";
import {
  createBlogPostSchema,
  type CreateBlogPostInput,
} from "@/schema/blogs/schema.blog";

type BlogFormInitialData = {
  categoryId: string;
  contentHi: string;
  coverImageUrl?: string | null;
  excerptHi?: string | null;
  id: string;
  publishedAt?: Date | string | null;
  slug: string;
  status: BlogPostStatus;
  titleEn?: string | null;
  titleHi: string;
};

interface BlogFormProps {
  action: (data: CreateBlogPostInput) => Promise<BlogActionState>;
  categories: BlogCategoryOption[];
  initialData?: BlogFormInitialData;
  redirectHref?: string;
}

export function BlogForm({
  action,
  initialData,
  categories,
  redirectHref = "/admin/blogs",
}: BlogFormProps) {
  const { push, refresh } = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditMode = !!initialData;
  const fallbackCategoryId = categories[0]?.id ?? "";

  const form = useForm<CreateBlogPostInput>({
    resolver: zodResolver(createBlogPostSchema),
    defaultValues: {
      categoryId: initialData?.categoryId ?? fallbackCategoryId,
      contentHi: initialData?.contentHi ?? "",
      coverImageUrl: initialData?.coverImageUrl ?? "",
      excerptHi: initialData?.excerptHi ?? "",
      publishedAt: initialData?.publishedAt ? new Date(initialData.publishedAt) : null,
      slug: initialData?.slug ?? "",
      status: initialData?.status ?? BlogPostStatus.DRAFT,
      titleEn: initialData?.titleEn ?? "",
      titleHi: initialData?.titleHi ?? "",
    },
  });
  const categoryId = useWatch({ control: form.control, name: "categoryId" });
  const status = useWatch({ control: form.control, name: "status" });
  const media = useServiceImageUpload(initialData?.coverImageUrl ?? null, (imageUrl) => {
    form.setValue("coverImageUrl", imageUrl, {
      shouldDirty: true,
      shouldValidate: true,
    });
  });
  const guard = useUnsavedChangesGuard(form.formState.isDirty && !isPending);

  const handleSubmit = (data: CreateBlogPostInput) => {
    startTransition(async () => {
      try {
        const result = await action(data);

        if (!result.success) {
          showError("Blog post not saved", result.message);
          return;
        }

        showSuccess(isEditMode ? "Blog post updated" : "Blog post created", result.message);
        push(redirectHref);
        refresh();
      } catch (error) {
        showError(
          "Blog post not saved",
          "An unexpected error occurred while saving the blog post.",
        );
        console.error(error);
      }
    });
  };

  return (
    <div className="mx-auto max-w-4xl">
      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Blog Post" : "Create New Blog Post"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-6" onSubmit={form.handleSubmit(handleSubmit)}>
            {/* Title Hindi */}
            <div className="space-y-2">
              <Label htmlFor="titleHi">Title (Hindi) *</Label>
              <Input
                disabled={isPending}
                id="titleHi"
                placeholder="Hindi title"
                {...form.register("titleHi")}
              />
              {form.formState.errors.titleHi && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.titleHi.message}
                </p>
              )}
            </div>

            {/* Title English */}
            <div className="space-y-2">
              <Label htmlFor="titleEn">Title (English)</Label>
              <Input
                disabled={isPending}
                id="titleEn"
                placeholder="English title"
                {...form.register("titleEn")}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                disabled={isPending}
                id="slug"
                placeholder="url-slug"
                {...form.register("slug")}
              />
              {form.formState.errors.slug && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label htmlFor="categoryId">Category *</Label>
              <Select
                disabled={isPending || categories.length === 0}
                onValueChange={(value) =>
                  form.setValue("categoryId", value, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                value={categoryId}
              >
                <SelectTrigger id="categoryId">
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.nameHi}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {categories.length === 0 ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <span>No blog category exists yet.</span>
                  <Link
                    className="font-medium text-rose-700"
                    href="/admin/blogs/categories/new"
                  >
                    Create category
                  </Link>
                </div>
              ) : null}
              {form.formState.errors.categoryId && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.categoryId.message}
                </p>
              )}
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <Label htmlFor="excerptHi">Excerpt (Hindi)</Label>
              <Textarea
                disabled={isPending}
                id="excerptHi"
                placeholder="Short preview text in Hindi"
                rows={2}
                {...form.register("excerptHi")}
              />
            </div>

            {/* Content */}
            <div className="space-y-2">
              <Label htmlFor="contentHi">Content (Hindi) *</Label>
              <Textarea
                disabled={isPending}
                id="contentHi"
                placeholder="Full blog content in Hindi"
                rows={8}
                {...form.register("contentHi")}
              />
              {form.formState.errors.contentHi && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.contentHi.message}
                </p>
              )}
            </div>

            {/* Cover Image */}
            <div className="space-y-2">
              <Label htmlFor="coverImageUrl">Cover Image</Label>
              <input
                id="coverImageUrl"
                type="hidden"
                {...form.register("coverImageUrl")}
              />
              <div className="flex flex-col gap-3 rounded-md border bg-white p-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                  {media.previewUrl ? (
                    <Image
                      alt="Selected blog cover"
                      className="h-16 w-20 rounded-md object-cover"
                      height={64}
                      src={media.previewUrl}
                      width={80}
                    />
                  ) : (
                    <div className="flex h-16 w-20 items-center justify-center rounded-md bg-muted text-xs text-muted-foreground">
                      No image
                    </div>
                  )}
                  <p className="text-sm text-muted-foreground">
                    Upload or choose a blog cover from media library.
                  </p>
                </div>
                <MediaUploaderDialog
                  accept="image/jpeg,image/png,image/webp"
                  buttonLabel="Upload or choose image"
                  description="Upload a blog cover image or reuse existing media."
                  helperText="JPG, PNG, or WebP up to 4MB."
                  initialItems={media.initialItems}
                  onOpen={media.loadServiceImageItems}
                  onSelect={media.selectServiceImage}
                  onUpload={media.uploadServiceImage}
                  selectedUrl={media.previewUrl}
                  title="Blog media"
                />
              </div>
              {form.formState.errors.coverImageUrl && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.coverImageUrl.message}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                disabled={isPending}
                onValueChange={(value) =>
                  form.setValue("status", value as BlogPostStatus, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                value={status}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={BlogPostStatus.DRAFT}>Draft</SelectItem>
                  <SelectItem value={BlogPostStatus.PUBLISHED}>Published</SelectItem>
                  <SelectItem value={BlogPostStatus.ARCHIVED}>Archived</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button
                className="flex-1"
                disabled={isPending || categories.length === 0}
                type="submit"
              >
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {isEditMode ? "Update Blog Post" : "Create Blog Post"}
              </Button>
              <Button asChild variant="outline">
                <Link
                  aria-disabled={isPending}
                  className={isPending ? "pointer-events-none opacity-50" : undefined}
                  href={redirectHref}
                >
                  Cancel
                </Link>
              </Button>
            </div>
          </form>
          <UnsavedChangesDialog
            onDiscard={guard.discardChanges}
            onOpenChange={guard.setIsDialogOpen}
            open={guard.isDialogOpen}
          />
        </CardContent>
      </Card>
    </div>
  );
}
