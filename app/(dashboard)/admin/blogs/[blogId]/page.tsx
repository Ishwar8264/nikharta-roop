/**
 * Purpose: Edit blog post page
 * Responsibility: Compose blog edit form with existing data
 * Important Notes: Writes go through blog server actions
 */
import { notFound } from "next/navigation";

import { updateBlogPostAction } from "@/features/blogs/actions/blog-admin.actions";
import { BlogForm } from "@/features/blogs/components/blog-form";
import {
  getAdminBlogForEdit,
  listBlogCategoryOptions,
} from "@/features/blogs/queries/blog.query";

interface EditBlogPageProps {
  params: Promise<{ blogId: string }>;
}

/**
 * Renders the edit blog post screen.
 */
export default async function EditBlogPage({ params }: EditBlogPageProps) {
  const { blogId } = await params;
  const [blog, categories] = await Promise.all([
    getAdminBlogForEdit(blogId),
    listBlogCategoryOptions(),
  ]);

  if (!blog) notFound();

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <BlogForm
        action={updateBlogPostAction.bind(null, blog.id)}
        initialData={blog}
        categories={categories}
      />
    </section>
  );
}
