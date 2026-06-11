// Drag-sorting wrapper that connects the whole link card to dnd-kit sorting.

import { useRef } from "react";
import { Feedback } from "@dnd-kit/dom";
import { useDragDropMonitor } from "@dnd-kit/react";
import { useSortable } from "@dnd-kit/react/sortable";

import { LinkCard } from "@/components/link-card";
import type { IconFile, InterfaceSize, Link } from "@/domain/types";

type SortableLinkCardProps = {
  link: Link;
  categoryId: string;
  index: number;
  onOpenLink: (link: Link, options?: { newWindow?: boolean }) => boolean;
  onEditLink: (link: Link) => void;
  onDeleteLink: (link: Link) => Promise<void>;
  getIconFile: (id: string) => Promise<IconFile | undefined>;
  interfaceSize: InterfaceSize;
};

/** Lets a link card open on click and participate in sorting while dragged. */
export function SortableLinkCard({
  link,
  categoryId,
  index,
  onOpenLink,
  onEditLink,
  onDeleteLink,
  getIconFile,
  interfaceSize,
}: SortableLinkCardProps) {
  const { handleRef, isDragging, ref } = useSortable({
    id: link.id,
    group: categoryId,
    index,
    type: "link",
    accept: "link",
    data: {
      categoryId,
      linkId: link.id,
      type: "link",
    },
    plugins: (defaults) => [...defaults, Feedback.configure({ feedback: "clone" })],
    transition: {
      duration: 180,
      easing: "ease-out",
    },
  });
  const suppressOpenUntilRef = useRef(0);

  useDragDropMonitor({
    onDragStart(event) {
      if (event.operation.source?.id === link.id) {
        suppressOpenUntilRef.current = Number.POSITIVE_INFINITY;
      }
    },
    onDragEnd(event) {
      if (event.operation.source?.id === link.id) {
        suppressOpenUntilRef.current = Date.now() + 350;
      }
    },
  });

  function setCardRef(element: HTMLDivElement | null): void {
    ref(element);
    handleRef(element);
  }

  return (
    <div className="h-full w-full">
      <LinkCard
        link={link}
        onOpenLink={(targetLink, options) => {
          if (Date.now() < suppressOpenUntilRef.current) {
            return false;
          }

          return onOpenLink(targetLink, options);
        }}
        onEditLink={onEditLink}
        onDeleteLink={onDeleteLink}
        getIconFile={getIconFile}
        interfaceSize={interfaceSize}
        isDragging={isDragging}
        cardDragProps={{
          ref: setCardRef,
        }}
      />
    </div>
  );
}
