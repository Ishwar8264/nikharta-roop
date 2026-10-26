import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { areApiDocsEnabled } from "@/server/openapi/openapi.config";

import { ApiDocumentation } from "./swagger-ui";

export const metadata: Metadata = {
  title: "Nikharta Roop API | Swagger UI",
  description: "Interactive documentation for the Nikharta Roop API.",
};

/** Renders interactive API documentation when documentation is enabled. */
export default function SwaggerPage(): React.JSX.Element {
  if (!areApiDocsEnabled()) {
    notFound();
  }

  return <ApiDocumentation />;
}
