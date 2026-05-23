/**
 * Purpose: Admin blog management dashboard
 * Responsibility: Compose admin blog post and category management
 * Important Notes: Tabs are server-driven with shareable section/status URLs
 */
import { BlogPostStatus } from "@prisma/client";
import Link from "next/link";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  deleteBlogCategoryAction,
  deleteBlogPostAction,
} from "@/features/blogs/actions/blog-admin.actions";
import { AdminBlogCategoryList } from "@/features/blogs/components/admin-blog-category-list";
import { AdminBlogList } from "@/features/blogs/components/admin-blog-list";
import {
  listAdminBlogCategories,
  listAdminBlogs,
} from "@/features/blogs/queries/blog.query";

type AdminBlogsPageProps = {
  searchParams: Promise<{ section?: string; status?: string }>;
};

/**
 * Renders the admin blog management overview.
 */
export default async function AdminBlogsPage({ searchParams }: AdminBlogsPageProps) {
  const { section, status } = await searchParams;
  const selectedSection = section === "categories" ? "categories" : "posts";
  const selectedStatus = parseBlogStatus(status);
  const [blogResult, categoryResult] = await Promise.all([
    listAdminBlogs({ limit: 100, status: selectedStatus }),
    listAdminBlogCategories(),
  ]);

  return (
    <Tabs className="space-y-6" defaultValue={selectedSection}>
      <TabsList>
        <TabsTrigger asChild value="posts">
          <Link href="/admin/blogs">Blog Posts</Link>
        </TabsTrigger>
        <TabsTrigger asChild value="categories">
          <Link href="/admin/blogs?section=categories">Categories</Link>
        </TabsTrigger>
      </TabsList>

      <TabsContent value="posts">
        {blogResult.error ? (
          <p className="mb-4 text-sm text-destructive">{blogResult.error}</p>
        ) : null}
        <AdminBlogList
          blogs={blogResult.blogs}
          deleteAction={deleteBlogPostAction}
          selectedStatus={selectedStatus}
        />
      </TabsContent>

      <TabsContent value="categories">
        {categoryResult.error ? (
          <p className="mb-4 text-sm text-destructive">{categoryResult.error}</p>
        ) : null}
        <AdminBlogCategoryList
          categories={categoryResult.categories}
          deleteAction={deleteBlogCategoryAction}
        />
      </TabsContent>
    </Tabs>
  );
}

/**
 * Narrows optional status query params to Prisma enum values.
 */
function parseBlogStatus(value?: string) {
  const statuses = new Set<string>(Object.values(BlogPostStatus));

  return statuses.has(value ?? "") ? (value as BlogPostStatus) : undefined;
}
