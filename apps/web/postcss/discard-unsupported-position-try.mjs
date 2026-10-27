/**
 * Removes CSS position fallback rules that Next.js 16 cannot parse yet.
 *
 * Why:
 * intl-tel-input emits the rule only for its unused detached selector, while
 * leaving it in the bundle causes Turbopack to report a CSS parsing warning.
 */
export default function discardUnsupportedPositionTry() {
  return {
    postcssPlugin: "discard-unsupported-position-try",
    OnceExit(root) {
      root.walkAtRules("position-try", (rule) => rule.remove());
    },
  };
}
