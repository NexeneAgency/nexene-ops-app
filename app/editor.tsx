"use client";
import type { JSONContent } from "@tiptap/react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import type { Document } from "../lib/types";
export default function Editor({
  content,
  editable,
  onChange,
  documents = [],
  lang = "de",
}: {
  content: JSONContent;
  editable: boolean;
  onChange: (value: JSONContent) => void;
  documents?: Document[];
  lang?: "de" | "en";
}) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        link: {
          openOnClick: false,
          protocols: ["http", "https"],
          HTMLAttributes: { rel: "noopener noreferrer", target: "_blank" },
        },
      }),
    ],
    content,
    editable,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": lang === "de" ? "Dokumentinhalt" : "Document content",
      },
    },
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
  });
  const labels: Record<string, [string, string]> = {
    B: ["Fett", "Bold"],
    I: ["Kursiv", "Italic"],
    H1: ["Überschrift 1", "Heading 1"],
    H2: ["Überschrift 2", "Heading 2"],
    "•": ["Aufzählung", "Bullet list"],
    "1.": ["Nummerierte Liste", "Numbered list"],
    "❝": ["Zitat", "Quote"],
    "</>": ["Codeblock", "Code block"],
    "↗": ["Link einfügen", "Insert link"],
  };
  const button = (label: string, fn: () => unknown, active = false) => (
    <button
      type="button"
      aria-label={labels[label]?.[lang === "de" ? 0 : 1] || label}
      title={labels[label]?.[lang === "de" ? 0 : 1] || label}
      aria-pressed={label === "↗" ? undefined : active}
      className={active ? "active" : ""}
      onClick={fn}
    >
      {label}
    </button>
  );
  return (
    <div className="editor-wrap">
      {editable && (
        <div className="editor-toolbar">
          {button(
            "B",
            () => editor?.chain().focus().toggleBold().run(),
            editor?.isActive("bold"),
          )}
          {button(
            "I",
            () => editor?.chain().focus().toggleItalic().run(),
            editor?.isActive("italic"),
          )}
          {button("H1", () =>
            editor?.chain().focus().toggleHeading({ level: 1 }).run(),
          )}
          {button("H2", () =>
            editor?.chain().focus().toggleHeading({ level: 2 }).run(),
          )}
          {button("•", () => editor?.chain().focus().toggleBulletList().run())}
          {button("1.", () =>
            editor?.chain().focus().toggleOrderedList().run(),
          )}
          {button("❝", () => editor?.chain().focus().toggleBlockquote().run())}
          {button("</>", () => editor?.chain().focus().toggleCodeBlock().run())}
          {button("↗", () => {
            const href = window.prompt("URL (https://…)");
            if (href && /^https?:\/\//i.test(href))
              editor?.chain().focus().setLink({ href }).run();
          })}
          <select
            aria-label="Seite verlinken / Link a page"
            value=""
            onChange={(e) => {
              if (e.target.value)
                editor
                  ?.chain()
                  .focus()
                  .insertContent({
                    type: "text",
                    text:
                      documents.find((d) => d.id === e.target.value)?.title ||
                      "Page",
                    marks: [
                      {
                        type: "link",
                        attrs: {
                          href: `${window.location.origin}/?doc=${e.target.value}`,
                        },
                      },
                    ],
                  })
                  .run();
            }}
          >
            <option value="">↗ Seite / Page</option>
            {documents.map((d) => (
              <option key={d.id} value={d.id}>
                {d.title}
              </option>
            ))}
          </select>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}
