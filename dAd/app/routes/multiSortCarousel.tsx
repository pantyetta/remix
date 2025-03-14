import {
  Active,
  closestCorners,
  CollisionDetection,
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  UniqueIdentifier,
} from "@dnd-kit/core";
import { Over } from "@dnd-kit/core/dist/store";
import {
  arrayMove,
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useState } from "react";
import { Droppable } from "~/components/Droppable";
import { Sortable } from "~/components/Sortable";
import { SortableItem } from "~/components/SortableItem";
import { v4 as uuidv4 } from "uuid";
import { Button } from "~/components/ui/button";
import {
  Carousel,
  CarouselContent,
  CarouselDots,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "~/components/ui/carousel";
import { Card, CardContent } from "~/components/ui/card";

const sampleProjectData = {
  id: "PJ1",
  name: "Project 1",
  description: "This is project 1",
  image_url: "",
  lists: [
    {
      id: "L1",
      title: "List 1",
      tickets: [
        { id: "T1", title: "Ticket 1", description: "This is ticket 1" },
        { id: "T2", title: "Ticket 2", description: "This is ticket 2" },
        { id: "T3", title: "Ticket 3", description: "This is ticket 3" },
      ],
    },
    {
      id: "L2",
      title: "List 2",
      tickets: [
        { id: "T4", title: "Ticket 4", description: "This is ticket 4" },
        { id: "T5", title: "Ticket 5", description: "This is ticket 5" },
        { id: "T6", title: "Ticket 6", description: "This is ticket 6" },
      ],
    },
    {
      id: "L3",
      title: "List 3",
      tickets: [
        { id: "T7", title: "Ticket 7", description: "This is ticket 7" },
        { id: "T8", title: "Ticket 8", description: "This is ticket 8" },
        { id: "T9", title: "Ticket 9", description: "This is ticket 9" },
      ],
    },
  ],
};

type ProjectDetail = typeof sampleProjectData;

export default function MultiSort() {
  const [projectData, setProjectData] =
    useState<ProjectDetail>(sampleProjectData);
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);

  function habdleDragStart(event: DragStartEvent): void {
    const { active } = event;
    if (!active) return;
    setActiveId(active.id);
  }

  function handleDragOver(event: DragOverEvent): void {
    const data = getData(event, projectData);
    if (!data) return;
    const { from, to } = data;
    if (from.containerId === to.containerId) return;

    const fromList = projectData.lists.find(
      (list) => list.id == from.containerId
    );
    const toList = projectData.lists.find((list) => list.id == to.containerId);
    if (!fromList || !toList) return;

    const moveTicket = fromList.tickets.find(
      (ticket) => ticket.id === from.items[from.index]
    );
    if (!moveTicket) return;

    const newFromTickets = fromList.tickets.filter(
      (ticket) => ticket.id !== moveTicket.id
    );
    const newToTickets = [
      ...toList.tickets.slice(0, to.index),
      moveTicket,
      ...toList.tickets.slice(to.index),
    ];
    const newLists = projectData.lists.map((list) => {
      if (list.id === from.containerId)
        return { ...list, tickets: newFromTickets };
      if (list.id === to.containerId) return { ...list, tickets: newToTickets };
      return list;
    });
    setProjectData({ ...projectData, lists: newLists });
  }

  // 同じコンテナ内の移動
  function handleDragEnd(event: DragEndEvent): void {
    setActiveId(null);

    const data = getData(event, projectData);
    if (!data) return;

    const { from, to } = data;
    if (from.containerId !== to.containerId) return;
    const list = projectData.lists.find((list) => list.id == from.containerId);
    if (!list) return;
    const newTickets = arrayMove(list.tickets, from.index, to.index);
    const newLists = projectData.lists.map((list) => {
      if (list.id === from.containerId) return { ...list, tickets: newTickets };
      return list;
    });

    setProjectData({ ...projectData, lists: newLists });
  }

  function getData(
    event: { active: Active; over: Over | null },
    projectData: ProjectDetail
  ) {
    const { active, over } = event;
    if (!active || !over) return;
    if (active.id === over.id) return;

    const fromData = active.data.current?.sortable;
    if (!fromData) return;

    const toData = over.data.current?.sortable;
    const toDataNotSortable = {
      containerId: over.id,
      index: NaN,
      items: NaN,
    };
    return {
      from: fromData,
      to: toData ?? toDataNotSortable,
    };
  }

  const customClosestCorners: CollisionDetection = (args) => {
    const cornerCollisions = closestCorners(args);
    // 一番近いリストのコンテナを取得
    const listIds = new Set(projectData.lists.map((list) => list.id));
    const closestContainer = cornerCollisions.find((c) => {
      return listIds.has(c.id.toString());
    });
    if (!closestContainer) return cornerCollisions;
    // closestContainerの中のチケットのみを取得
    const collisions = cornerCollisions.filter(({ data }) => {
      if (!data) return false;
      const droppableData = data.droppableContainer?.data?.current;
      if (!droppableData) return false;
      const { containerId } = droppableData.sortable;
      return closestContainer.id === containerId;
    });
    // 中身のチケットがない場合は、closestContainerを返す
    if (collisions.length === 0) {
      return [closestContainer];
    }
    // 中身のチケットがある場合は、collisionsを返す
    return collisions;
  };

  function handleAddColumn(): void {
    const currentData = projectData.lists;

    const id = uuidv4();

    const newData = {
      id,
      title: "List " + id,
      tickets: [],
    };
    currentData.push(newData);
    setProjectData({ ...projectData, lists: currentData });
  }
  console.log(projectData.lists.length);

  return (
    <div>
      <div className="flex justify-center items-center w-screen h-screen">
        <DndContext
          onDragStart={habdleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
          collisionDetection={customClosestCorners}
          id={projectData.id}
        >
          <div className="flex justify-center items-center w-screen h-screen gap-8">
            {projectData.lists.map((list, index) =>
              index < 3 ? (
                <SortableContext
                  items={list.tickets}
                  key={list.id}
                  id={list.id}
                  strategy={verticalListSortingStrategy}
                >
                  <Droppable key={list.id} id={list.id}>
                    <div className="flex flex-col gap-8 p-4 border min-h-[600px] min-w-44">
                      <p>{list.title}</p>
                      {list.tickets.map((ticket) => (
                        <Sortable key={ticket.id} id={ticket.id}>
                          <SortableItem itemId={ticket.id} />
                        </Sortable>
                      ))}
                    </div>
                  </Droppable>
                </SortableContext>
              ) : null
            )}
            <div className="ml-6">
              <Carousel className="w-full max-w-xs" opts={{ watchDrag: false }}>
                <CarouselContent>
                  {projectData.lists.map((list, index) =>
                    index >= 3 ? (
                      <CarouselItem key={index}>
                        <div className="p-1">
                          <SortableContext
                            items={list.tickets}
                            key={list.id}
                            id={list.id}
                            strategy={verticalListSortingStrategy}
                          >
                            <Droppable key={list.id} id={list.id}>
                              <div className="flex flex-col gap-8 p-4 border min-h-[600px] min-w-44">
                                <p>{list.title}</p>
                                {list.tickets.map((ticket) => (
                                  <Sortable key={ticket.id} id={ticket.id}>
                                    <SortableItem itemId={ticket.id} />
                                  </Sortable>
                                ))}
                              </div>
                            </Droppable>
                          </SortableContext>
                        </div>
                      </CarouselItem>
                    ) : null
                  )}
                </CarouselContent>
                {projectData.lists.length > 4 ? (
                  <>
                    <CarouselPrevious />
                    <CarouselNext />
                    <CarouselDots />
                  </>
                ) : null}
              </Carousel>
              {activeId && (
                <DragOverlay>
                  <SortableItem itemId={activeId} />
                </DragOverlay>
              )}
            </div>
          </div>
        </DndContext>
      </div>
      <Button
        onClick={handleAddColumn}
        className="w-full h-20 fixed bottom-0 border flex justify-center items-cente"
      >
        Add column
      </Button>
    </div>
  );
}
