"use client";

import { Dialog } from "radix-ui";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
  type RefObject,
} from "react";
import {
  usePanelRef,
  type PanelImperativeHandle,
} from "react-resizable-panels";

import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import { cn } from "@/lib/cn";

/** v2's metrics: left 224px open, 184 to 360, 48 as icons; right 30%, 320 to 640. */
const LEFT_PANEL = {
  default: "14rem",
  min: "11.5rem",
  max: "22.5rem",
  collapsed: "3rem",
} as const;

const RIGHT_PANEL = {
  default: "30%",
  min: "20rem",
  max: "40rem",
  collapsed: "0%",
} as const;

/** Tailwind `lg`. Below it the right side is a sheet over the page, not a column. */
const RIGHT_COLUMN_QUERY = "(min-width: 1024px)";

function useMediaQuery(query: string) {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const media = window.matchMedia(query);
      media.addEventListener("change", onChange);
      return () => media.removeEventListener("change", onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => true,
  );
}

interface ShellSide {
  panelRef: RefObject<PanelImperativeHandle | null>;
  /** Shut: a collapsed column, or a closed sheet below `lg`. */
  collapsed: boolean;
  sync: () => void;
  open: () => void;
  toggle: () => void;
}

interface ShellRightSide extends ShellSide {
  column: boolean;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
}

const ShellContext = createContext<{
  left: ShellSide;
  right: ShellRightSide;
} | null>(null);

function usePanelSide() {
  const panelRef = usePanelRef();
  const [collapsed, setCollapsed] = useState(false);
  const sync = useCallback(() => {
    setCollapsed(panelRef.current?.isCollapsed() ?? false);
  }, [panelRef]);
  const open = useCallback(() => panelRef.current?.expand(), [panelRef]);
  const toggle = useCallback(() => {
    const panel = panelRef.current;
    if (!panel) return;
    if (panel.isCollapsed()) panel.expand();
    else panel.collapse();
  }, [panelRef]);
  return useMemo(
    () => ({ panelRef, collapsed, sync, open, toggle }),
    [panelRef, collapsed, sync, open, toggle],
  );
}

function useRightSide(): ShellRightSide {
  const panel = usePanelSide();
  const column = useMediaQuery(RIGHT_COLUMN_QUERY);
  const [sheetOpen, setSheetOpen] = useState(false);

  return useMemo(
    () =>
      column
        ? { ...panel, column, sheetOpen, setSheetOpen }
        : {
            ...panel,
            column,
            sheetOpen,
            setSheetOpen,
            collapsed: !sheetOpen,
            open: () => setSheetOpen(true),
            toggle: () => setSheetOpen((wasOpen) => !wasOpen),
          },
    [panel, column, sheetOpen],
  );
}

export function useShell() {
  const shell = useContext(ShellContext);
  if (!shell) throw new Error("useShell must be used inside <Shell.Frame>");
  return shell;
}

/** One resizable row: a left rail, the center, and a right side. */
function ShellFrame({ children }: { children: ReactNode }) {
  const left = usePanelSide();
  const right = useRightSide();

  return (
    <ShellContext value={{ left, right }}>
      <div className="bg-imagine-background flex h-dvh overflow-hidden">
        <ResizablePanelGroup
          id="shell"
          orientation="horizontal"
          className="min-h-0 min-w-0 flex-1 max-md:[&>#left]:hidden! max-md:[&>#left-resize]:hidden!"
        >
          {children}
        </ResizablePanelGroup>
      </div>
    </ShellContext>
  );
}

function ShellLeft({ children }: { children: ReactNode }) {
  const { left } = useShell();

  return (
    <>
      <ResizablePanel
        id="left"
        panelRef={left.panelRef}
        defaultSize={LEFT_PANEL.default}
        minSize={LEFT_PANEL.min}
        maxSize={LEFT_PANEL.max}
        collapsible
        collapsedSize={LEFT_PANEL.collapsed}
        groupResizeBehavior="preserve-pixel-size"
        onResize={left.sync}
        className="min-h-0 w-full min-w-0 overflow-hidden"
      >
        {children}
      </ResizablePanel>
      <ResizableHandle id="left-resize" aria-label="Resize sidebar" />
    </>
  );
}

function ShellCenter({ children }: { children: ReactNode }) {
  return (
    <ResizablePanel
      id="center"
      minSize="30%"
      style={{ overflow: "visible" }}
      className="min-h-0 min-w-0"
    >
      <div className="bg-imagine-surface shadow-raised md:rounded-l-surface relative flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-none">
        {children}
      </div>
    </ResizablePanel>
  );
}

/** A resizable column from `lg`; below it, a sheet over the page. */
function ShellRight({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  const { right } = useShell();

  if (!right.column) {
    return (
      <Dialog.Root open={right.sheetOpen} onOpenChange={right.setSheetOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="bg-imagine-foreground/10 fixed inset-0 z-30" />
          <Dialog.Content
            aria-describedby={undefined}
            className="bg-imagine-surface fixed inset-y-0 right-0 z-40 flex w-96 flex-col overflow-hidden outline-none max-md:w-full"
          >
            <Dialog.Title className="sr-only">{label}</Dialog.Title>
            {children}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    );
  }

  return (
    <>
      <ResizableHandle id="right-resize" aria-label={`Resize ${label}`} />
      <ResizablePanel
        id="right"
        aria-label={label}
        panelRef={right.panelRef}
        defaultSize={RIGHT_PANEL.default}
        minSize={RIGHT_PANEL.min}
        maxSize={RIGHT_PANEL.max}
        collapsible
        collapsedSize={RIGHT_PANEL.collapsed}
        groupResizeBehavior="preserve-pixel-size"
        onResize={right.sync}
        className="bg-imagine-surface flex h-full min-h-0 flex-col"
      >
        <div
          inert={right.collapsed}
          style={{ minWidth: RIGHT_PANEL.min }}
          className={cn(
            "flex h-full min-h-0 w-full flex-col transition-opacity duration-200 ease-out motion-reduce:transition-none",
            right.collapsed && "opacity-0",
          )}
        >
          {children}
        </div>
      </ResizablePanel>
    </>
  );
}

/** The shell family, as in v2: `<Shell.Frame>` holds `Left`, `Center`, and `Right`. */
export const Shell = {
  Frame: ShellFrame,
  Left: ShellLeft,
  Center: ShellCenter,
  Right: ShellRight,
};
