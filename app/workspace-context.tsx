"use client";
import { createContext, useContext } from "react";
import type { WorkspaceState } from "../lib/types";
import type { useWorkspaceController } from "./use-workspace";
export type WorkspaceContextValue = ReturnType<
  typeof useWorkspaceController
> & { data: WorkspaceState };
export const WorkspaceContext = createContext<WorkspaceContextValue | null>(
  null,
);
export function useWorkspace() {
  const value = useContext(WorkspaceContext);
  if (!value) throw new Error("Workspace provider missing");
  return value;
}
