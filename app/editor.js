"use client";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
export default function Editor({
  content,
  editable,
  onChange,
  documents = [],
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
    onUpdate: ({ editor }) => onChange?.(editor.getJSON()),
  });
  const button = (label, fn, active = false) => (
    <button type="button" className={active ? "active" : ""} onClick={fn}>
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
