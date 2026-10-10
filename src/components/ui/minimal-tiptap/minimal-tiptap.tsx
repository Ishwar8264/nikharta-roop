import "./styles/index.css"

import type { ReactNode } from "react"
import type { Content, Editor } from "@tiptap/react"
import type { UseMinimalTiptapEditorProps } from "./hooks/use-minimal-tiptap"
import { EditorContent, EditorContext } from "@tiptap/react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { SectionOne } from "./components/section/one"
import { SectionTwo } from "./components/section/two"
import { SectionThree } from "./components/section/three"
import { SectionFour } from "./components/section/four"
import { SectionFive } from "./components/section/five"
import { LinkBubbleMenu } from "./components/bubble-menu/link-bubble-menu"
import { useMinimalTiptapEditor } from "./hooks/use-minimal-tiptap"
import { MeasuredContainer } from "./components/measured-container"
import { useTiptapEditor } from "./hooks/use-tiptap-editor"

export interface MinimalTiptapProps extends Omit<
  UseMinimalTiptapEditorProps,
  "onUpdate"
> {
  variant?: "default" | "compact"
  renderToolbarAction?: (editor: Editor) => ReactNode
  value?: Content
  onChange?: (value: Content, editor: Editor) => void
  className?: string
  editorContentClassName?: string
}

const Toolbar = ({ editor }: { editor: Editor }) => (
  <div className="border-border flex h-12 shrink-0 overflow-x-auto border-b p-2">
    <div className="flex w-max items-center gap-px">
      <SectionOne editor={editor} activeLevels={[1, 2, 3, 4, 5, 6]} />

      <Separator orientation="vertical" className="mx-2" />

      <SectionTwo
        editor={editor}
        activeActions={[
          "bold",
          "italic",
          "underline",
          "strikethrough",
          "code",
          "clearFormatting",
        ]}
        mainActionCount={3}
      />

      <Separator orientation="vertical" className="mx-2" />

      <SectionThree editor={editor} />

      <Separator orientation="vertical" className="mx-2" />

      <SectionFour
        editor={editor}
        activeActions={["orderedList", "bulletList"]}
        mainActionCount={0}
      />

      <Separator orientation="vertical" className="mx-2" />

      <SectionFive
        editor={editor}
        activeActions={["codeBlock", "blockquote", "horizontalRule"]}
        mainActionCount={0}
      />
    </div>
  </div>
)

export const MinimalTiptapEditor = ({
  value,
  onChange,
  variant,
  renderToolbarAction,
  className,
  editorContentClassName,
  ...props
}: MinimalTiptapProps) => {
  const editor = useMinimalTiptapEditor({
    value,
    onUpdate: onChange,
    ...props,
  })

  if (!editor) {
    return null
  }

  return (
    <EditorContext.Provider value={{ editor }}>
      <MainMinimalTiptapEditor
        editor={editor}
        variant={variant}
        renderToolbarAction={renderToolbarAction}
        className={className}
        editorContentClassName={editorContentClassName}
      />
    </EditorContext.Provider>
  )
}

MinimalTiptapEditor.displayName = "MinimalTiptapEditor"

export default MinimalTiptapEditor

export const MainMinimalTiptapEditor = ({
  editor: providedEditor,
  variant = "default",
  renderToolbarAction,
  className,
  editorContentClassName,
}: MinimalTiptapProps & { editor: Editor }) => {
  const { editor } = useTiptapEditor(providedEditor)

  if (!editor) {
    return null
  }

  if (variant === "compact") {
    return (
      <div className="flex w-full flex-col gap-2">
        <div className={cn(
          "rounded-md border border-input bg-background shadow-xs",
          "focus-within:border-ring focus-within:ring-ring/20 focus-within:ring-2",
          className
        )}>
          <EditorContent editor={editor} className={cn(
            "minimal-tiptap-editor p-3 [&_.ProseMirror]:min-h-24 [&_.ProseMirror]:text-sm",
            editorContentClassName
          )} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div role="group" aria-label="Text formatting" inert={!editor.isEditable} className={cn("flex items-center gap-0.5 rounded-md border border-border bg-muted/20 p-1 [&_svg]:size-3.5", !editor.isEditable && "opacity-50")}>
            <SectionTwo editor={editor} activeActions={["bold", "italic", "strikethrough"]} mainActionCount={3} size="sm" />
            <Separator orientation="vertical" className="mx-1 h-4" />
            <SectionFour editor={editor} activeActions={["bulletList", "orderedList"]} mainActionCount={2} size="sm" />
          </div>
          {renderToolbarAction?.(editor)}
        </div>
      </div>
    )
  }

  return (
    <MeasuredContainer
      as="div"
      name="editor"
      className={cn(
        "border-input min-data-[orientation=vertical]:h-72 flex h-auto w-full flex-col rounded-md border shadow-xs",
        "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
        className
      )}
    >
      <Toolbar editor={editor} />
      <EditorContent
        editor={editor}
        className={cn("minimal-tiptap-editor", editorContentClassName)}
      />
      <LinkBubbleMenu editor={editor} />
    </MeasuredContainer>
  )
}
