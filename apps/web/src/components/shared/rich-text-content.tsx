import "server-only";

import { Color } from "@tiptap/extension-color";
import { Image } from "@tiptap/extension-image";
import { TextStyle } from "@tiptap/extension-text-style";
import type { JSONContent } from "@tiptap/react";
import { renderToHTMLString } from "@tiptap/static-renderer/pm/html-string";
import { StarterKit } from "@tiptap/starter-kit";
import type { ReactNode } from "react";
import sanitizeHtml from "sanitize-html";

import { cn } from "@/lib/utils";

interface RichTextContentProps {
  /** Sanitized editor HTML, used when available. */
  html?: string | null;
  /** Serialized ProseMirror JSON, used when HTML is unavailable. */
  json?: string | null;
  /** Plain text for legacy records or malformed rich content. */
  text?: string | null;
  className?: string;
  /** Rendered when every content source is empty. */
  fallback?: ReactNode;
}

const STATIC_EXTENSIONS = [
  StarterKit.configure({
    blockquote: { HTMLAttributes: { class: "block-node" } },
    bulletList: { HTMLAttributes: { class: "list-node" } },
    code: { HTMLAttributes: { class: "inline", spellcheck: "false" } },
    heading: { HTMLAttributes: { class: "heading-node" } },
    link: { HTMLAttributes: { class: "link" } },
    orderedList: { HTMLAttributes: { class: "list-node" } },
    paragraph: { HTMLAttributes: { class: "text-node" } },
  }),
  TextStyle,
  Color,
  Image.configure({ allowBase64: true }),
];

const CONTENT_CLASSES = [
  "break-words text-sm leading-7 text-muted-foreground",
  "[&_p:not(:first-child)]:mt-3",
  "[&_h1]:mb-4 [&_h1]:mt-8 [&_h1]:font-heading [&_h1]:text-2xl [&_h1]:font-bold [&_h1]:text-foreground",
  "[&_h2]:mb-3 [&_h2]:mt-7 [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:text-foreground",
  "[&_h3]:mb-2 [&_h3]:mt-6 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold [&_h3]:text-foreground",
  "[&_h4]:mb-2 [&_h4]:mt-5 [&_h4]:font-semibold [&_h4]:text-foreground",
  "[&_h5]:mt-4 [&_h5]:font-semibold [&_h5]:text-foreground [&_h6]:mt-4 [&_h6]:font-semibold [&_h6]:text-foreground",
  "[&_ul]:my-3 [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:my-3 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:my-1 [&_li>p]:mt-0",
  "[&_blockquote]:my-4 [&_blockquote]:border-l-2 [&_blockquote]:border-border [&_blockquote]:pl-4 [&_blockquote]:italic",
  "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-4",
  "[&_hr]:my-6 [&_hr]:border-border",
  "[&_code]:rounded-sm [&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs",
  "[&_pre]:my-4 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-muted [&_pre]:p-4 [&_pre_code]:bg-transparent [&_pre_code]:p-0",
  "[&_img]:my-5 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-md",
].join(" ");

/**
 * Renders stored Tiptap content without mounting an editor in the browser.
 *
 * HTML is sanitized at the render boundary because salon descriptions are
 * user-authored. JSON is rendered with Tiptap's server-side renderer and then
 * passed through the same sanitizer. Plain text remains the final safe
 * fallback for legacy or malformed records.
 */
export function RichTextContent({
  html,
  json,
  text,
  className,
  fallback = null,
}: RichTextContentProps) {
  const markup = getSafeMarkup(html, json);

  if (markup) {
    return (
      <div
        className={cn(CONTENT_CLASSES, className)}
        dangerouslySetInnerHTML={{ __html: markup }}
      />
    );
  }

  if (text?.trim()) {
    return (
      <div className={cn(CONTENT_CLASSES, "whitespace-pre-line", className)}>
        {text}
      </div>
    );
  }

  return <>{fallback}</>;
}

/** Converts the first usable rich source into sanitized HTML. */
function getSafeMarkup(
  html: string | null | undefined,
  json: string | null | undefined,
): string | null {
  if (html?.trim()) return sanitizeRichText(html);
  if (!json?.trim()) return null;

  try {
    const content: unknown = JSON.parse(json);
    if (!isJsonDocument(content)) return null;

    const generated = renderToHTMLString({
      extensions: STATIC_EXTENSIONS,
      content,
    });
    return sanitizeRichText(generated);
  } catch {
    return null;
  }
}

/** Narrows untrusted serialized JSON before passing it to Tiptap. */
function isJsonDocument(value: unknown): value is JSONContent {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as { type?: unknown }).type === "doc"
  );
}

/** Allows only the markup emitted by the configured rich-text editor. */
function sanitizeRichText(value: string): string | null {
  const sanitized = sanitizeHtml(value, {
    allowedTags: [
      "p",
      "br",
      "strong",
      "em",
      "u",
      "s",
      "code",
      "pre",
      "blockquote",
      "h1",
      "h2",
      "h3",
      "h4",
      "h5",
      "h6",
      "ul",
      "ol",
      "li",
      "a",
      "hr",
      "span",
      "img",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt", "title", "width", "height"],
      span: ["style"],
    },
    allowedSchemes: ["http", "https", "mailto", "tel"],
    allowedSchemesByTag: { img: ["http", "https", "data"] },
    allowedSchemesAppliedToAttributes: ["href", "src"],
    allowProtocolRelative: false,
    allowedStyles: {
      span: {
        color: [
          /^#[0-9a-f]{3,8}$/i,
          /^rgb\(\s*\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}\s*\)$/,
          /^var\(--mt-accent-[a-z-]+\)$/,
          /^hsl\(var\(--(?:background|foreground)\)\)$/,
        ],
      },
    },
    exclusiveFilter(frame) {
      if (frame.tag !== "img") return false;
      const src = frame.attribs.src ?? "";
      return !(
        src.startsWith("/") ||
        /^https?:\/\//i.test(src) ||
        /^data:image\/(?:avif|gif|jpe?g|png|webp);base64,/i.test(src)
      );
    },
    transformTags: {
      a: (_tagName, attributes) => ({
        tagName: "a",
        attribs: {
          ...attributes,
          rel: "nofollow noopener noreferrer",
        },
      }),
    },
  }).trim();

  if (!sanitized) return null;

  const visibleText = sanitizeHtml(sanitized, {
    allowedTags: [],
    allowedAttributes: {},
  })
    .replace(/&nbsp;/gi, " ")
    .trim();

  return visibleText || /<(?:img|hr)\b/i.test(sanitized) ? sanitized : null;
}
