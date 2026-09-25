import { NextResponse } from "next/server";

import { listTagsQuerySchema } from "@/server/modules/blog/blog.schema";
import { listBlogTags } from "@/server/modules/blog/blog.service";

/**
 * Public list of blog tags.
 *
 * Why:
 * Tags are created implicitly when a post is created or updated. There is no
 * standalone admin "create tag" endpoint — the vocabulary grows organically.
 */
export async function GET(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const validation = listTagsQuerySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  if (!validation.success) {
    return NextResponse.json(
      {
        message: "Validation failed",
        errors: validation.error.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        })),
      },
      { status: 400 },
    );
  }

  try {
    const result = await listBlogTags(validation.data);
    return NextResponse.json(
      {
        message: "Tags retrieved",
        data: result.items,
        meta: { nextCursor: result.nextCursor, hasMore: result.hasMore },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Tag listing failed", error);
    return NextResponse.json(
      { message: "Unable to list tags" },
      { status: 500 },
    );
  }
}
