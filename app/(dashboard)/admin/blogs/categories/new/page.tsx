/**
 * Purpose: Create new blog category page
 * Responsibility: Compose category creation form
 * Important Notes: Writes go through blog server actions
 */
import { createBlogCategoryAction } from "@/features/blogs/actions/blog-admin.actions";
import { BlogCategoryForm } from "@/features/blogs/components/blog-category-form";

/**
 * Renders the create blog category screen.
 */
export default function CreateCategoryPage() {
  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <BlogCategoryForm action={createBlogCategoryAction} />
    </section>
  );
}
