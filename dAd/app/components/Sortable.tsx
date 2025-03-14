import { UniqueIdentifier } from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type SortableProps = {
  children: React.ReactNode;
  id: UniqueIdentifier;
};

export function Sortable({ children, id }: SortableProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    backgroundColor: isDragging ? "green" : undefined,
  };

  return <div className="bg-blue-100" ref={setNodeRef} style={style} {...attributes} {...listeners}>{children}</div>
}
