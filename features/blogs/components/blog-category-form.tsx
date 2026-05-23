/**
 * Purpose: Blog category form for create/edit
 * Responsibility: Collect category fields and submit through server actions
 * Important Notes: Supports both create and edit modes with unsaved-change protection
 */
"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Save } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UnsavedChangesDialog } from "@/components/ui/shared/alertbox/unsaved-changes-dialog";
import { showError, showSuccess } from "@/components/ui/shared/toast/custom-toast";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { BlogActionState } from "@/features/blogs/types/blog.types";
import { useUnsavedChangesGuard } from "@/features/forms/hooks/use-unsaved-changes-guard";
import {
  createBlogCategorySchema,
  type CreateBlogCategoryInput,
} from "@/schema/blogs/schema.blog";

interface BlogCategoryFormProps {
  action: (data: CreateBlogCategoryInput) => Promise<BlogActionState>;
  initialData?: {
    description?: string | null;
    id: string;
    isActive: boolean;
    nameEn?: string | null;
    nameHi: string;
    slug: string;
    sortOrder: number;
  };
  redirectHref?: string;
}

export function BlogCategoryForm({
  action,
  initialData,
  redirectHref = "/admin/blogs?section=categories",
}: BlogCategoryFormProps) {
  const { push, refresh } = useRouter();
  const [isPending, startTransition] = useTransition();
  const isEditMode = !!initialData;

  const form = useForm<CreateBlogCategoryInput>({
    resolver: zodResolver(createBlogCategorySchema),
    defaultValues: {
      description: initialData?.description ?? "",
      isActive: initialData?.isActive ?? true,
      nameEn: initialData?.nameEn ?? "",
      nameHi: initialData?.nameHi ?? "",
      slug: initialData?.slug ?? "",
      sortOrder: initialData?.sortOrder ?? 0,
    },
  });
  const isActive = useWatch({ control: form.control, name: "isActive" });
  const guard = useUnsavedChangesGuard(form.formState.isDirty && !isPending);

  const handleSubmit = (data: CreateBlogCategoryInput) => {
    startTransition(async () => {
      try {
        const result = await action(data);

        if (!result.success) {
          showError("Blog category not saved", result.message);
          return;
        }

        showSuccess(
          isEditMode ? "Blog category updated" : "Blog category created",
          result.message,
        );
        push(redirectHref);
        refresh();
      } catch (error) {
        showError(
          "Blog category not saved",
          "An unexpected error occurred while saving the category.",
        );
        console.error(error);
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>{isEditMode ? "Edit Blog Category" : "Create New Blog Category"}</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Name Hindi */}
            <div className="space-y-2">
              <Label htmlFor="nameHi">Category Name (Hindi) *</Label>
              <Input
                disabled={isPending}
                id="nameHi"
                placeholder="Hindi category name"
                {...form.register("nameHi")}
              />
              {form.formState.errors.nameHi && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.nameHi.message}
                </p>
              )}
            </div>

            {/* Name English */}
            <div className="space-y-2">
              <Label htmlFor="nameEn">Category Name (English)</Label>
              <Input
                disabled={isPending}
                id="nameEn"
                placeholder="English category name"
                {...form.register("nameEn")}
              />
            </div>

            {/* Slug */}
            <div className="space-y-2">
              <Label htmlFor="slug">Slug *</Label>
              <Input
                disabled={isPending}
                id="slug"
                placeholder="category-slug"
                {...form.register("slug")}
              />
              {form.formState.errors.slug && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.slug.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                disabled={isPending}
                id="description"
                placeholder="Category description"
                rows={3}
                {...form.register("description")}
              />
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Sort Order</Label>
              <Input
                disabled={isPending}
                id="sortOrder"
                placeholder="0"
                type="number"
                {...form.register("sortOrder", { valueAsNumber: true })}
              />
            </div>

            {/* Active Status */}
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                checked={Boolean(isActive)}
                disabled={isPending}
                id="isActive"
                onCheckedChange={(checked) =>
                  form.setValue("isActive", checked, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
              />
            </div>

            {/* Submit Button */}
            <div className="flex gap-3">
              <Button className="flex-1" disabled={isPending} type="submit">
                {isPending ? (
                  <Loader2 className="mr-2 size-4 animate-spin" />
                ) : (
                  <Save className="mr-2 size-4" />
                )}
                {isEditMode ? "Update Category" : "Create Category"}
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
