import {
  ArrowDown,
  ArrowUp,
  Calendar,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  Download,
  Ellipsis,
  FilePen,
  FilePlus,
  FileText,
  Folder,
  FolderOpen,
  FolderPlus,
  Globe,
  List,
  MessageCircle,
  MessageSquare,
  Moon,
  PanelRight,
  Pen,
  Plug,
  Puzzle,
  RefreshCw,
  Repeat2,
  Search,
  Send,
  Square,
  SquarePen,
  Sun,
  Terminal,
  ThumbsUp,
  Trash2,
  TriangleAlert,
  ExternalLink,
  X,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps, FC } from "react";

import { cn } from "@/lib/cn";

import { BrandMark } from "./brand-mark";

/** v2's icon names (its Font Awesome kit), drawn with Lucide. */
const LUCIDE_ICONS = {
  "arrow-down": ArrowDown,
  "arrow-up": ArrowUp,
  "arrows-rotate": RefreshCw,
  calendar: Calendar,
  check: Check,
  "chevron-down": ChevronDown,
  "chevron-left": ChevronLeft,
  "chevron-right": ChevronRight,
  comment: MessageCircle,
  copy: Copy,
  download: Download,
  "earth-americas": Globe,
  ellipsis: Ellipsis,
  "file-lines": FileText,
  "file-pen": FilePen,
  "file-plus": FilePlus,
  folder: Folder,
  "folder-open": FolderOpen,
  "folder-plus": FolderPlus,
  list: List,
  "magnifying-glass": Search,
  message: MessageSquare,
  moon: Moon,
  "paper-plane": Send,
  pen: Pen,
  "pen-to-square": SquarePen,
  plug: Plug,
  "puzzle-piece": Puzzle,
  repost: Repeat2,
  sidebar: PanelRight,
  stop: Square,
  sun: Sun,
  terminal: Terminal,
  "thumbs-up": ThumbsUp,
  trash: Trash2,
  "triangle-exclamation": TriangleAlert,
  "up-right-from-square": ExternalLink,
  xmark: X,
} as const satisfies Record<string, LucideIcon>;

/** Lucide dropped brand icons; these are the brands' own marks. */
const LinkedInIcon: FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28ZM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13ZM7.12 20.45H3.56V9h3.56v11.45Z" />
  </svg>
);

const XIcon: FC = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.24 2.25h3.31l-7.23 8.26 8.5 11.24h-6.66l-5.21-6.82-5.97 6.82H1.67l7.73-8.84L1.25 2.25h6.83l4.71 6.23 5.45-6.23Zm-1.16 17.52h1.83L7.08 4.13H5.12l11.96 15.64Z" />
  </svg>
);

const CUSTOM_ICONS = {
  "linkedin-in": LinkedInIcon,
  "x-twitter": XIcon,
  imagine: () => <BrandMark className="size-[1em]" />,
} as const satisfies Record<string, FC>;

export type IconName = keyof typeof LUCIDE_ICONS | keyof typeof CUSTOM_ICONS;

export type IconSize = "s" | "m" | "l" | "xl";

type IconProps = Omit<ComponentProps<"span">, "children"> & {
  name: IconName;
  size?: IconSize;
};

export function Icon({ name, size = "m", className, ...props }: IconProps) {
  const Glyph: FC =
    name in CUSTOM_ICONS
      ? CUSTOM_ICONS[name as keyof typeof CUSTOM_ICONS]
      : LUCIDE_ICONS[name as keyof typeof LUCIDE_ICONS];

  return (
    <span
      data-slot="icon"
      data-size={size}
      aria-hidden="true"
      className={cn(className)}
      {...props}
    >
      <Glyph />
    </span>
  );
}
