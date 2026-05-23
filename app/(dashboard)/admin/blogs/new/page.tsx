/**
 * Purpose: Create new blog post page
 * Responsibility: Compose blog creation form with category options
 * Important Notes: Writes go through blog server actions
 */
import { createBlogPostAction } from "@/features/blogs/actions/blog-admin.actions";
import { BlogForm } from "@/features/blogs/components/blog-form";
import { listBlogCategoryOptions } from "@/features/blogs/queries/blog.query";

/**
 * Renders the create blog post screen.
 */
export default async function CreateBlogPage() {
  const categories = await listBlogCategoryOptions();

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <BlogForm action={createBlogPostAction} categories={categories} />
    </section>
  );
}
