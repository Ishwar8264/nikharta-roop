"use client";

import { useEffect, useRef } from "react";
import "swagger-ui-dist/swagger-ui.css";
import "./swagger-ui-overrides.css";

/** Mounts the official Swagger UI bundle against the local OpenAPI document. */
export function ApiDocumentation(): React.JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    let isMounted = true;

    async function mountSwaggerUi(): Promise<void> {
      // Swagger is browser-only and should not increase the server render path.
      const { SwaggerUIBundle } = await import("swagger-ui-dist");

      if (!isMounted) {
        return;
      }

      SwaggerUIBundle({
        domNode: container,
        url: "/api-docs",
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        operationsSorter: "alpha",
        persistAuthorization: false,
        showCommonExtensions: true,
        showExtensions: true,
        tagsSorter: "alpha",
        validatorUrl: null,
      });
    }

    void mountSwaggerUi();

    return () => {
      isMounted = false;
      container.replaceChildren();
    };
  }, []);

  return <div ref={containerRef} />;
}
