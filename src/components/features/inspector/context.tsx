"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

import { useShell } from "@/components/layout/shell";

export type InspectorTab = "posts" | "files";

interface InspectorState {
  tab: InspectorTab;
  /** Shows `tab` in the right side, opening the side if it is shut. */
  show: (tab: InspectorTab) => void;
}

const InspectorContext = createContext<InspectorState | null>(null);

export function InspectorProvider({ children }: { children: ReactNode }) {
  const { right } = useShell();
  const [tab, setTab] = useState<InspectorTab>("posts");

  const show = (next: InspectorTab) => {
    setTab(next);
    if (right.collapsed) right.open();
  };

  return <InspectorContext value={{ tab, show }}>{children}</InspectorContext>;
}

export function useInspector() {
  const inspector = useContext(InspectorContext);
  if (!inspector) {
    throw new Error("useInspector must be used inside <InspectorProvider>");
  }
  return inspector;
}
