/**
 * Purpose: Edit blog category page
 * Responsibility: Compose category edit form with existing data
 * Important Notes: Writes go through blog server actions
 */
import { notFound } from "next/navigation";

import { updateBlogCategoryAction } from "@/features/blogs/actions/blog-admin.actions";
import { BlogCategoryForm } from "@/features/blogs/components/blog-category-form";
import { getAdminBlogCategoryForEdit } from "@/features/blogs/queries/blog.query";

interface EditCategoryPageProps {
  params: Promise<{ categoryId: string }>;
}

/**
 * Renders the edit blog category screen.
 */
export default async function EditCategoryPage({ params }: EditCategoryPageProps) {
  const { categoryId } = await params;
  const category = await getAdminBlogCategoryForEdit(categoryId);

  if (!category) notFound();

  return (
    <section className="px-4 py-8 sm:px-6 lg:px-8">
      <BlogCategoryForm
        action={updateBlogCategoryAction.bind(null, category.id)}
        initialData={category}
      />
    </section>
  );
}
