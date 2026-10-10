# UI Component Guidelines

## Preferred stack

Use **shadcn/ui with Radix UI primitives** for new interactive UI components in Nikharta Roop. Keep styling consistent with the project's Tailwind CSS tokens and existing component variants.

## Current implementation

The existing shared UI components currently use React Aria, and `components.json` uses the `aria-nova` style. Base UI has been removed.

Radix is the preferred direction for future UI work. This document does not migrate existing components or change the shadcn configuration. A migration should be scoped separately, including dependencies, shared components, affected consumers, and verification. Until then, reuse the existing components rather than introducing parallel implementations.

## Component conventions

- Reuse `src/components/ui/` primitives before adding a component.
- Keep reusable, props-driven field and layout components in `src/components/shared/`.
- Keep feature-specific behavior in `src/features/`.
- When a new primitive is needed, use the Radix-backed shadcn implementation and review it against the installed versions. Do not use Base UI or silently overwrite existing React Aria components with generated code.
- Expose the props needed by actual consumers. Avoid duplicate controls, unnecessary abstractions, and hardcoded feature copy in shared components.
- Use semantic theme classes such as `bg-primary`, `text-primary-foreground`, `border-input`, and `text-muted-foreground`.

## Interaction and accessibility

- Connect labels, descriptions, and validation errors to form controls.
- Support controlled values, disabled states, and relevant loading and error states.
- Preserve keyboard navigation, visible focus, Escape dismissal, and focus restoration for overlays.
- Position dropdowns relative to their triggers with a small gap; constrain their height and keep options scrollable on small screens.
- Preserve Next.js navigation and React Hook Form callbacks and refs when wrapping primitives.
- Use clear English UI copy and verify mobile layouts and long content.

## Verification

For shared primitive changes, check affected consumers and run lint, type-check, and meaningful interaction tests. Run a production build for library migrations and verify overlay placement and responsive behavior in a browser.
