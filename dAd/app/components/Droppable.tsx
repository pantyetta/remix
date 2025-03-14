import { useDroppable } from "@dnd-kit/core";

type DroppableProps = {
  children: React.ReactNode;
  id: string;
};

export function Droppable({ children, id }: DroppableProps) {
  const { isOver, setNodeRef } = useDroppable({
    id,
  });

  return (
    <div ref={setNodeRef} className={isOver ? "border border-red-400" : ""}>
      {children}
    </div>
  );
}
