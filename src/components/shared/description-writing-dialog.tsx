"use client";

import { useEditorState, type Editor } from "@tiptap/react";
import { Loader2, Sparkles } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createChatApi, sendMessageApi } from "@/features/ai/api";

/** Preview AI copy before replacing content; insert it as text rather than trusting generated HTML. */
export function DescriptionWritingDialog({ editor, context, disabled }: {
  editor: Editor;
  context: string;
  disabled?: boolean;
}) {
  const hasDescription = useEditorState({
    editor,
    selector: ({ editor }) => editor.getText().trim().length > 0,
  });
  const [open, setOpen] = useState(false);
  const [sourceDescription, setSourceDescription] = useState("");
  const [instructions, setInstructions] = useState("");
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const chatId = useRef<string | null>(null);
  const request = useRef<AbortController | null>(null);

  useEffect(() => () => request.current?.abort(), []);

  async function generate() {
    if (loading || disabled || (!sourceDescription.trim() && !instructions.trim())) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setError("");
    try {
      if (!chatId.current) {
        const chat = await createChatApi({ title: "Salon description", contextType: "GENERAL" });
        chatId.current = chat.id;
      }
      if (controller.signal.aborted) return;
      const result = await sendMessageApi(chatId.current, [
        sourceDescription.trim()
          ? "Improve the existing salon description in natural, professional English. Correct grammar, spelling and clarity while preserving its meaning, facts and tone. Follow any optional writing instructions."
          : "Write a concise, welcoming salon description in natural, professional English using the supplied details.",
        "Use only the supplied facts. Do not invent services, awards, prices or credentials. Return only plain text, no HTML, Markdown or commentary. Maximum 5000 characters.",
        context,
        `Current description: ${sourceDescription.trim()}`,
        `Writing instructions: ${instructions.trim()}`,
      ].join("\n\n"), { signal: controller.signal });
      if (controller.signal.aborted) return;
      if (!result.trim()) throw new Error("No description was generated. Please try again.");
      if (result.trim().length > 5000) throw new Error("The draft is too long. Try requesting a shorter description.");
      setDraft(result.trim());
    } catch (cause) {
      if (!controller.signal.aborted) {
        setError(cause instanceof Error ? cause.message : "Unable to generate a description. Please try again.");
      }
    } finally {
      if (request.current === controller) {
        request.current = null;
        setLoading(false);
      }
    }
  }

  function apply() {
    if (disabled || loading || !draft.trim() || draft.length > 5000) return;
    editor.commands.setContent({
      type: "doc",
      content: draft.trim().split(/\n\s*\n/).map((text) => ({
        type: "paragraph",
        content: [{ type: "text", text }],
      })),
    });
    setOpen(false);
    editor.commands.focus();
  }

  return (
    <Dialog open={open} onOpenChange={(next) => {
      if (!next) request.current?.abort();
      setOpen(next);
    }}>
      <Button type="button" variant="secondary" size="sm" className="border border-primary/20 bg-primary/10 text-primary hover:bg-primary/15" disabled={disabled} onClick={() => { setSourceDescription(editor.getText().slice(0, 5000)); setDraft(""); setError(""); setInstructions(""); setOpen(true); }}>
        <Sparkles className="size-3.5" /> {hasDescription ? "Improve with AI" : "Write with AI"}
      </Button>
      <DialogContent className="sm:max-w-lg max-h-[85dvh] overflow-y-auto">
        <DialogHeader className="pr-8">
          <DialogTitle>{hasDescription ? "Improve your salon description" : "Write your salon description"}</DialogTitle>
          <DialogDescription>{hasDescription ? "Improve grammar and clarity while keeping your meaning. Review the draft before applying it." : "Share a few details, then review the draft before using it."}</DialogDescription>
        </DialogHeader>
        {hasDescription && <div className="space-y-2">
          <Label htmlFor="salon-source-description">Your description</Label>
          <Textarea id="salon-source-description" className="field-sizing-fixed h-28 min-h-28 max-h-48 resize-y focus-visible:ring-2" aria-describedby="salon-source-count" value={sourceDescription} maxLength={5000} disabled={loading || disabled} onChange={(event) => setSourceDescription(event.target.value)} />
          <p id="salon-source-count" className="text-right text-xs text-muted-foreground">{sourceDescription.length}/5000 characters</p>
        </div>}
        <div className="space-y-2">
          <Label htmlFor="salon-writing-instructions">{hasDescription ? "Any preferences? (optional)" : "What should we highlight?"}</Label>
          <Textarea className="field-sizing-fixed h-20 min-h-20 max-h-36 resize-y focus-visible:ring-2" id="salon-writing-instructions" placeholder={hasDescription ? "Make it more concise, welcoming, or professional…" : "Services, atmosphere, specialties, or preferred tone…"} value={instructions} maxLength={2000} disabled={loading || disabled} onChange={(event) => setInstructions(event.target.value)} />
        </div>
        {loading && <p role="status" className="text-sm text-muted-foreground">Preparing your draft… You can cancel at any time.</p>}
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        {draft && <div className="space-y-2">
          <Label htmlFor="salon-description-draft">Review description</Label>
          <Textarea id="salon-description-draft" className="field-sizing-fixed h-40 min-h-40 max-h-64 resize-y focus-visible:ring-2" aria-describedby="salon-draft-count salon-draft-notice" value={draft} maxLength={5000} disabled={loading || disabled} onChange={(event) => setDraft(event.target.value)} />
          <p id="salon-draft-count" className="text-right text-xs text-muted-foreground">{draft.length}/5000 characters</p>
          <p id="salon-draft-notice" className="text-xs text-muted-foreground">Using this draft replaces your current description.</p>
        </div>}
        <p className="text-xs text-muted-foreground">Uses your AI quota. Drafts are saved in your AI chat history.</p>
        <DialogFooter className="items-center">
          <Button type="button" variant="ghost" onClick={() => { request.current?.abort(); setOpen(false); }}>Cancel</Button>
          <Button type="button" variant={draft ? "outline" : "default"} disabled={loading || disabled || (!sourceDescription.trim() && !instructions.trim())} className="w-full sm:w-auto" onClick={generate}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
            {loading ? (hasDescription ? "Improving…" : "Writing…") : (draft ? "Regenerate" : hasDescription ? "Improve description" : "Generate draft")}
          </Button>
          {draft && <Button type="button" className="w-full sm:w-auto" disabled={loading || disabled || !draft.trim()} onClick={apply}>Use description</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
