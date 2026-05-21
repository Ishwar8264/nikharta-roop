/**
 * Purpose: Client wrapper that mounts Swagger UI for the generated OpenAPI spec.
 * Responsibilities: lazy-load swagger-ui-dist, attach reset controls, and clean up DOM observers.
 * Important notes: global style rules are injected with a plain style tag to avoid styled-jsx props.
 */
"use client";

import { useEffect, useRef } from "react";

type ApiSwaggerUiProps = {
  specUrl: string;
};

type SwaggerUiInstance = {
  destroy?: () => void;
};

/**
 * Reopens Swagger's Try It Out state after a reset.
 */
function reopenTryOut(opblock: Element) {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      const tryOutButton = opblock.querySelector<HTMLButtonElement>(
        ".try-out__btn",
      );

      if (tryOutButton && !tryOutButton.classList.contains("cancel")) {
        tryOutButton.click();
      }
    });
  });
}

/**
 * Clears a Swagger operation form and re-enables editing.
 */
function resetTryOutOperation(opblock: Element) {
  const clearButton = opblock.querySelector<HTMLButtonElement>(
    ".btn-clear.opblock-control__btn",
  );
  const cancelButton = opblock.querySelector<HTMLButtonElement>(
    ".try-out__btn.cancel",
  );

  clearButton?.click();
  cancelButton?.click();
  reopenTryOut(opblock);
}

/**
 * Adds reset buttons next to Swagger's Try It Out controls.
 */
function syncTryOutResetButtons(container: ParentNode) {
  const tryOutGroups =
    container.querySelectorAll<HTMLElement>(".try-out.btn-group");

  tryOutGroups.forEach((tryOutGroup) => {
    const cancelButton = tryOutGroup.querySelector<HTMLButtonElement>(
      ".try-out__btn.cancel",
    );
    const existingResetButton = tryOutGroup.querySelector<HTMLButtonElement>(
      ".api-swagger-reset-btn",
    );

    if (!cancelButton) {
      existingResetButton?.remove();
      return;
    }

    if (existingResetButton) {
      return;
    }

    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "btn api-swagger-reset-btn";
    resetButton.textContent = "Reset";
    resetButton.addEventListener("click", (event) => {
      event.preventDefault();

      const opblock = tryOutGroup.closest(".opblock");

      if (!opblock) {
        return;
      }

      resetTryOutOperation(opblock);
    });

    tryOutGroup.insertBefore(resetButton, cancelButton);
  });
}

/**
 * Renders Swagger UI for the OpenAPI spec.
 */
export function ApiSwaggerUi({ specUrl }: ApiSwaggerUiProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isMounted = true;
    let swaggerUi: SwaggerUiInstance | undefined;
    let observer: MutationObserver | undefined;
    const container = containerRef.current;

    if (!container) {
      return;
    }

    void (async () => {
      // The second mount guard must run after the lazy import to avoid mounting after unmount.
      // react-doctor-disable-next-line react-doctor/async-defer-await
      const SwaggerModule = await import("swagger-ui-dist");

      if (!isMounted) {
        return;
      }

      const SwaggerUIBundle = SwaggerModule.SwaggerUIBundle as unknown as {
        (options: Record<string, unknown>): SwaggerUiInstance;
        plugins: { DownloadUrl: unknown };
        presets: { apis: unknown };
      };

      swaggerUi = SwaggerUIBundle({
        url: specUrl,
        domNode: container,
        deepLinking: true,
        displayRequestDuration: true,
        docExpansion: "list",
        filter: true,
        // Keep Swagger UI groups and endpoints in predictable A-Z order.
        operationsSorter: "alpha",
        showExtensions: true,
        showCommonExtensions: true,
        tagsSorter: "alpha",
        tryItOutEnabled: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerModule.SwaggerUIStandalonePreset,
        ],
        plugins: [SwaggerUIBundle.plugins.DownloadUrl],
        layout: "BaseLayout",
        requestInterceptor: (request: { credentials?: RequestCredentials }) => {
          request.credentials = "include";
          return request;
        },
      });

      syncTryOutResetButtons(container);

      observer = new MutationObserver(() => {
        syncTryOutResetButtons(container);
      });

      observer.observe(container, {
        attributes: true,
        attributeFilter: ["class"],
        childList: true,
        subtree: true,
      });
    })();

    return () => {
      isMounted = false;
      observer?.disconnect();
      swaggerUi?.destroy?.();

      if (container) {
        container.innerHTML = "";
      }
    };
  }, [specUrl]);

  return (
    <>
      <div
        ref={containerRef}
        className="min-h-[70vh] overflow-hidden rounded-3xl border border-rose-100 bg-white shadow-[0_24px_80px_-44px_rgba(136,14,79,0.45)]"
      />

      <style>{`
        .swagger-ui .try-out.btn-group {
          align-items: center;
          gap: 0.75rem;
        }

        .swagger-ui .try-out__btn {
          margin-left: 0;
        }

        .swagger-ui .api-swagger-reset-btn {
          background-color: transparent;
          border-color: #881337;
          color: #881337;
          font-family: sans-serif;
        }

        .swagger-ui .api-swagger-reset-btn:hover {
          border-color: #4c0519;
          color: #4c0519;
        }
      `}</style>
    </>
  );
}
