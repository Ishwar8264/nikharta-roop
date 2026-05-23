/**
 * Purpose: Admin blog category list and management.
 * Responsibility: Render categories and server-action deletes.
 * Important Notes: Data is loaded by the route page; this component performs no API fetches.
 */
"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Edit, Loader2, Plus, Trash2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { showError, showSuccess } from "@/components/ui/shared/toast/custom-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type {
  BlogActionState,
  PublicBlogCategory,
} from "@/features/blogs/types/blog.types";

type AdminBlogCategoryListProps = {
  categories: PublicBlogCategory[];
  deleteAction: (categoryId: string) => Promise<BlogActionState>;
};

/**
 * Renders admin blog categories with management actions.
 */
export function AdminBlogCategoryList({
  categories,
  deleteAction,
}: AdminBlogCategoryListProps) {
  const { refresh } = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(category: PublicBlogCategory) {
    if (!confirm(`Delete "${category.nameHi}"?`)) return;

    startTransition(async () => {
      const result = await deleteAction(category.id);

      if (!result.success) {
        showError("Blog category not deleted", result.message);
        return;
      }

      showSuccess("Blog category deleted", result.message);
      refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Blog Categories</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage category filters used by published blog posts.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blogs/categories/new">
            <Plus className="size-4" />
            New Category
          </Link>
        </Button>
      </div>

      <Card className="bg-white/85">
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categories.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              No blog categories found.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Sort</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {categories.map((category) => (
                    <TableRow key={category.id}>
                      <TableCell>
                        <div className="font-medium">{category.nameHi}</div>
                        {category.nameEn ? (
                          <div className="text-xs text-muted-foreground">
                            {category.nameEn}
                          </div>
                        ) : null}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {category.slug}
                      </TableCell>
                      <TableCell>
                        <Badge variant={category.isActive ? "default" : "secondary"}>
                          {category.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>{category.sortOrder}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/blogs/categories/${category.id}`}>
                              <Edit className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            disabled={isPending}
                            onClick={() => handleDelete(category)}
                            size="sm"
                            type="button"
                            variant="ghost"
                          >
                            {isPending ? (
                              <Loader2 className="size-4 animate-spin" />
                            ) : (
                              <Trash2 className="size-4 text-destructive" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
