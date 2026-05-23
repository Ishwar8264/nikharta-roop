/**
 * Purpose: Admin blog post list and management dashboard.
 * Responsibility: Render blog posts, status filters, and server-action deletes.
 * Important Notes: Data is loaded by the route page; this component performs no API fetches.
 */
"use client";

import { useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BlogPostStatus } from "@prisma/client";
import { Edit, Eye, Loader2, Plus, Trash2 } from "lucide-react";

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
import type { BlogActionState, PublicBlogPost } from "@/features/blogs/types/blog.types";

type AdminBlogListProps = {
  blogs: PublicBlogPost[];
  deleteAction: (blogId: string) => Promise<BlogActionState>;
  selectedStatus?: BlogPostStatus;
};

const STATUS_FILTERS: Array<{ href: string; label: string; value?: BlogPostStatus }> = [
  { href: "/admin/blogs", label: "All" },
  {
    href: `/admin/blogs?status=${BlogPostStatus.DRAFT}`,
    label: "Draft",
    value: BlogPostStatus.DRAFT,
  },
  {
    href: `/admin/blogs?status=${BlogPostStatus.PUBLISHED}`,
    label: "Published",
    value: BlogPostStatus.PUBLISHED,
  },
  {
    href: `/admin/blogs?status=${BlogPostStatus.ARCHIVED}`,
    label: "Archived",
    value: BlogPostStatus.ARCHIVED,
  },
];

/**
 * Renders admin blog posts with management actions.
 */
export function AdminBlogList({
  blogs,
  deleteAction,
  selectedStatus,
}: AdminBlogListProps) {
  const { refresh } = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete(blog: PublicBlogPost) {
    if (!confirm(`Delete "${blog.titleHi}"?`)) return;

    startTransition(async () => {
      const result = await deleteAction(blog.id);

      if (!result.success) {
        showError("Blog post not deleted", result.message);
        return;
      }

      showSuccess("Blog post deleted", result.message);
      refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-heading text-2xl font-semibold">Blog Posts</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage drafts, published posts, and archived blog content.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/blogs/new">
            <Plus className="size-4" />
            New Blog Post
          </Link>
        </Button>
      </div>

      <Card className="bg-white/85">
        <CardHeader className="gap-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Posts</CardTitle>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STATUS_FILTERS.map((filter) => (
                <Button
                  asChild
                  key={filter.label}
                  size="sm"
                  variant={selectedStatus === filter.value ? "default" : "outline"}
                >
                  <Link href={filter.href}>{filter.label}</Link>
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {blogs.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              No blog posts found for this filter.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blogs.map((blog) => (
                    <TableRow key={blog.id}>
                      <TableCell>
                        <div className="font-medium">{blog.titleHi}</div>
                        <div className="text-xs text-muted-foreground">{blog.slug}</div>
                      </TableCell>
                      <TableCell>{blog.category.nameHi}</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(blog.status)}>
                          {blog.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {blog.updatedAt ? formatDate(blog.updatedAt) : "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {blog.status === BlogPostStatus.PUBLISHED ? (
                            <Button asChild size="sm" variant="ghost">
                              <Link href={`/blogs/${blog.slug}`}>
                                <Eye className="size-4" />
                              </Link>
                            </Button>
                          ) : null}
                          <Button asChild size="sm" variant="ghost">
                            <Link href={`/admin/blogs/${blog.id}`}>
                              <Edit className="size-4" />
                            </Link>
                          </Button>
                          <Button
                            disabled={isPending}
                            onClick={() => handleDelete(blog)}
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

/**
 * Maps blog status to muted status badge classes.
 */
function statusBadgeClass(status: BlogPostStatus) {
  const statusClassMap = {
    [BlogPostStatus.ARCHIVED]: "bg-stone-100 text-stone-800",
    [BlogPostStatus.DRAFT]: "bg-amber-100 text-amber-800",
    [BlogPostStatus.PUBLISHED]: "bg-emerald-100 text-emerald-800",
  } satisfies Record<BlogPostStatus, string>;

  return statusClassMap[status];
}

/**
 * Formats serialized API dates for admin tables.
 */
function formatDate(value: string) {
  return new Date(value).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}
