"use client";
import { FileText, Globe, Plus } from "lucide-react";
import type { ReactNode } from "react";
import { useState } from "react";

import dynamic from "next/dynamic";
import { errorMessage } from "../../lib/client";
import { Badge, Empty } from "../ui/primitives";
import { useWorkspace } from "../workspace-context";
const Editor = dynamic(() => import("../editor"), { ssr: false });
export function DocumentsView() {
  const [saveError, setSaveError] = useState("");
  const [editorEpoch, setEditorEpoch] = useState(0);
  const {
    lang,
    data,
    project,
    setModal,
    docId,
    busy,
    error,
    draft,
    setDraft,
    draftRevision,
    setDraftRevision,
    dirty,
    setDirty,
    t,
    admin,
    notify,
    load,
    mutate,
    openDoc,
    fmt,
    projects,
    selected,
    docs,
    doc,
    projectOf,
  } = useWorkspace();

  function documentTree(parent: string | null = null, depth = 0): ReactNode {
    return docs
      .filter(
        (d) =>
          (docs.some((p) => p.id === d.parent_id) ? d.parent_id : null) ===
          parent,
      )
      .map((d) => (
        <div key={d.id}>
          <button
            aria-current={docId === d.id ? "page" : undefined}
            className={`doc-item ${docId === d.id ? "selected" : ""}`}
            style={{ paddingLeft: 16 + depth * 16 }}
            onClick={() => openDoc(d.id)}
          >
            <FileText size={16} />
            <span>{d.title}</span>
            {!!d.is_template && <small>T</small>}
            {!!d.visible && <Globe size={12} />}
          </button>
          {depth < 10 && documentTree(d.id, depth + 1)}
        </div>
      ));
  }

  return (
    <div className="documents-layout">
      <aside className="doc-tree">
        <h2>
          {t("documents")}
          <span>{docs.length}</span>
        </h2>
        {documentTree()}
        {admin && (
          <button
            className="text-button"
            onClick={() =>
              setModal({
                type: "document",
                project_id: project || doc?.project_id || data.projects[0]?.id,
                parent_id: docId,
              })
            }
          >
            <Plus size={14} />
            {t("newDoc")}
          </button>
        )}
      </aside>
      <div className="document-main">
        {doc ? (
          <>
            <div className="document-top">
              <Badge status={doc.visible ? "done" : ""}>
                {t(doc.visible ? "shared" : "internal")}
              </Badge>
              <div>
                {admin && (
                  <>
                    <label className="inline-check">
                      <input
                        type="checkbox"
                        checked={!!doc.visible}
                        disabled={dirty || busy}
                        title={
                          dirty
                            ? lang === "de"
                              ? "Bitte zuerst den Entwurf speichern"
                              : "Save your draft first"
                            : undefined
                        }
                        onChange={(e) =>
                          mutate(`documents/${doc.id}`, "PATCH", {
                            visible: e.target.checked,
                            expected_revision: doc.revision,
                          }).catch(() => {})
                        }
                      />
                      {t("visible")}
                    </label>
                    <button
                      disabled={!dirty || busy}
                      className="primary small"
                      onClick={async () => {
                        try {
                          await mutate(`documents/${doc.id}`, "PATCH", {
                            content: draft,
                            expected_revision: draftRevision ?? doc.revision,
                          });
                          setDirty(false);
                          setDraftRevision(null);
                          notify(t("saved"));
                          setSaveError("");
                        } catch (error) {
                          setSaveError(errorMessage(error));
                        }
                      }}
                    >
                      {busy ? t("working") : t("save")}
                    </button>
                  </>
                )}
              </div>
            </div>
            <small className="muted">{projectOf(doc.project_id)?.name}</small>
            <h2 className="document-title">{doc.title}</h2>
            {saveError && (
              <div className="error" role="alert">
                <p>{saveError}</p>
                <button
                  className="secondary"
                  onClick={async () => {
                    if (
                      dirty &&
                      !window.confirm(
                        lang === "de"
                          ? "Lokalen Entwurf verwerfen und aktuellen Stand laden?"
                          : "Discard your local draft and load the latest version?",
                      )
                    )
                      return;
                    await load();
                    setDirty(false);
                    setDraft(null);
                    setDraftRevision(null);
                    setSaveError("");
                    setEditorEpoch((n) => n + 1);
                  }}
                >
                  {lang === "de"
                    ? "Aktuellen Stand laden"
                    : "Load latest version"}
                </button>
              </div>
            )}
            <Editor
              lang={lang}
              key={`${doc.id}:${editorEpoch}`}
              content={dirty && draft ? draft : doc.content}
              editable={admin}
              onChange={(value) => {
                if (!dirty) setDraftRevision(doc.revision);
                setDraft(value);
                setDirty(true);
              }}
              documents={data.documents.filter(
                (d) => d.project_id === doc.project_id,
              )}
            />
            <div className="doc-footer">
              {fmt(doc.updated_at, true)}{" "}
              {admin && "· # Markdown · **bold** · > quote"}
            </div>
          </>
        ) : (
          <Empty>{t("empty")}</Empty>
        )}
      </div>
    </div>
  );
}
