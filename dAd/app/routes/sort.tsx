import { DndContext, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext } from "@dnd-kit/sortable";
import { useState } from "react";
import { Sortable } from "~/components/Sortable";
import { SortableItem } from "~/components/SortableItem";

export default function Sort() {
  const [Items, setItems] = useState({
    id: "list-sample",
    title: "List sample",
    cards: [
      { id: "card-1", title: "Card 1" },
      { id: "card-2", title: "Card 2" },
      { id: "card-3", title: "Card 3" },
    ],
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    if (active.id === over.id) return;

    const oldSortable = active.data.current?.sortable;
    const newSortable = over.data.current?.sortable;

    if (!oldSortable || !newSortable) return;

    setItems({
      ...Items,
      cards: arrayMove(Items.cards, oldSortable.index, newSortable.index),
    });
  }

  return (
    <div className="flex justify-center items-center w-screen h-screen">
      <DndContext onDragEnd={handleDragEnd} id={Items.id}>
        <SortableContext items={Items.cards} key={Items.id} id={Items.id}>
          <div className="flex flex-col gap-4 border w-44 p-4">
            {Items.cards.map((card) => (
              <Sortable key={card.id} id={card.id}>
                <SortableItem itemId={card.id} />
              </Sortable>
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
