import { DndContext, DragEndEvent, UniqueIdentifier } from "@dnd-kit/core";
import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";
import { Draggable } from "~/components/Draggable";
import { Droppable } from "~/components/Droppable";

export const meta: MetaFunction = () => {
  return [
    { title: "New Remix App" },
    { name: "description", content: "Welcome to Remix!" },
  ];
};

export default function Index() {
  const containers = ["A", "B", "C"];
  const [parent, setParent] = useState<UniqueIdentifier | null>(null);

  function handleDragEnd(event: DragEndEvent) {
    const { over } = event;
    setParent(over ? over.id : null);
  }


  

  const draggbleMarkup = (
    <Draggable id="draggable">
      <div className="cursor-grab w-48 h-20 bg-blue-200 flex justify-center items-center">
        Drag me
      </div>
    </Draggable>
  );

  return (
    <DndContext onDragEnd={handleDragEnd}>
      <div className="flex flex-col justify-center items-center w-screen h-32 gap-8">
        <div className="flex h-20">
          {parent == null ? draggbleMarkup : null}
        </div>
      </div>

      <div className="flex">
        {containers.map((id) => (
          <Droppable key={id} id={id}>
            <div className="w-52 h-24 border-2 border-dashed border-gray-100/50 flex justify-center items-center">
              {parent === id ? draggbleMarkup : "Drop here"}
            </div>
          </Droppable>
        ))}
      </div>
    </DndContext>
  );
}
